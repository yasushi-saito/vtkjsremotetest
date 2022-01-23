declare module '@kitware/vtk.js/Widgets/Core/WidgetManager' {

  import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';

  // TODO: define proper type definitions for widgets.
  type Widget = any;

  export interface vtkWidgetManager {
    enablePicking(): void;
    renderWidgets(): void;
    disablePicking(): void;
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

  export function newInstance(props?: any): vtkWidgetManager;

  export const vtkWidgetManager: {
    newInstance: typeof newInstance;
  };

  export default vtkWidgetManager;
}
