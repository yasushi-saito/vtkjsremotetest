
// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

//import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
//import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';

import vtkSynchronizableRenderWindow, {SynchContext} from '@kitware/vtk.js/Rendering/Misc/SynchronizableRenderWindow';

import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';

//import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
//import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
//import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import SmartConnect from 'wslink/src/SmartConnect';

type WSSession = any;

export class Client {
  private readonly sc: SmartConnect;
  private readonly synchCtx: SynchContext;
  private readonly renderWindow: vtkSynchronizableRenderWindow;
  private readonly openGL: vtkOpenGLRenderWindow;
  private session: WSSession | null;

  constructor(elem: HTMLElement) {
    this.synchCtx = vtkSynchronizableRenderWindow.getSynchronizerContext();
    this.synchCtx.setFetchArrayFunction(this.getArray)
    console.log(`SYNC: ${this.synchCtx}`);
    this.renderWindow = vtkSynchronizableRenderWindow.newInstance({synchronizerContext: this.synchCtx});

    this.openGL = vtkOpenGLRenderWindow.newInstance();
    this.openGL.setContainer(elem);
    this.renderWindow.addView(this.openGL);
    const interactor = vtkRenderWindowInteractor.newInstance();
    interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
    interactor.setView(this.openGL);
    interactor.initialize();
    interactor.bindEvents(elem);

    const config = { sessionURL: 'ws://localhost:1234/ws' };
    this.sc = SmartConnect.newInstance({config});
    this.sc.onConnectionReady(this.onConnectionReady);
    this.sc.onConnectionError(console.error);
    this.sc.onConnectionClose(console.error);
    this.sc.connect();
  }

  onConnectionReady(conn: any) {
    this.session = conn.getSession();

    // Bind user input
    //this.renderWindow.getInteractor().onStartAnimation(viewStream.startInteraction);
    //this.renderWindow.getInteractor().onEndAnimation(viewStream.endInteraction);

    // renderWindow.synchronize(state);
    console.log(`CONNECTED`);
    this.renderWindow.render();

    const fn = async () => {
      console.log(`start geometry.view.get.state`);
      const buf = await this.session.call('viewport.geometry.view.get.state');
      console.log(`end geometry.view.get.state`);
      return buf;
    };
    fn();
  }

  getArray(hash: string, binary: boolean): Promise<ArrayBuffer> {
    if (!this.session) return Promise.resolve(null);
    const fn = async (): Promise<ArrayBuffer> => {
      console.log(`start geometry.array.get sha=${hash} bin=${binary}`);
      const buf = await this.session.call('viewport.geometry.array.get', [hash, binary]);
      console.log(`end geometry.array.get sha=${hash} bin=${binary} ${buf}`);
      return buf;
    };
    return fn();
  };
}
