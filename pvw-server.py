#!/usr/local/opt/paraview_egl/bin/pvbatch
r"""
    This module is a ParaViewWeb server application.
    The following command line illustrates how to use it::

        $ pvpython -dr .../pvw-server.py --port 1234

    Any ParaViewWeb executable script comes with a set of standard arguments that can be overridden if need be::

        --port 8080
             Port number on which the HTTP server will listen.

        --content /path-to-web-content/
             Directory that you want to serve as static web content.
             By default, this variable is empty which means that we rely on another
             server to deliver the static content and the current process only
             focuses on the WebSocket connectivity of clients.

        --authKey vtkweb-secret
             Secret key that should be provided by the client to allow it to make
             any WebSocket communication. The client will assume if none is given
             that the server expects "vtkweb-secret" as secret key.

"""

import argparse
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

render_window_serializer.initializeSerializers()

# =============================================================================
# Create custom Pipeline Manager class to handle clients requests
# =============================================================================

class _Server(pv_wslink.PVServerProtocol):

    authKey = "wslink-secret"
    viewportScale=1.0
    viewportMaxWidth=2560
    viewportMaxHeight=1440
    settingsLODThreshold = 102400

    def initialize(self):
        # Bring used components
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebMouseHandler())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebViewPort(_Server.viewportScale, _Server.viewportMaxWidth, _Server.viewportMaxHeight))
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebPublishImageDelivery(decode=False))
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebLocalRendering())

        # Update authentication key to use
        self.updateSecret(_Server.authKey)

        # tell the C++ web app to use no encoding. ParaViewWebPublishImageDelivery must be set to decode=False to match.
        self.getApplication().SetImageEncoding(0);

        # Disable interactor-based render calls
        simple.GetRenderView().EnableRenderOnInteraction = 0
        simple.GetRenderView().Background = [0,0,0]

        # ProxyManager helper
        pxm = simple.servermanager.ProxyManager()

        # Update interaction mode
        interactionProxy = pxm.GetProxy('settings', 'RenderViewInteractionSettings')
        interactionProxy.Camera3DManipulators = ['Rotate', 'Pan', 'Zoom', 'Pan', 'Roll', 'Pan', 'Zoom', 'Rotate', 'Zoom']

        # Custom rendering settings
        renderingSettings = pxm.GetProxy('settings', 'RenderViewSettings')
        renderingSettings.LODThreshold = _Server.settingsLODThreshold

        # Put something in the scene
        self.cone = simple.Cone()
        self.cone.Center = [30, 40, 33]
        self.cone.Height = 50
        self.cone.Radius = 60

        rep = simple.Show()
        rep.Representation = 'Surface With Edges';
        rep.LineWidth = 2
        view = simple.Render()
        view.Background2 = [0.5, 0.5, 0.5]
        view.BackgroundColorMode = "Gradient"


# =============================================================================
# Main: Parse args and start server
# =============================================================================

if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description="ParaViewWeb Server")

    # Add arguments
    server.add_arguments(parser)
    args = parser.parse_args()

    # Start server
    server.start_webserver(options=args, protocol=_Server)
