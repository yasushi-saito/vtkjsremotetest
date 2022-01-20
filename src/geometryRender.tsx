
// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

//import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
//import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';

import vtkSynchronizableRenderWindow, {SynchContext, vtkSynchronizableRenderWindowInstance, ViewState} from '@kitware/vtk.js/Rendering/Misc/SynchronizableRenderWindow';

import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';

//import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
//import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
//import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import SmartConnect from 'wslink/src/SmartConnect';

type Session = any;

type ViewId = string;

const DEFAULT_VIEW_ID: ViewId = '-1';

interface Protocol {
  session(): Session;
  registerView(viewId: string, callback: (viewState: ViewState) => void): Promise<ViewId>;
  unregisterView(viewId: string): Promise<void>;
  subscribe(callback: (viewState: ViewState) => void): Promise<void>;
  getState(hash: string, binary: boolean): Promise<ArrayBuffer>;
}

function protocol(session: Session) : Protocol {
  if (!session) throw Error('empty session');
  return {
    session: ()=>session,
    subscribe: async (callback: (viewState: ViewState) => void): Promise<void> => {
      session.subscribe("viewport.geometry.view.subscription", callback);
    },
    registerView: async (viewId: string, callback: (viewState: ViewState) => void): Promise<ViewId> => {
      await session.subscribe('viewport.image.push.subscription', callback);
      const reply = await session.call('viewport.geometry.view.observer.add', [viewId]);
      console.log(`registerView: got view ${JSON.stringify(viewId)}`);
      return reply.viewId;
    },
    unregisterView: async(viewId: string): Promise<void> => {
      await session.call('viewport.geometry.view.observer.remove', [viewId]);
      return;
    },
    getState: async(hash: string, binary: boolean): Promise<ArrayBuffer> => {
      return session.call('viewport.geometry.view.get.state', [hash, binary]);
    }
  };
}

interface Client {
  sc: SmartConnect;
  synchCtx: SynchContext;
  renderWindow: vtkSynchronizableRenderWindowInstance;
  openGL: vtkOpenGLRenderWindow;
  protocol: Protocol | null;
}

export function newClient(elem: HTMLElement): Client {
  const synchCtx = vtkSynchronizableRenderWindow.getSynchronizerContext();
  console.log(`SYNC: ${synchCtx}`);
  const renderWindow = vtkSynchronizableRenderWindow.newInstance({synchronizerContext: synchCtx});

  const openGL = vtkOpenGLRenderWindow.newInstance();
  openGL.setContainer(elem);
  renderWindow.addView(openGL);
  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
  interactor.setView(openGL);
  interactor.initialize();
  interactor.bindEvents(elem);

  const config = { sessionURL: 'ws://localhost:1234/ws' };
  const sc = SmartConnect.newInstance({config});

  const client: Client = {sc, synchCtx, renderWindow, openGL, protocol: null};

  sc.onConnectionReady((conn) => onConnectionReady(client, conn));
  sc.onConnectionError(console.error);
  sc.onConnectionClose(console.error);

  synchCtx.setFetchArrayFunction((hash: string, binary: boolean) => getArray(client, hash, binary));

  sc.connect();

  return client;
}

function onConnectionReady(client: Client, conn: any) {
  console.log(`CONN: `, JSON.stringify(conn));
  console.log(`CONN2: `, conn.getSession());
  client.protocol = protocol(conn.getSession());

  // Bind user input
  //client.renderWindow.getInteractor().onStartAnimation(viewStream.startInteraction);
  //client.renderWindow.getInteractor().onEndAnimation(viewStream.endInteraction);

  // renderWindow.synchronize(state);
  // client.renderWindow.render();

  const fn = async () => {
    console.log(`start registerview`);
    const viewId = await client.protocol.registerView(
      DEFAULT_VIEW_ID,
      (viewState: ViewState)=> {
        client.renderWindow.synchronize(viewState);
      })
    console.log(`got viewid: ${viewId}`);
  };
  fn();
}


function getArray(client: Client, hash: string, binary: boolean): Promise<ArrayBuffer> {
  if (!client.protocol) return Promise.resolve(null);
  const fn = async (): Promise<ArrayBuffer> => {
    console.log(`start geometry.array.get sha=${hash} bin=${binary}`);
    const buf = client.protocol.getState(hash, binary);
    console.log(`end geometry.array.get sha=${hash} bin=${binary} ${buf}`);
    return buf;
  };
  return fn();
}
