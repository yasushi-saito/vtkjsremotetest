// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';

import vtkSynchronizableRenderWindow, { ISynchronizerContext, IViewState } from '@kitware/vtk.js/Rendering/Misc/SynchronizableRenderWindow';

import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';

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

// Wrapper around WebsocketSession to provide typesafe RPC methods.
interface Protocol {
  // Returns the session object passed to the constructor.
  session(): WebsocketSession;
  registerView(viewId: string, callback: (viewState: IViewState[]) => Promise<void>): Promise<ViewId>;
  unregisterView(viewId: string): Promise<void>;
  subscribe(callback: (viewState: IViewState[]) => Promise<void>): Promise<void>;
  getState(hash: string, binary: boolean): Promise<ArrayBuffer>;
}

function newProtocol(session: WebsocketSession) : Protocol {
  if (!session) throw Error('empty session');
  return {
    session: () => session,
    subscribe: async (callback: (viewState: IViewState[]) => Promise<any>): Promise<void> => {
      session.subscribe('viewport.geometry.view.subscription', callback);
    },
    registerView: async (viewId: string, callback: (viewState: IViewState[]) => Promise<any>): Promise<ViewId> => {
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
  action: 'Rotate' | 'Pan' | 'Zoom' | 'Roll' | 'MultiRotate' | 'ZoomToMouse' | 'None';
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
  // Defaults to DEFAULT_INTERACTOR_SETTINGS
  interactorSettings?: InteractorSetting[];
}

export default class GeometryRenderManager {
  private readonly synchCtx: ISynchronizerContext;
  private readonly renderWindow: vtkSynchronizableRenderWindow;
  private readonly style: vtkInteractorStyleManipulator;
  private readonly localRenderer: vtkRenderer;
  private readonly resizeObserver: ResizeObserver;
  private readonly interactor: vtkRenderWindowInteractor;

  private protocol: Protocol | null = null;
  private remoteRenderer: vtkRenderer | null= null;
  private activeCamera: vtkCamera | null = null;
  private remoteCamera: vtkCamera | null = null;
  private widgetManager: vtkWidgetManager | null = null;
  private onViewStateUpdate: (() => void) | null = null;

  constructor(private readonly props: Props) {
    this.synchCtx = vtkSynchronizableRenderWindow.getSynchronizerContext();
    this.renderWindow = vtkSynchronizableRenderWindow.newInstance({ synchronizerContext: this.synchCtx });

    const openGL = vtkOpenGLRenderWindow.newInstance();
    openGL.setContainer(props.elem);
    (this.renderWindow as any).addView(openGL);

    this.interactor = vtkRenderWindowInteractor.newInstance();
    this.style = newManipulator(props.interactorSettings || DEFAULT_INTERACTOR_SETTINGS);
    this.interactor.setInteractorStyle(this.style);
    this.interactor.setView(openGL);
    this.interactor.initialize();
    this.interactor.bindEvents(props.elem);

    this.localRenderer = vtkRenderer.newInstance();
    this.localRenderer.setLayer(1);
    this.localRenderer.setInteractive(false);
    (this.renderWindow as any).addRenderer(this.localRenderer);

    this.synchCtx.setFetchArrayFunction((hash: string, binary: boolean) => this.getArray(hash, binary));

    this.resizeObserver = new ResizeObserver(() => {
      const dims = props.elem.getBoundingClientRect();
      const devicePixelRatio = window.devicePixelRatio || 1;
      console.log(`RESIZE: ${dims.width} ${dims.height}`);
      openGL.setSize(
        Math.floor(dims.width * devicePixelRatio),
        Math.floor(dims.height * devicePixelRatio),
      );
      this.render();
    });
    this.resizeObserver.observe(props.elem);
  }

  // Must be called once immediately after construction.
  public start(session: WebsocketSession, onReady: () => void) {
    if (this.protocol) throw Error('double call to start');
    this.protocol = newProtocol(session);
    const oldFn = this.onViewStateUpdate;
    this.onViewStateUpdate = () => {
      this.onViewStateUpdate = null;
      onReady();
      if (oldFn) oldFn();
    }
    console.log('start registerview');
    this.protocol.registerView(
      DEFAULT_VIEW_ID,
      this.viewCallback.bind(this),
    ).then((viewId) => console.log(`registerView: viewid=${viewId}`))
      .catch((err: Error) => console.log(`registerView: viewid=${JSON.stringify(err)}`));
  }

  // Stop the renderer. Must be called once on component unmount.
  public stop(): void {
    this.resizeObserver.unobserve(this.props.elem);
  }

  // Reports the session passed to the constructor.
  public getSession(): WebsocketSession { return this.protocol!.session(); }
  public getInteractor(): vtkRenderWindowInteractor { return this.interactor; }
  public getLocalRenderer(): vtkRenderer { return this.localRenderer; }
  public getRemoteRenderer(): vtkRenderer { return this.remoteRenderer!; }
  public render() { (this.renderWindow as any).render(); }
  public getCamera(): vtkCamera { return this.activeCamera!; }
  public getWidgetManager(): vtkWidgetManager {
    if (!this.widgetManager) throw Error('not ready');
    return this.widgetManager;
  }

  private async viewCallback(viewStates: IViewState[]): Promise<void> {
    const viewState = viewStates[0];
    console.log('viewstate', viewState, JSON.stringify(viewState));
    const progress = this.renderWindow.synchronize(viewState);
    console.log(`viewstate progress ${progress}`);
    if (progress) {
      const renderers = (this.renderWindow as any).getRenderersByReference();
      if (!this.remoteRenderer && renderers.length > 0) {
        // Note: renderer[0] is the localRenderer itself.
        // renderer[1] is the default remote renderer at layer 0.
        let lr;
        [lr, this.remoteRenderer] = renderers;
        if (lr != this.localRenderer) throw Error('lr');
        this.activeCamera = this.remoteRenderer!.getActiveCamera();
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
        this.widgetManager = vtkWidgetManager.newInstance();
        this.widgetManager.setRenderer(this.remoteRenderer!);

        this.render();
      }
      if (this.onViewStateUpdate) this.onViewStateUpdate();
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

        this.render();
        // console.timeEnd('updateViewState');
        // client.renderWindow.getInteractor().setEnableRender(true);
      }
    }
  }

  private async getArray(hash: string, binary: boolean): Promise<ArrayBuffer> {
    console.log(`getarray ${hash} ${binary}`);
    if (!this.protocol) return Promise.resolve(new ArrayBuffer(0));
    return this.protocol.getState(hash, binary);
  }

  public addWidget(widget: any) {
    if (!this.widgetManager) throw Error('not ready');
    this.widgetManager.addWidget(widget);
  }

  public removeWidgets() {
    if (!this.widgetManager) throw Error('not ready');
    this.widgetManager.removeWidgets();
  }
}
