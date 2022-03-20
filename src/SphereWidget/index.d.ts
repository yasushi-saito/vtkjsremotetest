// Copyright 2022 Luminary Cloud, Inc. All Rights Reserved.

import vtkAbstractWidget from '@kitware/vtk.js/Widgets/Core/AbstractWidget';
import { Vector3 } from '@kitware/vtk.js/types';// eslint-disable-line import/no-unresolved

export interface HandleState {
  getOrigin(): Vector3;
  setOrigin(arg: Vector3): void;
  getColor(): string;
  setColor(arg: string):void;
  getScale1(): number;
  setScale1(arg: number): void;
  getVisible(): boolean;
  setVisible(arg: boolean):void
  setShape(arg: string): void;
  getShape(): string;
}

export interface vtkSphereWidgetState {
  // A handle that defines the center of the sphere.
  getCenterHandle(): HandleState;
  // An arbitrary point at the sphere boundary. Used only to set the radius.
  getBoundaryHandle(): HandleState;

  // Internal state for drawing the sphere.
  getSphereHandle(): HandleState;
}

export interface vtkSphereWidget extends vtkAbstractWidget<vtkSphereWidgetState> {
  getRadius(): number;
}

interface IInitialValues {}

export function newInstance(props?: IInitialValues): vtkSphereWidget;

export const vtkSphereWidget: {
  newInstance: typeof newInstance;
};

export default vtkSphereWidget;
