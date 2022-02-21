// import React, {FC, useEffect, useRef, useState} from 'react';
import React, { FC, useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';

import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkAbstractWidget from '@kitware/vtk.js/Widgets/Core/AbstractWidget';
import vtkImplicitPlaneWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget';
import vtkLineWidget from '@kitware/vtk.js/Widgets/Widgets3D/LineWidget';
import vtkDistanceWidget from '@kitware/vtk.js/Widgets/Widgets3D/DistanceWidget';
import vtkEllipseWidget from '@kitware/vtk.js/Widgets/Widgets3D/EllipseWidget';
import SmartConnect from 'wslink/src/SmartConnect';
import WebsocketConnection from 'wslink/src/WebsocketConnection';

import GeometryRenderManager from './GeometryRenderManager';
import orientationMarkerWidget from './orientationWidget';

function newCone(): vtkActor {
  const coneSource = vtkConeSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(coneSource.getOutputPort());
  actor.setMapper(mapper);
  actor.getProperty().setRepresentation(2);
  actor.getProperty().setColor(1, 1, 1);
  actor.getProperty().setInterpolationToFlat();
  return actor;
}

function newPlaneWidget() : vtkImplicitPlaneWidget {
  const widget = vtkImplicitPlaneWidget.newInstance();
  widget.getWidgetState().setNormal([0, 0, 1]);
  widget.placeWidget([0, 1, 0, 2, 0, 3]);
  widget.setPlaceFactor(3);
  return widget;
}

function newDistanceWidget() : vtkDistanceWidget {
  const widget = vtkDistanceWidget.newInstance();
  widget.placeWidget([0, 2, 0, 2, 0, 3]);
  const state = widget.getWidgetState();
  const m = (state as any).getMoveHandle();
  m.setShape('sphere');
  m.setVisible(true);
  const h0 = (state as any).addHandle();
  h0.setShape('sphere');
  const h1 = (state as any).addHandle();
  h1.setShape('sphere');
  h1.setScale1(50);
  h1.setVisible(true);
  return widget;
}

function newLineWidget() : vtkLineWidget {
  const widget = vtkLineWidget.newInstance();
  widget.placeWidget([0, 2, 0, 2, 0, 2]);
  widget.setPlaceFactor(3);

  const state = widget.getWidgetState();
  state.getMoveHandle().setShape('sphere');

  const state1 = state.getHandle1();
  state1.setShape('sphere');
  state1.setScale1(0.1);
  state1.setVisible(true);

  const state2 = state.getHandle2();
  state2.setShape('sphere');
  state2.setScale1(0.1);
  state2.setVisible(true);
  return widget;
}

function newSphereWidget() : vtkEllipseWidget {
  const widget = vtkEllipseWidget.newInstance();
  widget.placeWidget([0, 2, 0, 2, 0, 2]);
  widget.setPlaceFactor(1.5);
  return widget;
}

const GeometryExample: FC<{}> = () => {
  const sc = useRef<SmartConnect | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [grm, setGrm] = useState<GeometryRenderManager | null>(null);

  type WidgetType = 'None' | 'vtkLineWidget' | 'vtkPlaneWidget' | 'vtkDistanceWidget' | 'vtkSphereWidget';
  const [showWidget, setShowWidget] = useState<WidgetType>('None');

  useEffect(() => {
    if (sc.current || !canvas.current) {
      throw Error(`useref: ${sc.current} ${canvas.current}`);
    }

    const newgrm = new GeometryRenderManager({
      elem: canvas.current,
    });
    let localLayerFilled = false;

    const config = { sessionURL: 'ws://localhost:1234/ws' };
    sc.current = SmartConnect.newInstance({ config });
    sc.current.connect();
    sc.current.onConnectionReady((conn: WebsocketConnection) => {
      newgrm.start(conn.getSession(), () => {
        if (!localLayerFilled) {
          newgrm.getRemoteRenderer().addActor(newCone());
          localLayerFilled = true;
          orientationMarkerWidget(newgrm.getInteractor());
        }
        setGrm(newgrm);
      });
    });
    sc.current.onConnectionError(console.error);
    sc.current.onConnectionClose(console.error);

    return () => {
      // TODO(saito) grm.stop must be called when the pv server fails before
      // onRendererReady.
      newgrm.stop();
    };
  }, []);

  // Draw or hide a widget.
  const hideWidgets = () => {
    if (widget.current) {
      widget.current.delete();
      widget.current = null;
      grm!.getWidgetManager().removeWidgets();
    }
  }
  const widget = useRef<vtkAbstractWidget<unknown> | null>(null);
  let handle: any = null;

  useEffect(() => {
    if (!grm) return;

    if (widget.current && widget.current.getClassName() != showWidget) {
      hideWidgets();
    }
    if (showWidget == 'vtkPlaneWidget') {
      if (!widget.current) {
        widget.current = newPlaneWidget();
      }
      grm.getWidgetManager().addWidget(widget.current);
    } else if (showWidget == 'vtkLineWidget') {
      let lineWidget: vtkLineWidget;
      if (!widget.current) {
        lineWidget = newLineWidget();
        widget.current = lineWidget;
      } else {
        lineWidget = widget.current as vtkLineWidget;
      }
      handle = (grm.getWidgetManager().addWidget(lineWidget) as any);
      handle.getInteractor().render();
      handle.updateHandleVisibility(0);
      handle.updateHandleVisibility(1);
      grm.getWidgetManager().enablePicking();
      grm.getWidgetManager().grabFocus(lineWidget);
      grm.render();

      handle.onStartInteractionEvent(() => {
        console.log(`interaction`);
      });
    } else if (showWidget === 'vtkDistanceWidget') {
      if (!widget.current) {
        widget.current = newDistanceWidget();
      }
      grm.getWidgetManager().addWidget(widget.current);
      grm.getWidgetManager().enablePicking();
      grm.getWidgetManager().grabFocus(widget.current);
    } else if (showWidget === 'vtkSphereWidget') {
      if (!widget.current) {
        widget.current = newSphereWidget();
      }
      grm.getWidgetManager().addWidget(widget.current);
      grm.getWidgetManager().enablePicking();
      grm.getWidgetManager().grabFocus(widget.current);
    }
    grm.render();
  }, [grm, showWidget]);

  const resetCamera = () => {
    if (!grm) return;
    grm.getLocalRenderer().resetCamera();
    grm.render();
  }
  const runRpc = (method: string, args: any[]) => {
    if (!grm) return;
    grm.getSession().call(method, args).then((result: any) => {
      console.log(`${method}: ${result}`);
    }).catch((err: Error) => {
      console.log(`${method} error: ${JSON.stringify(err)}`);
    });
  };

  // style="height:50vh; width: 50vw"
  return (
    <>
      <Button onClick={() => {
        setShowWidget('vtkPlaneWidget');
      }}>Plane widget</Button>
      <Button onClick={() => setShowWidget('vtkLineWidget')}>Line widget</Button>
      <Button onClick={() => setShowWidget('vtkDistanceWidget')}>Distance widget</Button>
      <Button onClick={() => setShowWidget('vtkSphereWidget')}>Sphere widget</Button>
      <Button onClick={() => setShowWidget('None')}>Hide widget</Button>
      <Button onClick={() => runRpc('test.readmesh', ['foo.stl'])}>
        Load mesh
      </Button>
      <Button onClick={() => runRpc('test.setrepresentation', ['Surface With Edges'])}>
        Surface with edges
      </Button>
      <Button onClick={() => runRpc('test.setrepresentation', ['Surface'])}>
        Surface
      </Button>
      <Button onClick={resetCamera}>
        Reset camera
      </Button>
      <div>
        {grm ? 'connected' : 'Not connected!'}
        <div
          ref={canvas}
          style={{
            height: '70vh',
            width: '70vw',
          }}
        />
      </div>
    </>
  );
};

export default GeometryExample;
