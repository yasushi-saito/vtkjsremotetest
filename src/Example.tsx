// import React, {FC, useEffect, useRef, useState} from 'react';
import React, { FC, useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';

import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkImplicitPlaneWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget';
import SmartConnect from 'wslink/src/SmartConnect';
import WebsocketConnection from 'wslink/src/WebsocketConnection';

import GeometryRenderManager from './GeometryRenderManager';

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

function newImplicitPlaneWidget(renderer: vtkRenderer) : vtkImplicitPlaneWidget {
  const widget = vtkImplicitPlaneWidget.newInstance();
  widget.getWidgetState().setNormal(0, 0, 1);
  widget.placeWidget([0, 1, 0, 2, 0, 3]);
  widget.setPlaceFactor(3);
  return widget;
}

const Example: FC<{}> = () => {
  const sc = useRef<SmartConnect>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [grm, setGrm] = useState<GeometryRenderManager | null>(null);

  const [showWidget, setShowWidget] = useState<boolean>(false);

  const onReady = (conn: WebsocketConnection) => {
    console.log('CONNECTED!');
    const grm = new GeometryRenderManager({
      elem: canvas.current,
      session: conn.getSession(),
    });
    grm.start(() => {
      grm.getLocalRenderer().addActor(newCone());
      // newImplicitPlaneWidget(grm.getRemoteRenderer());
      setGrm(grm);
    });
  };

  useEffect(() => {
    if (sc.current || !canvas.current) {
      throw Error(`useref: ${sc.current} ${canvas.current}`);
    }

    const config = { sessionURL: 'ws://localhost:1234/ws' };
    sc.current = SmartConnect.newInstance({ config });
    sc.current.connect();
    sc.current.onConnectionReady(onReady);
    sc.current.onConnectionError(console.error);
    sc.current.onConnectionClose(console.error);
    return () => {
      // TODO(saito) grm.stop must be called when the pv server fails before
      // onRendererReady.
      if (grm) grm.stop();
    };
  }, []);

  const widget = useRef<vtkImplicitPlaneWidget | null>(null);
  useEffect(() => {
    if (!grm) return;
    if (showWidget) {
      if (!widget.current) {
        widget.current = newImplicitPlaneWidget(grm.getRemoteRenderer());
      }
      grm.addWidget(widget.current);
    } else {
      grm.removeWidgets();
    }
    grm.render();
  }, [grm, showWidget])

  // style="height:50vh; width: 50vw"
  return (
    <>
      <Button onClick={() => setShowWidget(!showWidget)}>
        { showWidget ? "Hide widget" : "Show widget"}
      </Button>
      <div>
        {grm ? 'connected' : 'Not connected!'}
        <div
          ref={canvas}
          style={{
            height: '100vh',
            width: '100vw',
          }}
        />
      </div>
    </>
  );
};

export default Example;
