// import React, {FC, useEffect, useRef, useState} from 'react';
import React, { FC, useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';

import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkImplicitPlaneWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget';
import SmartConnect from 'wslink/src/SmartConnect';
import WebsocketConnection, {WebsocketSession} from 'wslink/src/WebsocketConnection';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';

import vtkImageStream from '@kitware/vtk.js/IO/Core/ImageStream';

const ImageExample: FC<{}> = () => {
  const sc = useRef<SmartConnect>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const session = useRef<WebsocketSession|null>(null);

  useEffect(() => {
    if (sc.current || !canvas.current) {
      throw Error(`useref: ${sc.current} ${canvas.current}`);
    }

    const config = { sessionURL: 'ws://localhost:1234/ws' };
    sc.current = SmartConnect.newInstance({ config });
    sc.current.connect();
    sc.current.onConnectionReady((conn: WebsocketConnection) => {
      session.current = conn.getSession();
      const imageStream = vtkImageStream.newInstance();
      (imageStream as any).connect(conn.getSession());
      const viewStream = imageStream.createViewStream(-1);

      const renderWindow = vtkRenderWindow.newInstance();
      const renderer = vtkRenderer.newInstance();
      renderWindow.addRenderer(renderer);

      const openGL = vtkOpenGLRenderWindow.newInstance();
      openGL.setContainer(canvas.current);
      renderWindow.addView(openGL);
      openGL.setViewStream(viewStream);

      const interactor = vtkRenderWindowInteractor.newInstance();
      interactor.setInteractorStyle(
        vtkInteractorStyleTrackballCamera.newInstance()
      );
      interactor.setView(openGL);
      interactor.initialize();
      interactor.bindEvents(canvas.current);

      const localRenderer = vtkRenderer.newInstance();
      localRenderer.setLayer(0);
      localRenderer.setInteractive(true);
      renderWindow.addRenderer(localRenderer);

      viewStream.setInteractiveRatio(0.7); // the scaled image compared to the clients view resolution
      viewStream.setInteractiveQuality(50); // jpeg quality
      viewStream.setCamera(localRenderer.getActiveCamera());
      viewStream.pushCamera();
      renderWindow.getInteractor().onStartAnimation(viewStream.startInteraction);
      renderWindow.getInteractor().onEndAnimation(viewStream.endInteraction);
    });
    sc.current.onConnectionError(console.error);
    sc.current.onConnectionClose(console.error);
  }, []);

  const runRpc = (method: string, args: any[]) => {
    if (!session.current) return;
    session.current.call(method, args).then((result: any) => {
      console.log(`${method}: ${JSON.stringify(result)}`);
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
          height: '70vh',
          width: '70vw',
        }}
      />
    </>
  );
};

export default ImageExample;
