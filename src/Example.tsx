// import React, {FC, useEffect, useRef, useState} from 'react';
import React, { FC, useEffect, useRef, useState } from 'react';

import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
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

const Example: FC<{}> = () => {
  const sc = useRef<SmartConnect>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [grm, setGrm] = useState<GeometryRenderManager | null>(null);

  const onReady = (conn: WebsocketConnection) => {
    console.log('CONNECTED!');
    new GeometryRenderManager({
      elem: canvas.current,
      session: conn.getSession(),
      onRendererReady: (grm: GeometryRenderManager) => {
        grm.getLocalRenderer().addActor(newCone());
        setGrm(grm);
      },
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
  }, []);

  // style="height:50vh; width: 50vw"
  return (
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
  );
};

export default Example;
