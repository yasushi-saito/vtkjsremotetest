import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Example from './Example';

const rootContainer = document.getElementById('root');
ReactDOM.unmountComponentAtNode(rootContainer);
ReactDOM.render(
  <Example />,
  rootContainer,
);

/* import { newClient } from './geometryRender';
 const container = document.getElementById("root");
 if (!container) throw Error("no 'root' element found");
 const c = newClient(container);
+*/
