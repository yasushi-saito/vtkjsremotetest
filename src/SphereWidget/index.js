import { distance2BetweenPoints } from '@kitware/vtk.js/Common/Core/Math';
import { ViewTypes } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';
import vtkAbstractWidgetFactory from '@kitware/vtk.js/Widgets/Core/AbstractWidgetFactory';
import vtkPlanePointManipulator from '@kitware/vtk.js/Widgets/Manipulators/PlaneManipulator';
import vtkCircleContextRepresentation from '@kitware/vtk.js/Widgets/Representations/CircleContextRepresentation';
import vtkSphereHandleRepresentation from '@kitware/vtk.js/Widgets/Representations/SphereHandleRepresentation';
import vtkSVGLandmarkRepresentation from '@kitware/vtk.js/Widgets/SVG/SVGLandmarkRepresentation';
import vtkShapeWidget from '@kitware/vtk.js/Widgets/Widgets3D/ShapeWidget';
import {
  BehaviorCategory,
  ShapeBehavior,
} from '@kitware/vtk.js/Widgets/Widgets3D/ShapeWidget/Constants';
import macro from '@kitware/vtk.js/macros';

import vtkSphereContextRepresentation from './SphereContextRepresentation';
import widgetBehavior from './behavior';
import stateGenerator from './state';

function vtkSphereWidget(publicAPI, model) {
  model.classHierarchy.push('vtkSphereWidget');

  model.behavior = widgetBehavior;
  publicAPI.getRepresentationsForViewType = (viewType) => [
    {
      builder: vtkSphereHandleRepresentation,
      labels: ['moveHandle'],
      initialValues: {
        scaleInPixels: true,
      },
    }, {
      builder: vtkSphereHandleRepresentation,
      labels: ['centerHandle'],
      initialValues: {
        scaleInPixels: true,
      },
    }, {
      builder: vtkSphereHandleRepresentation,
      labels: ['borderHandle'],
      initialValues: {
        scaleInPixels: true,
      },
    }, {
      builder: vtkSphereContextRepresentation,
      labels: ['sphereHandle'],
    },
  ];

  publicAPI.getRadius = () => {
    const h1 = model.widgetState.getCenterHandle();
    const h2 = model.widgetState.getBorderHandle();
    return Math.sqrt(distance2BetweenPoints(h1.getOrigin(), h2.getOrigin()));
  };

  model.manipulator = vtkPlanePointManipulator.newInstance();
  model.widgetState = stateGenerator();
}

export function extend(publicAPI, model, initialValues = {}) {
    Object.assign(model, {}, initialValues);
    vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
    macro.setGet(publicAPI, model, ['manipulator', 'widgetState']);
    vtkSphereWidget(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkSphereWidget');

export default { newInstance, extend };
