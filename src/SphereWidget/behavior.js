import shapeBehavior from '@kitware/vtk.js/Widgets/Widgets3D/ShapeWidget/behavior';
import macro from '@kitware/vtk.js/macros.js';
import { vec3 } from 'gl-matrix';

// Copyright 2022 Luminary Cloud, Inc. All Rights Reserved.

export default function widgetBehavior(publicAPI, model) {
    const state = model.widgetState;
    const moveHandle = state.getMoveHandle();
    const centerHandle = state.getCenterHandle();
    const borderHandle = state.getBorderHandle();
    const shapeHandle = state.getSphereHandle();

    // Set while moving the center or border handle.
    model.isDragging = false;
    // The last world coordinate of the mouse cursor during dragging.
    model.previousPosition = null;

    centerHandle.setManipulator(model.manipulator);
    borderHandle.setManipulator(model.manipulator);
    model.classHierarchy.push('vtkSphereWidgetProp');

    moveHandle.setVisible(true);
    centerHandle.setVisible(false);
    borderHandle.setVisible(false);
    shapeHandle.setVisible(true);

    // Update the sphereHandle parameters from {center,border}Handle.
    function updateSphere() {
        const center = centerHandle.getOrigin();
        if (!center) return;

        centerHandle.setVisible(true);
        let border = borderHandle.getOrigin();
        if (border) {
            borderHandle.setVisible(true);
        } else {
            border = moveHandle.getOrigin();
            if (!border) return;
        }
        if (isPlaced()) {
            moveHandle.setVisible(false);
        }
        const radius = vec3.distance(center, border);
        shapeHandle.setVisible(true);
        shapeHandle.setOrigin(center);
        shapeHandle.setScale1(radius*2);
        model.interactor.render();
    }

    function isPlaced() {
        return !!centerHandle.getOrigin() && !!borderHandle.getOrigin();
    }

    function currentWorldCoords(e) {
        return model.manipulator.handleEvent(e, model.apiSpecificRenderWindow);
    }

    // Update the sphere's center and r adius.  Example:
    // handle.setCenterAndRadius([1,2,3], 10);
    publicAPI.setCenterAndRadius = (newCenter, newRadius) => {
        const oldCenter = centerHandle.getOrigin();
        const oldBorder = borderHandle.getOrigin();
        let newBorder = [newCenter[0] + newRadius, newCenter[1], newCenter[2]];
        if (oldBorder) {
            // Move the boundary handle to reflect the new radius, while preserving
            // its direction relative to the center.
            const direction = vec3.sub(vec3.create(), oldBoundary, oldCenter);
            const oldRadius = vec3.length(direction);
            if (oldRadius > 1e-10) {
                newBorder = vec3.add(
                    vec3.create(),
                    newCenter,
                    vec3.scale(vec3.create(), direction, newRadius / oldRadius),
                );
            }
        }
        centerHandle.setOrigin(newCenter);
        borderHandle.setOrigin(newBorder);
        updateSphere();
        model.widgetManager.enablePicking();
    }

    publicAPI.handleLeftButtonPress = (e) => {
        console.log(`LEFTBUTTON 0 ${model.isDragging}`);
        if ((model.activeState != centerHandle &&
             model.activeState != borderHandle &&
             model.activeState != moveHandle)) {
            model.activeState = null;
            return macro.VOID;
        }
        console.log(`LEFTBUTTON`);
        const worldCoords = currentWorldCoords(e);

        if (model.activeState == moveHandle) {
            if (!centerHandle.getOrigin()) {
                centerHandle.setOrigin(worldCoords);
            } else if (!borderHandle.getOrigin()) {
                borderHandle.setOrigin(worldCoords);
            }
            updateSphere();
        }
        model.isDragging = true;
        model.apiSpecificRenderWindow.setCursor('grabbing');
        model.previousPosition = [
            ...currentWorldCoords(e),
        ];
        publicAPI.invokeStartInteractionEvent();
        return macro.EVENT_ABORT;
    };

    publicAPI.handleLeftButtonRelease = (e) => {
        if (!model.isDragging) {
            model.activeState = null;
            return macro.VOID;
        }
        if (isPlaced()) {
            console.debug(`leftbutton release: ${JSON.stringify(e)}`);
            model.previousPosition = null;
            model.widgetManager.enablePicking();
            model.apiSpecificRenderWindow.setCursor('pointer');
            model.isDragging = false;
            model.activeState = null;
            state.deactivate();
        }
        publicAPI.invokeEndInteractionEvent();
        return macro.EVENT_ABORT;
    };

    publicAPI.handleMouseMove = (e) => {
        if (!model.isDragging) {
            model.activeState = null;
            return macro.VOID;
        }
        if (!model.activeState) {
            throw Error('no activestate');
        }
        const worldCoords = currentWorldCoords(e);
        if (model.activeState == centerHandle) {
            centerHandle.setOrigin(worldCoords);
            if (borderHandle.getOrigin()) {
                if (!model.previousPosition) {
                    // !previousPosition here happens only immediately
                    // after grabFocus, but grabFocus resets
                    // borderHandle.origin.
                    throw Error(`no prev pos ${model.activeState} ${previousPosition}`);
                }
                // Move the whole sphere by moving the borderhandle parallel to
                // the centerhandle.
                const translation = vec3.sub([], worldCoords, model.previousPosition);
                borderHandle.setOrigin(vec3.add([], borderHandle.getOrigin(), translation));
            }
        } else {
            // Move or border handle.
            model.activeState.setOrigin(worldCoords);
        }
        model.previousPosition = worldCoords;
        updateSphere();
        return macro.VOID;
    };

    publicAPI.grabFocus = () => {
        moveHandle.setVisible(true);
        centerHandle.setVisible(false);
        borderHandle.setVisible(false);
        centerHandle.setOrigin(null);
        borderHandle.setOrigin(null);
        model.isDragging = true;
        model.activeState = moveHandle;
        model.interactor.render();
    }

    publicAPI.loseFocus = () => {}
}
