// Adobe ExtendScript 全局对象类型定义
declare var app: any;
declare var activeDocument: any;
declare var documents: any;

// After Effects 特定对象
declare interface Project {
  items: ItemCollection;
  activeItem: CompItem | FootageItem;
  file: File;
  save(): void;
  close(): void;
}

declare interface CompItem {
  name: string;
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  layers: LayerCollection;
  selectedLayers: Layer[];
}

declare interface Layer {
  name: string;
  index: number;
  enabled: boolean;
  locked: boolean;
  shy: boolean;
  solo: boolean;
  property(name: string): Property;
}

declare interface Property {
  name: string;
  value: any;
  setValue(value: any): void;
  setValueAtTime(time: number, value: any): void;
}

// Photoshop 特定对象
declare interface Document {
  name: string;
  width: number;
  height: number;
  resolution: number;
  layers: LayerSet;
  activeLayer: ArtLayer;
}

declare interface ArtLayer {
  name: string;
  opacity: number;
  visible: boolean;
  blendMode: BlendMode;
}

// 文件系统对象
declare class File {
  constructor(path: string);
  name: string;
  fullName: string;
  parent: Folder;
  exists: boolean;
  open(mode: string): boolean;
  read(): string;
  write(text: string): boolean;
  close(): boolean;
  execute(): boolean;
  static openDialog(prompt?: string): File;
  static saveDialog(prompt?: string): File;
}

declare class Folder {
  constructor(path: string);
  name: string;
  fullName: string;
  exists: boolean;
  getFiles(mask?: string): Array<File | Folder>;
  static selectDialog(prompt?: string): Folder;
}

// 全局函数
declare function alert(message: string): void;
declare function confirm(message: string): boolean;
declare function prompt(message: string, defaultValue?: string): string;
declare function writeLn(text: string): void;
declare function parseInt(string: string, radix?: number): number;
declare function parseFloat(string: string): number;
declare function isNaN(value: any): boolean;
declare function encodeURI(uri: string): string;
declare function decodeURI(uri: string): string;