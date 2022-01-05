export interface Disposable {
  dispose(): any;
}

export interface Scripts {
  [key: string]: string;
}

export interface PackageJson {
  scripts: Scripts;
}
