import shapeBehavior from '@kitware/vtk.js/Widgets/Widgets3D/ShapeWidget/behavior';
import { vec3 } from 'gl-matrix';

// Defines the mouse/keyboard interaction.  The implementation overrides
// minimum ShapeWidget methods to implement the sphere interaction.
export default function widgetBehavior(publicAPI, model) {
  // The visual representation of the widget.
  model.shapeHandle = model.widgetState.getSphereHandle();
  // point{1,2}Handle are required by ShapeWidget. They represent the two
  // control points of the widget.
  model.point1Handle = model.widgetState.getCenterHandle();
  model.point2Handle = model.widgetState.getBoundaryHandle();
  model.point1Handle.setManipulator(model.manipulator);
  model.point2Handle.setManipulator(model.manipulator);
  // We inherit shapeBehavior.
  shapeBehavior(publicAPI, model);
  const superClass = { ...publicAPI };
  model.classHierarchy.push('vtkSphereWidgetProp');
  // We don't yet support label display, so disable all
  // text methods
  publicAPI.updateTextPosition = (point1, point2) => {};
  // Called when the ShapeWidget updates the two points.
  // Its job is to update model.shapeHandle.
  publicAPI.setCorners = (center, border) => {
    if (superClass.setCorners) {
      superClass.setCorners(center, border);
    }
    const radius = vec3.distance(center, border);
    model.shapeHandle.setOrigin(center);
    model.shapeHandle.setScale1(radius * 2);
  };
}
