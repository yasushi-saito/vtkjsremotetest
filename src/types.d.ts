declare module '@kitware/vtk.js/Rendering/Core/InteractorObesrver' {
  export interface vtkInteractorObserver { // extends vtkObject {
    onStartInteractionEvent(fn: (event: { type: 'StartInteractionEvent' })=>void): void;
    onEndInteractionEvent(fn: (event: { type: 'EndInteractionEvent' })=>void): void;
    // TODO: add on{Start,End}{Pan,Spin,Dolly,CameraPose,WindowLevel,Slice}
  }
  export function newInstance(initialValues?: any): vtkInteractorObserver;

  const vtkInteractorObserver: {
    newInstance: typeof newInstance,
  };
  export default vtkInteractorObserver;
}

declare module '@kitware/vtk.js/Rendering/Core/InteractorStyle' {
  import vtkInteractorObserver from '@kitware/vtk.js/Rendering/Core/InteractorObserver';

  export interface vtkInteractorStyle extends vtkInteractorObserver { // extends vtkObject {
    onStartRotate(fn:(event: any) => void): void;
    onEndRotate(fn:(event: any) => void): void;
    // TODO: add on{Start,End}{Pan,Spin,Dolly,CameraPose,WindowLevel,Slice}
  }
  export function newInstance(initialValues?: any): vtkInteractorStyle;

  const vtkInteractorStyle: {
    newInstance: typeof newInstance,
  };
  export default vtkInteractorStyle;
}

declare module '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator' {
  import vtkInteractorStyle from '@kitware/vtk.js/Rendering/Core/InteractorStyle';

  interface Position {
    x: number; // range [0, 1], with 0 at the left.
    y: number; // range [0, 1], with 0 at the bottom.
  }
  type GestureManipulator = any;
  type VRManipulator = any;
  interface KeyboardManipulator {
    onKeyDown?(interactor: any, renderer: any, key: number): void;
    onKeyUp?(interactor: any, renderer: any, key: number): void;
    onKeyPress?(interactor: any, renderer: any, key: number): void;
  }
  interface MouseManipulator {
    onButtonDown?(interactor: any, renderer: any, position: Position): void;
    onButtonUp?(interactor: any): void;
    onMouseMove?(interactor: any, renderer: any, position: Position): void;
    onScroll?(interactor: any, renderer: any, delta: number, position: Position): void;
  }
  export interface vtkInteractorStyleManipulator extends vtkInteractorStyle { // extends vtkObject {
    removeAllManipulators(): void;
    removeAllMouseManipulators(): void;
    removeAllKeyboardManipulators(): void;
    removeAllVRManipulators(): void;
    removeAllGetureManipulators(): void;

    // Methods removeXXX return true if the manipulator was found.
    removeMouseManipulator(m: MouseManipulator): boolean;
    removeKeyboardManipulator(m: KeyboardManipulator): boolean;
    removeVRManipulator(m: VRManipulator): boolean;
    removeGestureManipulator(m: GestureManipulator): boolean;

    // Methods addXXX return true if the manipulator was added.  If the
    // manipulator had already been added, they just return false.
    addMouseManipulator(m: MouseManipulator): boolean;
    addKeyboardManipulator(m: KeyboardManipulator): boolean;
    addVRManipulator(m: VRManipulator): boolean;
    addGestureManipulator(m: GestureManipulator): boolean;

    getNumberOfMouseManipulators(): number;
    getNumberOfKeyboardManipulators(): number;
    getNumberOfVRManipulators(): number;
    getNumberOfGestureManipulators(): number;

  }
  export function newInstance(initialValues?: any): vtkInteractorStyleManipulator;

  const vtkInteractorStyleManipulator: {
    newInstance: typeof newInstance,
  };
  export default vtkInteractorStyleManipulator;
}

declare module '@kitware/vtk.js/Interaction/Style/InteractorStyleRemoteMouse' {
  // TODO(saito) Upstream the definitions.
  // import { vtkObject } from '@kitware/vtk.js/interfaces';

  export interface MouseEvent {
    action: 'up' | 'down';
    x: number;
    y: number;
    buttonLeft: boolean;
    buttonMiddle: boolean;
    buttonRight: boolean;
    shiftKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    [key: string]: any;
  }
  export interface WheelEvent {
    type: 'MouseWheel',
    spinY: number,
    altKey: boolean,
    controlKey: boolean,
    shiftKey: boolean,
    [key: string]:any
  }
  type GestureEvent = (
    { type: 'StartPinch'; scale: number } |
      { type: 'Pinch'; scale: number } |
      { type: 'Rotate'; rotation: any } |
      { type: 'StartPan'; translation: number } |
      { type: 'Pan'; translation: number } |
      { type: 'EndPan' } |
      { type: 'EndRotate' }) & { [key: string]: any }

  export interface vtkInteractorStyleRemoteMouse { // extends vtkObject {
    setThrottleDelay(delay: number): void;
    setSendMouseMove(value: boolean): void;

    // Arrange so that future events for on*Event callbacks will have the
    // given key/value pairs added. A repeated call will remove the old keys and
    // values.
    setRemoteEventAddOn(keyValues: {[key: string]: any}): void;

    onRemoteMouseEvent(fn: (event: MouseEvent) => void): void;
    onInteractionEvent(fn: (event: { type: 'InteractionEvent' })=>void): void;
    onStartInteractionEvent(fn: (event: { type: 'StartInteractionEvent' })=>void): void;
    onEndInteractionEvent(fn: (event: { type: 'EndInteractionEvent' })=>void): void;
    onRemoteWheelEvent(fn: (event: WheelEvent) => void): void;
    onRemoteGestureEvent(fn: (event: GestureEvent) => void): void;
  }
  export interface IInitialValues {
    sendMouseMove: boolean;
    throttleDelay: number;
  }
  export function newInstance(initialValues?: IInitialValues): vtkInteractorStyleRemoteMouse;

  const vtkInteractorStyleRemoteMouse: {
    newInstance: typeof newInstance,
  };
  export default vtkInteractorStyleRemoteMouse;
}

declare module '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator' {
  export = any; // eslint-disable-line no-undef
}

// eslint-disable-next-line max-len
declare module '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballMultiRotateManipulator' {
  export = any; // eslint-disable-line no-undef
}

declare module '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballPanManipulator' {
  export = any; // eslint-disable-line no-undef
}

declare module '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballRollManipulator' {
  export = any; // eslint-disable-line no-undef
}

declare module '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballRotateManipulator' {
  export = any; // eslint-disable-line no-undef
}

declare module '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomManipulator' {
  export = any; // eslint-disable-line no-undef
}

// eslint-disable-next-line max-len
declare module '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomToMouseManipulator' {
  export = any; // eslint-disable-line no-undef
}

declare module '@kitware/vtk.js/Interaction/Manipulators/GestureCameraManipulator' {
  export = any; // eslint-disable-line no-undef
}

declare module '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera' {
  export = any; // eslint-disable-line no-undef
}

declare module '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget' {
  export = any; // eslint-disable-line no-undef
}

declare module '@kitware/vtk.js/Widgets/Core/WidgetManager' {
  export = any; // eslint-disable-line no-undef
}

declare module '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget' {
  import {
    ImplicitPlaneRepresentationState,
  } from '@kitware/vtk.js/Widgets/Representations/ImplicitPlaneRepresentation';
  // eslint-disable-next-line import/no-duplicates
  import vtkAbstractWidget from '@kitware/vtk.js/Widgets/Core/AbstractWidget';

  // eslint-disable-next-line max-len
  export interface vtkImplicitPlaneWidget extends vtkAbstractWidget<ImplicitPlaneRepresentationState> {}

  interface IInitialValues {}

  export function newInstance(props?: IInitialValues): vtkImplicitPlaneWidget;

  export const vtkImplicitPlaneWidget: {
    newInstance: typeof newInstance;
  };

  export default vtkImplicitPlaneWidget;
}

declare module '@kitware/vtk.js/Widgets/Core/WidgetManager' {
  import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';

  export interface vtkWidgetManager {
    enablePicking(): void;
    disablePicking(): void;
    renderWidgets(): void;
    setRenderer(renderer: vtkRenderer): void;
    addWidget(widget: vtkAbstractWidget<unknown>,
              viewType?: number /* one of ViewTypes enum */,
              initialValues?: any):void;

    // Calls widget.delete() as a side effect.
    removeWidget(widget: vtkAbstractWidget<unknown>): void;
    // Calls removeWidget on all the registered widgets.
    removeWidgets(): void;
    updateSelectionFromXY(x:number, y:number):void;
    updateSelectionFromMouseEvent(event: any): void;
    getSelectedData(): any;

    grabFocus(widget: vtkAbstractWidget<unknown>): void;
    releaseFocus(): void;

    // Returns true iff the value has changed.
    setUseSvgLayer(arg: boolean): boolean;
    delete(): void;
  }

  interface IInitialValues {
    viewId?: string;
    widgets?: vtkAbstractWidget<unknown>[],
    renderer?: vtkRenderer,
    viewType?: number,
    pickingAvailable?: boolean,
    isAnimating?: boolean,
    pickingEnabled?: boolean,
    selections?: any,
    previousSelectedData?: any,
    widgetInFocus?: vtkAbstractWidget<unknown> | null,
    useSvgLayer?: boolean,
    captureOn?: number,
  }

  export function newInstance(props?: IInitialValues): vtkWidgetManager;

  export const vtkWidgetManager: {
    newInstance: typeof newInstance;
  };

  export default vtkWidgetManager;
}

declare module '@kitware/vtk.js/Widgets/Core/AbstractWidget' {
  import vtkProp from '@kitware/vtk.js/Rendering/Core/Prop';

  // TODO(saito) This class also extends InteractorObserver.
  interface vtkAbstractWidget<State> extends vtkProp {
    placeWidget(minX: number, maxX: number,
                minY: number, maxY: number,
                minZ: number, maxZ: number): void;
    placeWidget(bounds: number[]): void;

    // Extends the bounding box of the widget by the given amount.  For example,
    // val of 1.2 will enlarge the BB by 20% in every dimension.
    setPlaceFactor(val: number): void;
    getPlaceFactor(val: number): void;

    setDisplayCallback(fn: any): any;
    getWidgetState(): State;
    setWidgetState(state: State): void;

    // Register a function to be called whenever the widget state changes.  The
    // caller must run the `unsubscribe` function to unregister the callback.
    onWidgetChange(fn: (state: State) => void): { unsubscribe: () => void };

    // Checks if this widget has the mouse/keyboard focus.
    hasFocus(): boolean;
  }

  // The next line causes an eslint error. It's a typescript bug which should be
  // fixed by updating TS to the latest.
  export default vtkAbstractWidget; // eslint-disable-line no-undef
}

declare module '@kitware/vtk.js/Widgets/Representations/ImplicitPlaneRepresentation' {
  // eslint-disable-next-line max-len
  import vtkWidgetRepresentation from '@kitware/vtk.js/Widgets/Representations/WidgetRepresentation';
  // eslint-disable-next-line import/no-duplicates
  import { Vector3 } from '@kitware/vtk.js/types';// eslint-disable-line import/no-unresolved

  export interface ImplicitPlaneRepresentationState {
    getOrigin(): Vector3;
    setOrigin(arg: Vector3): void;
    getNormal(): Vector3;
    setNormal(arg: Vector3): void;
    getActiveHandle(): any;
    setActiveHandle(handle: any): void;
    getUpdateMethodName(): string;
    setUpdateMethodName(name: string): void;

    // Generic get/set methods.  keys are "origin", "normal", "activeHandle", etc.
    get(key: string): { [key: string]: any };
    set: (arg: { [key: string]: any }) => void;
  }

  export interface vtkImplicitPlaneRepresentation extends vtkWidgetRepresentation {
    setSphereResolution(res: number): void;
    setRepresentationStyle(style: any): void;
    updateActorVisibility(renderingType: any, ctxVisible: boolean, hVisible: boolean): void;
    getSelectedState(prop: any, compositeID: any): ImplicitPlaneRepresentationState;

    getSphereResolution(): number;
    setSphereResolution(val: number): void;
    getAxisScale(): number;
    setAxisScale(val: number): void;
    getNormalVisible(): boolean;
    setNormalVisible(val: boolean): void;
    getOriginVisible(): boolean;
    setOriginVisible(val: boolean): void;
    getPlaneVisible(): boolean;
    setPlaneVisible(val: boolean): void;
    getOutlineVisible(): boolean;
    setOutlineVisible(val: boolean): void;
  }

  interface IInitialValues {
    sphereResolution: number;
    handleSizeRatio: number;
    axisScale: number;
    normalVisible: boolean;
    originalVisible: boolean;
    planeVisible: boolean;
    outlineVisible: boolean;
  }

  export function newInstance(props?: IInitialValues): vtkImplicitPlaneRepresentation;

  export const vtkImplicitPlaneRepresentation: {
    newInstance: typeof newInstance;
  };

  export default vtkImplicitPlaneRepresentation;
}

declare module '@kitware/vtk.js/Widgets/Widgets3D/DistanceWidget' {
  // eslint-disable-next-line import/no-duplicates
  import vtkAbstractWidget from '@kitware/vtk.js/Widgets/Core/AbstractWidget';
  // eslint-disable-next-line import/no-duplicates
  import { Vector3 } from '@kitware/vtk.js/types';// eslint-disable-line import/no-unresolved

  export interface HandleState {
    getOrigin(): Vector3;
    setOrigin(arg: Vector3): void;
    getColor(): string;
    setColor(arg: string):void;
    getScale1(): number;
    setScale1(arg: number): void;
    getVisible(): boolean;
    setVisible(arg: boolean):void
  }

  export interface State {
    getMoveHandle(): HandleState;
    addHandle(): HandleState;
    getHandleList(): HandleState[];
  }

  export interface vtkDistanceWidget extends vtkAbstractWidget<State> {
    getDistance(): number;
  }

  interface IInitialValues {}

  export function newInstance(props?: IInitialValues): vtkDistanceWidget;

  export const vtkDistanceWidget: {
    newInstance: typeof newInstance;
  };

  export default vtkDistanceWidget;
}

declare module '@kitware/vtk.js/Widgets/Widgets3D/LineWidget' {
  // eslint-disable-next-line import/no-duplicates
  import vtkAbstractWidget from '@kitware/vtk.js/Widgets/Core/AbstractWidget';
  // eslint-disable-next-line import/no-duplicates
  import { Vector3 } from '@kitware/vtk.js/types';// eslint-disable-line import/no-unresolved

  type ShapeType = (
    'voidSphere' | 'sphere' | 'cube' | 'cone' | 'triangle' |
      '4pointsArrowHead' | '6pointsArrowHead' |
      'star' | 'disk' | 'circle' | 'viewFinder');

  export interface HandleState {
    getOrigin(): Vector3;
    setOrigin(arg: Vector3): void;
    getColor(): string;
    setColor(arg: string):void;
    getVisible(): boolean;
    setVisible(arg: boolean):void
    getShape(): ShapeType;
    setShape(arg: ShapeType):void;
    getScale1(): number;
    setScale1(arg: number):void;
  }

  export interface SVGTextState {
    getOrigin(): Vector3;
    setOrigin(arg: Vector3): void;
    getColor(): any;
    setColor(arg: any): void;
    getText(): string;
    setText(arg: string): void;
    getVisible(): boolean;
    setVisible(arg: boolean):void
    getShape(): ShapeType;
    setShape(arg: ShapeType):void;
  }

  export interface State {
    getMoveHandle(): HandleState;
    setMoveHandle(arg: HandleState): void;
    getHandle1(): HandleState;
    setHandle1(arg: HandleState): void;
    getHandle2(): HandleState;
    setHandle2(arg: HandleState): void;
    getSVGtext(): SVGTextState;
    setSVGtext(arg: SVGTextState): void;
    getPositionOnLine(): number;
    setPositionOnLine(arg: number): void;
  }

  export interface vtkLineWidget extends vtkAbstractWidget<State> {
    getDistance(): number;
  }

  interface IInitialValues {}

  export function newInstance(props?: IInitialValues): vtkLineWidget;

  export const vtkLineWidget: {
    newInstance: typeof newInstance;
  };

  export default vtkLineWidget;
}

declare module '@kitware/vtk.js/Widgets/Widgets3D/EllipseWidget' {
  export = any;
}
