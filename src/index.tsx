import { Client } from './geometryRender';


const container = document.getElementById("root");
if (!container) throw Error("no 'root' element found");
const c = new Client(container);
