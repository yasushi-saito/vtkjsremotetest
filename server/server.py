#!/usr/local/opt/paraview_egl/bin/pvbatch

import argparse
import logging
import os
import sys

# import paraview modules.
from paraview.web import pv_wslink
from paraview.web import protocols as pv_protocols

# import RPC annotation
from wslink import register as exportRpc

from paraview import simple
from wslink import server

import vtkmodules.web.render_window_serializer as render_window_serializer

from typing import List

render_window_serializer.initializeSerializers()

# The mesh to load. Change it as you wish.
#STL_PATH = "/home/saito/src0/testdata/pug.stl"

ROOT_DIR = "/junk/snapshot"
#ROOT_DIR = "/home/saito/mesh/snapshot"
MESH_PATH = f"{ROOT_DIR}/crm_inv/data/p-wq3mkt3nyg4h4sodr5fovaf2xukkke0tfqarskpq8g68i3ykoe/jobid=fvm-64uog6svhfruyjnyvzotluippi9g4p0mrwmy2oudi13u7r2bhf&iter=274@rank=0&name=out.lcsoln"

class _Server(pv_wslink.PVServerProtocol):
    authKey = "wslink-secret"
    viewportScale = 1.0
    viewportMaxWidth = 2560
    viewportMaxHeight = 1440
    settingsLODThreshold = 102400

    def initialize(self):
        # Bring used components
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebMouseHandler())
        self.registerVtkWebProtocol(
            pv_protocols.ParaViewWebViewPort(
                _Server.viewportScale,
                _Server.viewportMaxWidth,
                _Server.viewportMaxHeight,
            )
        )
        self.registerVtkWebProtocol(
            pv_protocols.ParaViewWebPublishImageDelivery(decode=False)
        )
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebLocalRendering())

        # Update authentication key to use
        self.updateSecret(_Server.authKey)

        # tell the C++ web app to use no encoding. ParaViewWebPublishImageDelivery must be set to decode=False to match.
        self.getApplication().SetImageEncoding(0)

        # Disable interactor-based render calls
        simple.GetRenderView().EnableRenderOnInteraction = 0
        simple.GetRenderView().Background = [0, 0, 0]

        # ProxyManager helper
        pxm = simple.servermanager.ProxyManager()

        # Update interaction mode
        interactionProxy = pxm.GetProxy("settings", "RenderViewInteractionSettings")
        interactionProxy.Camera3DManipulators = [
            "Rotate",
            "Pan",
            "Zoom",
            "Pan",
            "Roll",
            "Pan",
            "Zoom",
            "Rotate",
            "Zoom",
        ]

        # Custom rendering settings
        renderingSettings = pxm.GetProxy("settings", "RenderViewSettings")
        renderingSettings.LODThreshold = _Server.settingsLODThreshold

        self.mesh = None
        self.rep = None
        self.view = simple.Render()
        self.view.Background2 = [0.1, 0.1, 0.3]
        self.view.BackgroundColorMode = "Gradient"

    @exportRpc("test.readmesh")
    def read_mesh(self, path: str) -> List[str]:
        logging.info(f"readmesh {path}")
        if not self.mesh or self.mesh.FileName != MESH_PATH:
            if self.mesh:
                simple.Hide(self.rep)
                simple.Delete(self.mesh)
            self.mesh = simple.SbmeshReader(FileName=MESH_PATH)

        self.rep = simple.Show(self.mesh)
        self.rep.Representation = "Surface With Edges"
        self.rep.LineWidth = 2

        #self.mesh.FileNames = [STL_PATH]
        simple.UpdatePipeline(proxy=self.mesh)
        logging.info(f"PUG: app={self.getApplication()} {self.mesh.GetDataInformation().GetBounds()}")
        self.getApplication().InvokeEvent("UpdateEvent")
        di = self.mesh.GetDataInformation()
        return {
            "bounds": di.GetBounds()
        }

    @exportRpc("test.setrepresentation")
    def set_representation(self, typ: str) -> None:
        if self.rep:
            logging.info(f"setrepresentation {typ}")
            self.rep.Representation = typ
            self.getApplication().InvokeEvent("UpdateEvent")
            return None

# =============================================================================
# Main: Parse args and start server
# =============================================================================

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(filename)s:%(lineno)d] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )
    # Create argument parser
    parser = argparse.ArgumentParser(description="ParaViewWeb Server")

    # Add arguments
    server.add_arguments(parser)
    args = parser.parse_args()

    # Start server
    server.start_webserver(options=args, protocol=_Server)
