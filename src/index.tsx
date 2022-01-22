import { newClient } from './geometryRender';
const container = document.getElementById("root");
if (!container) throw Error("no 'root' element found");
const c = newClient(container);
