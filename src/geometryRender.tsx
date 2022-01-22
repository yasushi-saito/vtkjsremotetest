
// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

//import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
//import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';

import vtkSynchronizableRenderWindow, {extraRenderer, SynchContext, vtkSynchronizableRenderWindowInstance, ViewState} from '@kitware/vtk.js/Rendering/Misc/SynchronizableRenderWindow';

import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';

// Style modes
import vtkMouseCameraTrackballMultiRotateManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballMultiRotateManipulator';
import vtkMouseCameraTrackballPanManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballPanManipulator';
import vtkMouseCameraTrackballRollManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballRollManipulator';
import vtkMouseCameraTrackballRotateManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballRotateManipulator';
import vtkMouseCameraTrackballZoomManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomManipulator';
import vtkMouseCameraTrackballZoomToMouseManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomToMouseManipulator';
import vtkGestureCameraManipulator from '@kitware/vtk.js/Interaction/Manipulators/GestureCameraManipulator';

import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

//import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
//import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
//import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import SmartConnect from 'wslink/src/SmartConnect';
import WebsocketConnection, {WebsocketSession} from 'wslink/src/WebsocketConnection';

type ViewId = string;

const DEFAULT_VIEW_ID: ViewId = '-1';

interface Protocol {
  connection(): WebsocketSession;
  registerView(viewId: string, callback: (viewState: ViewState[]) => Promise<void>): Promise<ViewId>;
  unregisterView(viewId: string): Promise<void>;
  subscribe(callback: (viewState: ViewState[]) => Promise<void>): Promise<void>;
  getState(hash: string, binary: boolean): Promise<ArrayBuffer>;
}

function protocol(session: WebsocketSession) : Protocol {
  if (!session) throw Error('empty session');
  return {
    connection: ()=>session,
    subscribe: async (callback: (viewState: ViewState[]) => Promise<any>): Promise<void> => {
      session.subscribe("viewport.geometry.view.subscription", callback);
    },
    registerView: async (viewId: string, callback: (viewState: ViewState[]) => Promise<any>): Promise<ViewId> => {
      await session.subscribe('viewport.geometry.view.subscription', callback);
      const reply = await session.call('viewport.geometry.view.observer.add', [viewId]);
      console.log(`registerView: got view ${JSON.stringify(viewId)}`);
      return reply.viewId;
    },
    unregisterView: async(viewId: string): Promise<void> => {
      await session.call('viewport.geometry.view.observer.remove', [viewId]);
      return;
    },
    getState: async(hash: string, binary: boolean): Promise<ArrayBuffer> => {
      return await session.call('viewport.geometry.array.get', [hash, binary]);
    }
  };
}

interface Client {
  sc: SmartConnect;
  synchCtx: SynchContext;
  renderWindow: vtkSynchronizableRenderWindowInstance;
  openGL: vtkOpenGLRenderWindow;
  protocol: Protocol | null;
  style: vtkInteractorStyleManipulator;
  localRenderer: vtkRenderer;

  renderer: vtkRenderer | null;
  activeCamera: vtkCamera | null;
  remoteCamera?: any;
}

interface InteractorSetting {
  action: string;
  button: 1 | 2 | 3 | null;
  shift?: boolean;
  control?: boolean;
  alt?: boolean;
  scrollEnabled?: boolean;
  dragEnabled?: boolean;
}

const MANIPULATOR_FACTORY = {
  None: null,
  Pan: vtkMouseCameraTrackballPanManipulator,
  Zoom: vtkMouseCameraTrackballZoomManipulator,
  Roll: vtkMouseCameraTrackballRollManipulator,
  Rotate: vtkMouseCameraTrackballRotateManipulator,
  MultiRotate: vtkMouseCameraTrackballMultiRotateManipulator,
  ZoomToMouse: vtkMouseCameraTrackballZoomToMouseManipulator,
};

const INTERACTOR_SETTINGS: InteractorSetting[] = [
  {
    button: 1,
    action: 'Rotate',
  },
  {
    button: 2,
    action: 'Pan',
  }, {
    button: 3,
    action: 'Zoom',
    scrollEnabled: true,
  },  {
    button: 1,
    action: 'Pan',
    alt: true,
  },  {
    button: 1,
    action: 'Zoom',
    control: true,
  },        {
    button: 1,
    action: 'Select',
    alt: true,
  },        {
    button: 1,
    action: 'Roll',
    alt: true,
    shift: true,
  },
];

function newManipulator(): vtkInteractorStyleManipulator {
  const style = vtkInteractorStyleManipulator.newInstance();
  INTERACTOR_SETTINGS.forEach((item) => {
    const klass = MANIPULATOR_FACTORY[item.action];
    if (!klass) return;
    const { button, shift, control, alt, scrollEnabled, dragEnabled } = item;
    const manipulator = klass.newInstance();
    manipulator.setButton(button);
    manipulator.setShift(!!shift);
    manipulator.setControl(!!control);
    manipulator.setAlt(!!alt);
    if (scrollEnabled !== undefined) {
      manipulator.setScrollEnabled(scrollEnabled);
    }
    if (dragEnabled !== undefined) {
      manipulator.setDragEnabled(dragEnabled);
    }
    style.addMouseManipulator(manipulator);
  });
  // Always add gesture
  style.addGestureManipulator(vtkGestureCameraManipulator.newInstance());
  return style;
}

export function newClient(elem: HTMLElement): Client {
  const synchCtx = vtkSynchronizableRenderWindow.getSynchronizerContext();
  console.log(`SYNC: ${synchCtx}`);
  const renderWindow = vtkSynchronizableRenderWindow.newInstance({synchronizerContext: synchCtx});

  const openGL = vtkOpenGLRenderWindow.newInstance();
  openGL.setContainer(elem);
  renderWindow.addView(openGL);

  const interactor = vtkRenderWindowInteractor.newInstance();
  const style = newManipulator();
  interactor.setInteractorStyle(style);
  interactor.setView(openGL);
  interactor.initialize();
  interactor.bindEvents(elem);

  const localRenderer = vtkRenderer.newInstance();
  if (true) {
    const coneSource = vtkConeSource.newInstance();
    const actor = vtkActor.newInstance();
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(coneSource.getOutputPort());
    actor.setMapper(mapper);
    actor.getProperty().setRepresentation(2);
    actor.getProperty().setColor(1, 1, 1);
    actor.getProperty().setInterpolationToFlat();
    localRenderer.resetCamera();
    localRenderer.addActor(actor);
    localRenderer.setLayer(1);
    localRenderer.setInteractive(false);
    renderWindow.addRenderer(localRenderer);
    //console.log(`EXTRA: ${extraRenderer}`);
    //vtkSynchronizableRenderWindow.extraRenderer(renderer);
  }

  const config = { sessionURL: 'ws://localhost:1234/ws' };
  const sc = SmartConnect.newInstance({config});

  const client: Client = {
    sc,
    synchCtx,
    renderWindow,
    openGL,
    style,
    localRenderer,
    protocol: null,
    renderer: null,
    activeCamera: null,
  }

  sc.onConnectionReady((conn) => onConnectionReady(client, conn));
  sc.onConnectionError(console.error);
  sc.onConnectionClose(console.error);

  synchCtx.setFetchArrayFunction((hash: string, binary: boolean) => getArray(client, hash, binary));

  sc.connect();

  return client;
}

function onConnectionReady(client: Client, conn: any) {
  client.protocol = protocol(conn.getSession());


  // renderWindow.synchronize(state);
  // client.renderWindow.render();

  const viewCallback = async (viewStates: ViewState[]): Promise<void> => {
    const viewState = viewStates[0];
    console.log(`viewstate`, viewState, JSON.stringify(viewState));
    const progress = client.renderWindow.synchronize(viewState);
    console.log(`viewstate progress ${progress}`);
    if (progress) {
      console.log(`RENDERWINDOW: ${client.renderWindow.getRenderersByReference()}`);
      client.renderWindow.getRenderersByReference().forEach((r, i) => {
        console.log(`RENDERWINDOW ${i}: ${r.getLayer()}`);
      });

      if (!client.renderer && client.renderWindow.getRenderersByReference().length) {
        const renderers = client.renderWindow.getRenderersByReference();
        // Note: renderer[0] is the localRenderer itself.
        // renderer[1] is the default remote renderer at layer 0.
        client.renderer = renderers[1];
        client.activeCamera = client.renderer.getActiveCamera();
        console.log(`SECATCIVE`);
        client.localRenderer.setActiveCamera(client.activeCamera);
      }
      if (
        viewState.extra &&
        viewState.extra.camera &&
        client.activeCamera
      ) {
        client.synchCtx.registerInstance(
          viewState.extra.camera,
          client.activeCamera
        );
      }
    }
    const success = await progress;
    console.log(`viewstate success ${success}`);
    if (success) {
      if (viewState.extra) {
        if (viewState.extra.camera) {
          client.remoteCamera = client.synchCtx.getInstance(
            viewState.extra.camera
          );
          if (client.remoteCamera) {
            client.style.setCenterOfRotation(client.remoteCamera.getFocalPoint());
          }
        }

        if (viewState.extra.centerOfRotation) {
          client.style.setCenterOfRotation(viewState.extra.centerOfRotation);
        }
      }

      console.log(`renderstart`);
      client.renderWindow.render();
      console.log(`renderend`);
      // console.timeEnd('updateViewState');
      // client.renderWindow.getInteractor().setEnableRender(true);
    }
  };

  const fn = async () => {
    console.log(`start registerview`);
    const viewId = await client.protocol.registerView(
      DEFAULT_VIEW_ID,
      viewCallback);
    console.log(`got viewid: ${viewId}`);
  };
  fn();
}


function getArray(client: Client, hash: string, binary: boolean): Promise<ArrayBuffer> {
  console.log(`getarray ${hash} ${binary}`);
  if (!client.protocol) return Promise.resolve(null);
  const fn = async (): Promise<ArrayBuffer> => {
    const buf = client.protocol.getState(hash, binary);
    return buf;
  };
  return fn();
}
