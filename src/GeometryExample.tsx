// import React, {FC, useEffect, useRef, useState} from 'react';
import React, { FC, useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import { vec3 } from 'gl-matrix';

import vtkWidgetManager, { vtkWidgetHandle } from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkAbstractWidget from '@kitware/vtk.js/Widgets/Core/AbstractWidget';
import vtkImplicitPlaneWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget';
import vtkLineWidget, { vtkLineWidgetState } from '@kitware/vtk.js/Widgets/Widgets3D/LineWidget';
import vtkDistanceWidget from '@kitware/vtk.js/Widgets/Widgets3D/DistanceWidget';
import vtkSphereWidget, { vtkSphereWidgetState } from './SphereWidget';
import SmartConnect from 'wslink/src/SmartConnect';
import WebsocketConnection from 'wslink/src/WebsocketConnection';

import GeometryRenderManager from './GeometryRenderManager';
import orientationMarkerWidget from './orientationWidget';

function newCone(): vtkActor {
  const coneSource = vtkConeSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();
  (mapper as any).setInputConnection(coneSource.getOutputPort());
  actor.setMapper(mapper);
  actor.getProperty().setRepresentation(2);
  actor.getProperty().setColor(1, 1, 1);
  actor.getProperty().setInterpolationToFlat();
  return actor;
}

interface BaseWidget {
  delete(): void;
}

class ImplicitPlaneWidget implements BaseWidget {
  private readonly widget: vtkImplicitPlaneWidget;
  private readonly handle: any;

  constructor(manager: vtkWidgetManager, bounds: Bounds) {
    this.widget = vtkImplicitPlaneWidget.newInstance();
    this.widget.getWidgetState().setNormal([0, 0, 1]);
    this.widget.placeWidget(bounds);
    this.widget.setPlaceFactor(1.2);

    this.handle = manager.addWidget(this.widget);
    manager.grabFocus(this.widget);
  }

  public delete(): void {
    this.widget.delete();
  }
}

class DistanceWidget implements BaseWidget {
  private readonly widget: vtkDistanceWidget;
  private readonly handle: any;

  constructor(manager: vtkWidgetManager, bounds: Bounds) {
    this.widget = vtkDistanceWidget.newInstance();
    this.widget.placeWidget(bounds);
    this.handle = manager.addWidget(this.widget);
    manager.grabFocus(this.widget);
    this.resetHandle();
  }

  private resetHandle() {
    const state = this.widget.getWidgetState();
    const m = (state as any).getMoveHandle();
    m.setShape('sphere');
    m.setVisible(true);
    const h0 = (state as any).addHandle();
    h0.setShape('sphere');
    const h1 = (state as any).addHandle();
    h1.setShape('sphere');
    h1.setScale1(50);
    h1.setVisible(true);
  }

  public delete(): void {
    this.widget.delete();
  }
}

/*function newDistanceWidget() : vtkDistanceWidget {
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
}*/

type Bounds = [number,number,number,number,number,number]
type Vector3 =[number,number,number]

class LineWidget implements BaseWidget {
  private readonly widget: vtkLineWidget;
  private readonly handle: vtkWidgetHandle<vtkLineWidgetState>;

  constructor(manager: vtkWidgetManager, bounds: Bounds) {
    this.widget = vtkLineWidget.newInstance();
    this.widget.placeWidget(bounds);
    this.widget.setPlaceFactor(2.0);

    this.handle = manager.addWidget(this.widget);
    manager.grabFocus(this.widget);

    this.resetHandles([bounds[0], bounds[2], bounds[4]],
                      [bounds[1], bounds[3], bounds[5]]);
  }

  public delete() : void {
    this.widget.delete();
  }

  // Set the attributes of the handles at the ends of the line segment.
  private resetHandles(loc1: Vector3, loc2: Vector3): void {
    const state = this.widget.getWidgetState();
    [state.getHandle1(), state.getHandle2()].forEach((h) => {
      h.setShape('sphere');
      h.setScale1(20); // #pixel of the sphere size
      h.setVisible(true);
    });
    state.getHandle1().setOrigin(loc1);
    state.getHandle2().setOrigin(loc2);

    (this.handle as any).updateHandleVisibility(0);
    (this.handle as any).updateHandleVisibility(1);

    // Disable the move handle, which is used when determining the initial
    // placement of the two segment endpoints.
    const move = state.getMoveHandle();
    move.setVisible(false);
    move.setShape('voidSphere');
  }
}

class SphereWidget implements BaseWidget {
  private widget: vtkSphereWidget;
  private readonly handle: vtkWidgetHandle<vtkSphereWidgetState>;

  constructor(private readonly manager: vtkWidgetManager, bounds: Bounds) {
    // The below warning is likely a bug in eslint
    // eslint-disable-next-line import/no-named-as-default-member
    this.widget = vtkSphereWidget.newInstance();
    this.widget.placeWidget(bounds);
    this.widget.setPlaceFactor(10);

    this.handle = manager.addWidget(this.widget);
    manager.grabFocus(this.widget);

    const boundMin: Vector3 = [bounds[0], bounds[2], bounds[4]];
    const boundMax: Vector3 = [bounds[1], bounds[3], bounds[5]];
    const bbSize = vec3.sub(vec3.create(), boundMax, boundMin);
    const center = boundMin;
    const radius = vec3.length(bbSize) * 0.3;
    console.log(`CENTER: min=${boundMin} max=${boundMax} ${center} ${radius}`);
    this.resetHandles(center as Vector3, radius);
  }

  private resetHandles(center: Vector3, radius: number): void {
    //const state = this.widget.getWidgetState();
    //state.getCenterHandle().setVisible(true);
    //state.getBorderHandle().setVisible(true);
    //state.getSphereHandle().setVisible(true);
    (this.handle as any).setCenterAndRadius(center, radius);
  }

  public delete() {
    this.widget.delete();
  }
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
          orientationMarkerWidget(newgrm.getInteractor(), newgrm.getCamera());
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
      (widget.current as any).delete();
      widget.current = null;
      grm!.getWidgetManager().removeWidgets();
    }
  }
  const widget = useRef<BaseWidget | null>(null);

  useEffect(() => {
    if (!grm) return;

    if (widget.current) {
      hideWidgets();
    }
    const widgetManager = grm.getWidgetManager();
    const bounds: Bounds = [-1, 1, -1, 1, -1, 1];

    if (showWidget == 'vtkPlaneWidget') {
      if (!widget.current) {
        widget.current = new ImplicitPlaneWidget(widgetManager, bounds);
      }
    } else if (showWidget == 'vtkLineWidget') {
      if (!widget.current) {
        widget.current = new LineWidget(widgetManager, bounds);
      }
    } else if (showWidget == 'vtkSphereWidget') {
      if (!widget.current) {
        widget.current = new SphereWidget(widgetManager, bounds);
      }
    } else if (showWidget === 'vtkDistanceWidget') {
      if (!widget.current) {
        widget.current = new DistanceWidget(widgetManager, bounds);
      }
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
