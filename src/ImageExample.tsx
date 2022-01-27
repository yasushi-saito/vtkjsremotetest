// import React, {FC, useEffect, useRef, useState} from 'react';
import React, { FC, useEffect, useRef, useState } from 'react';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import Button from '@material-ui/core/Button';

import vtkInteractorStyleRemoteMouse from '@kitware/vtk.js/Interaction/Style/InteractorStyleRemoteMouse';
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

interface CameraState {
  center: [number,number,number];
  focal: [number,number,number];
  up: [number,number,number];
  position: [number,number,number];
  angle: number;
  parallelProjection?: boolean;
  scale?: number;
}

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

      const setCamera = (state: CameraState) => {
        console.log(`CAMERA: ${JSON.stringify(state)}`);
        const camera = renderer.getActiveCamera();
        camera.setFocalPoint(state.focal[0], state.focal[1], state.focal[2]);
        camera.setParallelProjection(state.parallelProjection);
        camera.setParallelScale(state.scale);
        camera.setPosition(state.position[0], state.position[1], state.position[2]);
        camera.setViewUp(state.up[0], state.up[1], state.up[2]);
        camera.setViewAngle(state.angle);
        renderWindow.render()
      };

      const interactor = vtkRenderWindowInteractor.newInstance();
      if (false) {
        interactor.setInteractorStyle(
          vtkInteractorStyleTrackballCamera.newInstance()
        );
      } else {
        const style = vtkInteractorStyleRemoteMouse.newInstance();
        interactor.setInteractorStyle(style);
        style.setRemoteEventAddOn({ view: "-1" });
        style.onRemoteMouseEvent((e: any) => {
          session.current.call('viewport.mouse.interaction', [e]).then(setCamera);
        });
        style.onRemoteWheelEvent((e: any) => {
          session.current.call('viewport.mouse.zoom.wheel', [e]).then(setCamera);
        });

      }
      interactor.setView(openGL);
      interactor.initialize();
      interactor.bindEvents(canvas.current);

      viewStream.setInteractiveRatio(0.7); // the scaled image compared to the clients view resolution
      viewStream.setInteractiveQuality(50); // jpeg quality
      viewStream.setCamera(renderer.getActiveCamera());
      viewStream.pushCamera();
      //renderWindow.getInteractor().onStartAnimation(viewStream.startInteraction);
      //renderWindow.getInteractor().onEndAnimation(viewStream.endInteraction);

      if (true) {
        const coneSource = vtkConeSource.newInstance();
        coneSource.setRadius(1);
        coneSource.setHeight(1);
        const actor = vtkActor.newInstance();
        const mapper = vtkMapper.newInstance();

        actor.setMapper(mapper);
        (mapper as any).setInputConnection(coneSource.getOutputPort());

        actor.getProperty().setRepresentation(2);
        actor.getProperty().setColor(0.5, 0.5, 0.5);
        actor.getProperty().setInterpolationToFlat();

        renderer.addActor(actor);
      }

      const onResize = () => {
        const rect = canvas.current.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        console.log(`SIZE: ${rect.width*devicePixelRatio}, ${rect.height*devicePixelRatio}`);
        openGL.setSize(rect.width*devicePixelRatio, rect.height*devicePixelRatio);
        renderWindow.render();
      };

      const resizeObserver = new ResizeObserver(() => {
        onResize();
      });
      resizeObserver.observe(canvas.current);
    });
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
          position: "relative",
          height: '70vh',
          width: '70vw',
        }}
      />
    </>
  );
};

export default ImageExample;
