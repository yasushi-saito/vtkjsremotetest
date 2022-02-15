import vtkAnnotatedCubeActor from '@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';

export default function orientationWidget(
  interactor: vtkRenderWindowInteractor,
): vtkOrientationMarkerWidget {
  const axes = vtkAnnotatedCubeActor.newInstance();
  axes.setDefaultStyle({
    fontStyle: 'bold',
    fontFamily: 'Arial',
    fontColor: 'black',
    fontSizeScale: (res) => res / 2,
    faceRotation: 0,
    edgeThickness: 0.1,
    edgeColor: 'black',
    resolution: 400,
  });
  axes.setXPlusFaceProperty({
    text: '-X',
    faceColor: '#ff0000',
  });
  axes.setXMinusFaceProperty({
    text: '+X',
    faceColor: '#a00000',
  });
  axes.setYPlusFaceProperty({
    text: '-Y',
    faceColor: '#a0a000',
  });
  axes.setYMinusFaceProperty({
    text: '+Y',
    faceColor: '#ffff00',
  });
  axes.setZPlusFaceProperty({
    text: '-Z',
    faceColor: '#00a000',
  });
  axes.setZMinusFaceProperty({
    text: '+Z',
    faceColor: '#008000',
  });
  const widget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor,
  });
  widget.setEnabled(true);
  widget.setViewportSize(0.15);

  widget.setMinPixelSize(50);
  widget.setMaxPixelSize(100);
  return widget;
}
