// import React, {FC, useEffect, useRef, useState} from 'react';
import React, { FC, useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';

import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkImplicitPlaneWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget';
import SmartConnect from 'wslink/src/SmartConnect';
import WebsocketConnection, {WebsocketSession} from 'wslink/src/WebsocketConnection';

import vtkRemoteView, {connectImageStream} from '@kitware/vtk.js/Rendering/Misc/RemoteView';

const RemoteViewExample: FC<{}> = () => {
  const sc = useRef<SmartConnect | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const session = useRef<WebsocketSession|null>(null);

  useEffect(() => {
    if (sc.current || !canvas.current) {
      throw Error(`useref: ${sc.current} ${canvas.current}`);
    }

    const view = vtkRemoteView.newInstance({
      rpcWheelEvent: 'viewport.mouse.zoom.wheel',
    });
    view.setContainer(canvas.current);
    view.setInteractiveRatio(0.7); // the scaled image compared to the clients view resolution
    view.setInteractiveQuality(50); // jpeg quality

    const config = { sessionURL: 'ws://localhost:1234/ws' };
    sc.current = SmartConnect.newInstance({ config });
    sc.current.connect();
    sc.current.onConnectionReady((conn: WebsocketConnection) => {
      session.current = conn.getSession();
      connectImageStream(conn.getSession());
      view.setSession(conn.getSession());
      view.setViewId("-1");
      view.render();
    });
    sc.current.onConnectionError(console.error);
    sc.current.onConnectionClose(console.error);
  }, []);

  const runRpc = (method: string, args: any[]) => {
    if (!session.current) return;
    session.current.call(method, args).then((result: any) => {
      console.log(`${method}: ${result}`);
    }).catch((err: Error) => {
      console.log(`${method} error: ${JSON.stringify(err)}`);
    });
  };

  return (
    <>
      <Button onClick={() => runRpc('test.readmesh', ['foo.stl'])}>
        Load mesh
      </Button>
      <Button onClick={() => runRpc('test.setrepresentation', ['Surface With Edges'])}>
        Surface with edges
      </Button>
      <Button onClick={() => runRpc('test.setrepresentation', ['Surface'])}>
        Surface
      </Button>
      <div
        ref={canvas}
        style={{
          zIndex: "0",
          position: "relative",
          height: '70vh',
          width: '70vw',
        }}
      />
    </>
  );
};

export default RemoteViewExample;
