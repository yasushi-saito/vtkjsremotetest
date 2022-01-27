Examples of paraview server / vtk-js integration.

This package contains minimal examples that demonstrates rendering contents of
remote paraview server in a browser.

- `GeometryExample` uses WebGL to render contents

- `ImageExample` performs image rendering. The server sends
  a series of jpeg images for the scene.

To run:

```
yarn install
yarn run start && pvbatch ./server/server.py --port=1234
```
