export type ToolType = 
  | 'select'
  | 'pan'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'shape'
  | 'text'
  | 'sticky'
  | 'formula'
  | 'laser';

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'star';

export type GridType = 'blank' | 'dots' | 'lines' | 'grid' | 'isometric' | 'ruled';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  rotation?: number;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  createdAt: number;
  updatedAt: number;
}

export interface StrokeElement extends BaseElement {
  type: 'pen' | 'highlighter';
  points: number[];
  color: string;
  size: number;
  tension?: number;
  lineCap?: 'round' | 'butt' | 'square';
  lineJoin?: 'round' | 'bevel' | 'miter';
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  width: number;
  height: number;
  radius?: number;
  fill?: string;
  stroke: string;
  strokeWidth: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  fontWeight?: string;
  fontStyle?: string;
  width?: number;
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  text: string;
  color: string; // e.g., yellow, cyan, purple, lime
  width: number;
  height: number;
}

export interface FormulaElement extends BaseElement {
  type: 'formula';
  latex: string;
  renderedText: string;
  fontSize: number;
  color: string;
}

export type CanvasElement = 
  | StrokeElement 
  | ShapeElement 
  | TextElement 
  | StickyElement 
  | FormulaElement;

export interface Page {
  id: string;
  title: string;
  elements: CanvasElement[];
  gridType: GridType;
  backgroundColor: string;
}

export interface WhiteboardProject {
  id: string;
  title: string;
  description?: string;
  subject: string;
  tags: string[];
  ownerId: string;
  ownerEmail?: string;
  pages: Page[];
  activePageIndex: number;
  driveFileId?: string;
  driveWebViewLink?: string;
  thumbnailUrl?: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface WhiteboardTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  icon: string;
  gridType: GridType;
  initialElements?: CanvasElement[];
  recommendedFor: ('teacher' | 'professor' | 'student')[];
}
