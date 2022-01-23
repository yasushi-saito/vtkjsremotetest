// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';

import vtkSynchronizableRenderWindow, { SynchContext, vtkSynchronizableRenderWindowInstance, ViewState } from '@kitware/vtk.js/Rendering/Misc/SynchronizableRenderWindow';

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

import { WebsocketSession } from 'wslink/src/WebsocketConnection';

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
    connection: () => session,
    subscribe: async (callback: (viewState: ViewState[]) => Promise<any>): Promise<void> => {
      session.subscribe('viewport.geometry.view.subscription', callback);
    },
    registerView: async (viewId: string, callback: (viewState: ViewState[]) => Promise<any>): Promise<ViewId> => {
      await session.subscribe('viewport.geometry.view.subscription', callback);
      const reply = await session.call('viewport.geometry.view.observer.add', [viewId]);
      console.log(`registerView: got view ${JSON.stringify(viewId)}`);
      return reply.viewId;
    },
    unregisterView: async (viewId: string): Promise<void> => {
      await session.call('viewport.geometry.view.observer.remove', [viewId]);
    },
    getState: async (hash: string, binary: boolean): Promise<ArrayBuffer> => (
      session.call('viewport.geometry.array.get', [hash, binary])
    ),
  };
}

export interface InteractorSetting {
  action: 'Rotate' | 'Pan' | 'Zoom' | 'Select' | 'Roll';
  button: 1 | 2 | 3 | null;
  shift?: boolean;
  control?: boolean;
  alt?: boolean;
  scrollEnabled?: boolean;
  dragEnabled?: boolean;
}

const DEFAULT_INTERACTOR_SETTINGS: InteractorSetting[] = [
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
  }, {
    button: 1,
    action: 'Pan',
    alt: true,
  }, {
    button: 1,
    action: 'Zoom',
    control: true,
  }, {
    button: 1,
    action: 'Select',
    alt: true,
  }, {
    button: 1,
    action: 'Roll',
    alt: true,
    shift: true,
  },
];

const MANIPULATOR_FACTORY = {
  None: null,
  Pan: vtkMouseCameraTrackballPanManipulator,
  Zoom: vtkMouseCameraTrackballZoomManipulator,
  Roll: vtkMouseCameraTrackballRollManipulator,
  Rotate: vtkMouseCameraTrackballRotateManipulator,
  MultiRotate: vtkMouseCameraTrackballMultiRotateManipulator,
  ZoomToMouse: vtkMouseCameraTrackballZoomToMouseManipulator,
};

function newManipulator(setting: InteractorSetting[]): vtkInteractorStyleManipulator {
  const style = vtkInteractorStyleManipulator.newInstance();
  setting.forEach((item) => {
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

interface Props {
  elem: HTMLElement;
  session: WebsocketSession;
  onRendererReady: (grm: GeometryRenderManager) => void;
  // Defaults to DEFAULT_INTERACTOR_SETTINGS
  interactorSettings?: InteractorSetting[];
}

export default class GeometryRenderManager {
  private readonly synchCtx: SynchContext;
  private readonly renderWindow: vtkSynchronizableRenderWindowInstance;
  private readonly protocol: Protocol;
  private readonly style: vtkInteractorStyleManipulator;
  private readonly localRenderer: vtkRenderer;

  private remoteRenderer: vtkRenderer | null= null;
  private activeCamera: vtkCamera | null = null;
  private remoteCamera: vtkCamera | null = null;

  constructor(private readonly props: Props) {
    this.synchCtx = vtkSynchronizableRenderWindow.getSynchronizerContext();
    this.renderWindow = vtkSynchronizableRenderWindow.newInstance({ synchronizerContext: this.synchCtx });

    const openGL = vtkOpenGLRenderWindow.newInstance();
    openGL.setContainer(props.elem);
    this.renderWindow.addView(openGL);

    const interactor = vtkRenderWindowInteractor.newInstance();
    this.style = newManipulator(props.interactorSettings || DEFAULT_INTERACTOR_SETTINGS);
    interactor.setInteractorStyle(this.style);
    interactor.setView(openGL);
    interactor.initialize();
    interactor.bindEvents(props.elem);

    this.localRenderer = vtkRenderer.newInstance();
    this.localRenderer.setLayer(1);
    this.localRenderer.setInteractive(false);
    this.renderWindow.addRenderer(this.localRenderer);

    this.protocol = protocol(props.session);
    this.synchCtx.setFetchArrayFunction((hash: string, binary: boolean) => this.getArray(hash, binary));

    const fn = async () => {
      console.log('start registerview');
      const viewId = await this.protocol.registerView(
        DEFAULT_VIEW_ID,
        this.viewCallback.bind(this),
      );
      console.log(`got viewid: ${viewId}`);
    };
    fn();
  }

  public getLocalRenderer(): vtkRenderer { return this.localRenderer; }
  public getRemoteRenderer(): vtkRenderer { return this.remoteRenderer; }

  private async viewCallback(viewStates: ViewState[]): Promise<void> {
    const viewState = viewStates[0];
    console.log('viewstate', viewState, JSON.stringify(viewState));
    const progress = this.renderWindow.synchronize(viewState);
    console.log(`viewstate progress ${progress}`);
    if (progress) {
      const renderers = this.renderWindow.getRenderersByReference();
      if (!this.remoteRenderer && renderers.length > 0) {
        // Note: renderer[0] is the localRenderer itself.
        // renderer[1] is the default remote renderer at layer 0.
        [, this.remoteRenderer] = renderers;
        this.activeCamera = this.remoteRenderer.getActiveCamera();
        this.localRenderer.setActiveCamera(this.activeCamera);
        if (
          viewState.extra &&
            viewState.extra.camera &&
            this.activeCamera
        ) {
          this.synchCtx.registerInstance(
            viewState.extra.camera,
            this.activeCamera,
          );
        }
        this.props.onRendererReady(this);
        this.renderWindow.render();
      }
      const success = await progress;
      console.log(`viewstate success ${success}`);
      if (success) {
        if (viewState.extra) {
          if (viewState.extra.camera) {
            this.remoteCamera = this.synchCtx.getInstance(
              viewState.extra.camera,
            );
            if (this.remoteCamera) {
              this.style.setCenterOfRotation(this.remoteCamera.getFocalPoint());
            }
          }

          if (viewState.extra.centerOfRotation) {
            this.style.setCenterOfRotation(viewState.extra.centerOfRotation);
          }
        }

        console.log('renderstart');
        this.renderWindow.render();
        console.log('renderend');
        // console.timeEnd('updateViewState');
        // client.renderWindow.getInteractor().setEnableRender(true);
      }
    }
  }

  private async getArray(hash: string, binary: boolean): Promise<ArrayBuffer> {
    console.log(`getarray ${hash} ${binary}`);
    if (!this.protocol) return Promise.resolve(null);
    return this.protocol.getState(hash, binary);
  }
}
