declare module '@kitware/vtk.js/Rendering/Misc/SynchronizableRenderWindow' {

import { vtkRenderWindow, IRenderWindowInitialValues } from '@kitware/vtk.js/Rendering/Core/RenderWindow';

type ViewId = string;

export interface SynchContext {
    setFetchArrayFunction(fetcher: (hash: string, binary: any) => Promise<ArrayBuffer>): void;
    getArray(sha: string, dataType: any, context: SynchContext): Promise<ArrayBuffer>;
    emptyCachedArrays(): void;
    freeOldArrays(threshold: number, context: SynchContext): void;

    // instanceMap
    getInstance(id: any): any;
    getInstanceId(instance: any): any | null;
    registerInstance(id: any, instance: any): void;
    unregister(id: any): void;
    emptyCachedInstances(): void;

    // sceneMtimeHandler
    getMtime(): number;
    incrementMtime(viewId: ViewId): number;
    setActiveViewId(viewId: ViewId): void;
    getActiveViewId(): string;

    // TODO: fill progresshandler
}

export interface IInitialValues extends IRenderWindowInitialValues {
  synchronizerContextName?: string; // default: 'default':
  synchronizerContext?: SynchContext | null;
  synchronizedViewId?: string | null;
}

export interface ViewState {
  id: ViewId;
  mtime: number;
  parent?: string | null;
  type?: string;
  properties?: {[key: string]: any};
  dependencies?: ViewState[];
  extra?: any;
  // ViewState may contain other arbitrary key / value pairs.
  [key: string]: any;
}

export interface vtkSynchronizableRenderWindowInstance extends vtkRenderWindow {
  getSynchronizerContext(): SynchContext;

  // methods added by createSyncFunction
  synchronize(state: ViewState): Promise<boolean>;
  setSynchronizedViewId(viewId: ViewId): void;
  getSynchronizedViewId(): string;
  updateGarbageCollectorThreshold(v: number): void;
  getManagedInstanceIds(): Array<string>;
  clearOneTimeUpdaters(): void;
}

export function newInstance(props: IInitialValues): vtkSynchronizableRenderWindowInstance;
export function getSynchronizerContext(name?: string): SynchContext;

  export function extraRenderer(r: any): void;

export const vtkSynchronizableRenderWindow: {
  newInstance: typeof newInstance;
  getSynchronizerContext: typeof getSynchronizerContext;
  extraRenderer: typeof extraRenderer;
}

export default vtkSynchronizableRenderWindow;
}
