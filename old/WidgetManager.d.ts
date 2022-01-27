declare module '@kitware/vtk.js/Widgets/Core/WidgetManager' {

  import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';

  // TODO: define proper type definitions for widgets.
  type Widget = any;

  export interface vtkWidgetManager {
    enablePicking(): void;
    disablePicking(): void;
    renderWidgets(): void;
    setRenderer(renderer: vtkRenderer): void;
    addWidget(widget: Widget,
              viewType?: number /* one of ViewTypes enum */,
              initialValues?: any):void;
    removeWidget(widget: Widget): void;
    removeWidgets(): void;
    updateSelectionFromXY(x:number, y:number):void;
    updateSelectionFromMouseEvent(event: any): void;
    getSelectedData(): any;
    grabFocus(widget: Widget): boolean;
    delete(): void;
  }

  interface IInitialValues {
    viewId?: string;
    widgets?: Widget[],
    renderer?: vtkRenderer,
    viewType?: number,
    pickingAvailable?: boolean,
    isAnimating?: boolean,
    pickingEnabled?: boolean,
    selections?: any,
    previousSelectedData?: any,
    widgetInFocus?: Widget | null,
    useSvgLayer?: boolean,
    captureOn?: number,
  }

  export function newInstance(props?: IInitialValues): vtkWidgetManager;

  export const vtkWidgetManager: {
    newInstance: typeof newInstance;
  };

  export default vtkWidgetManager;
}
