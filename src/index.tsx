import * as React from 'react';
import * as ReactDOM from 'react-dom';

import GeometryExample from './GeometryExample';
import ImageExample from './ImageExample';
import RemoteViewExample from './RemoteViewExample';

const rootContainer = document.getElementById('root');
ReactDOM.unmountComponentAtNode(rootContainer);
ReactDOM.render(
  <ImageExample />,
  rootContainer,
);

/* import { newClient } from './geometryRender';
 const container = document.getElementById("root");
 if (!container) throw Error("no 'root' element found");
 const c = newClient(container);
+*/
