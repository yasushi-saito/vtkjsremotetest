import vtkStateBuilder from '@kitware/vtk.js/Widgets/Core/StateBuilder';
import { TextPosition } from '@kitware/vtk.js/Widgets/Widgets3D/ShapeWidget/Constants';

// Defines the structure of the widget state.
// See https://kitware.github.io/vtk-js/docs/concepts_widgets.html.
export default function generateState() {
  return (
    vtkStateBuilder
      .createBuilder()
      // The handlee for the center of the sphre.
      .addStateFromMixin({
        labels: ['moveHandle'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
        name: 'centerHandle',
        initialValues: {
          scale1: 10,
          visible: true,
        },
      })
      // The handlee for a boundary point of the sphre.
      .addStateFromMixin({
        labels: ['moveHandle'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
        name: 'boundaryHandle',
        initialValues: {
          scale1: 10,
          visible: true,
        },
      })
      // Internal state for displaying the sphere.
      .addStateFromMixin({
        labels: ['sphereHandle'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'orientation'],
        name: 'sphereHandle',
        initialValues: {
          visible: true,
          radius: 1,
        },
      })
      // The following states are not really supported by the spher widget, but
      // are required to make ShapeWidget work. Changes to these fields are
      // ignored.
      .addStateFromMixin({
        labels: ['SVGtext'],
        mixins: ['origin', 'color', 'text', 'visible'],
        name: 'text',
        initialValues: {
          /* text is empty to set a text filed in the SVGLayer and to avoid
           * displaying text before positioning the handles */
          text: '',
        },
      })
      // FIXME: to move in text handle sub state
      .addField({
        name: 'textPosition',
        initialValue: [
          TextPosition.CENTER,
          TextPosition.CENTER,
          TextPosition.CENTER,
        ],
      })
      .addField({
        name: 'textWorldMargin',
        initialValue: 0,
      })
      .build()
  );
}
