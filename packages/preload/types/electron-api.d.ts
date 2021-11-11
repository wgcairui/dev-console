
interface ElectronApi {
  readonly versions: Readonly<NodeJS.ProcessVersions>
  send: (channel: string, ...args: any[]) => void
  on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => Electron.IpcRenderer
  invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
  sendSync: (channel: string, ...args: any[]) => any
  bufferFrom: (data: Uint8Array | ReadonlyArray<number> | string, encoding?: BufferEncoding) => Buffer
}

declare interface Window {
  electron: Readonly<ElectronApi>
  electronRequire?: NodeRequire
}
