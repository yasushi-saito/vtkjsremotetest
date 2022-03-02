import macro from '@kitware/vtk.js/macros';
import vtkMatrixBuilder from '@kitware/vtk.js/Common/Core/MatrixBuilder';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkArrowSource from '@kitware/vtk.js/Filters/Sources/ArrowSource';
import vtkAppendPolyData from '@kitware/vtk.js/Filters/General/AppendPolyData';

// ----------------------------------------------------------------------------

function centerDataSet(ds, offset=[0,0,0]) {
  const bounds = ds.getPoints().getBounds();
  const center = [
    -(bounds[0] + bounds[1]) * 0.5 + offset[0],
    -(bounds[2] + bounds[3]) * 0.5 + offset[1],
    -(bounds[4] + bounds[5]) * 0.5 + offset[2],
  ];
  vtkMatrixBuilder
    .buildFromDegree()
    .translate(...center)
    .apply(ds.getPoints().getData());
}

function moveDataSet(ds, offset) {
  const bounds = ds.getPoints().getBounds();
  vtkMatrixBuilder
    .buildFromDegree()
    .translate(...offset)
    .apply(ds.getPoints().getData());
}

// ----------------------------------------------------------------------------

function addColor(ds, r, g, b) {
  const size = ds.getPoints().getData().length;
  const rgbArray = new Uint8Array(size);
  let offset = 0;

  while (offset < size) {
    rgbArray[offset++] = r;
    rgbArray[offset++] = g;
    rgbArray[offset++] = b;
  }

  ds.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'color',
      numberOfComponents: 3,
      values: rgbArray,
    })
  );
}

// If center=true, move the axis so that its center will be at (0,0,0).  Else,
// the base of the axis will be at (0,0,0).
function moveAxis(axis, center, axisIndex) {
    const bounds = axis.getPoints().getBounds();
    const offset = [-(bounds[0]+bounds[1])/2, -(bounds[2]+bounds[3])/2, -(bounds[4]+bounds[5])/2];
    if (!center) {
        offset[axisIndex] = -bounds[axisIndex*2];
    }
    vtkMatrixBuilder
        .buildFromDegree()
        .translate(...offset)
        .apply(axis.getPoints().getData());
}
// ----------------------------------------------------------------------------
// vtkAxesActor
// ----------------------------------------------------------------------------

function vtkAxesActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAxesActor');
  publicAPI.update = () => {
    const xAxis = vtkArrowSource
      .newInstance({ direction: [1, 0, 0], ...model.config })
          .getOutputData();
      moveAxis(xAxis, model.centerAxes, 0);
    addColor(xAxis, ...model.xAxisColor);

    const yAxis = vtkArrowSource
      .newInstance({ direction: [0, 1, 0], ...model.config })
      .getOutputData();
      moveAxis(yAxis, model.centerAxes, 1);
    addColor(yAxis, ...model.yAxisColor);

    const zAxis = vtkArrowSource
      .newInstance({ direction: [0, 0, 1], ...model.config })
      .getOutputData();
      moveAxis(zAxis, model.centerAxes, 2);
    addColor(zAxis, ...model.zAxisColor);

    const source = vtkAppendPolyData.newInstance();
    source.setInputData(xAxis);
    source.addInputData(yAxis);
    source.addInputData(zAxis);

    // set mapper
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(source.getOutputPort());
    publicAPI.setMapper(mapper);
  };

  publicAPI.update();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  config: {
    tipResolution: 60,
    tipRadius: 0.1,
    tipLength: 0.2,
    shaftResolution: 60,
    shaftRadius: 0.03,
    invert: false,
  },
  xAxisColor: [255, 0, 0],
  yAxisColor: [255, 255, 0],
  zAxisColor: [0, 128, 0],
  centerAxes: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkActor.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['config']);
  macro.setGetArray(
    publicAPI,
    model,
    ['xAxisColor', 'yAxisColor', 'zAxisColor'],
    3,
    255
  );

  // Object methods
  vtkAxesActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAxesActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
