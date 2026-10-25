export type ToolType = 
  | 'select'
  | 'pan'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'shape'
  | 'text'
  | 'sticky'
  | 'image'
  | 'formula'
  | 'laser'
  | 'graph'
  | 'table'
  | 'flowchart'
  | 'mindmap';

export type ShapeType = 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'arrow' | 'line' | 'star';

export type GridType = 'blank' | 'dots' | 'lines' | 'grid' | 'isometric' | 'ruled' | 'coordinate';

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
  isLocked?: boolean;
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
  color: string;
  width: number;
  height: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
  alt?: string;
}

export interface FormulaElement extends BaseElement {
  type: 'formula';
  latex: string;
  renderedText: string;
  fontSize: number;
  color: string;
  renderedSvg?: string;
  width?: number;
  height?: number;
}

export interface GraphElement extends BaseElement {
  type: 'graph';
  expression: string; // e.g. "sin(x)", "x^2 - 4", "2*x + 1"
  label: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  width: number;
  height: number;
  strokeColor: string;
  showAxes?: boolean;
  showGrid?: boolean;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  headers: string[];
  data: string[][];
  width: number;
  height: number;
  borderColor?: string;
  headerBg?: string;
}

export type FlowchartNodeType = 'process' | 'decision' | 'terminator' | 'io';

export interface FlowchartNodeElement extends BaseElement {
  type: 'flowchart';
  nodeType: FlowchartNodeType;
  label: string;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface MindmapNodeElement extends BaseElement {
  type: 'mindmap';
  label: string;
  parentId?: string; // root has no parentId
  level: number; // 0 for root topic, 1 for branches, 2 for sub-branches
  color: string;
  width: number;
  height: number;
  isRoot?: boolean;
}

export type CanvasElement = 
  | StrokeElement 
  | ShapeElement 
  | TextElement 
  | StickyElement 
  | ImageElement
  | FormulaElement
  | GraphElement
  | TableElement
  | FlowchartNodeElement
  | MindmapNodeElement;

export interface Page {
  id: string;
  title: string;
  elements: CanvasElement[];
  gridType: GridType;
  backgroundColor: string;
  pdfBackground?: string; // Data URL for imported PDF background page
}

export interface WhiteboardProject {
  id: string;
  title: string;
  description?: string;
  subject: string;
  tags: string[];
  ownerId: string;
  ownerEmail?: string;
  isFavorite?: boolean;
  isTrashed?: boolean;
  trashedAt?: number;
  sharedWith?: string[];
  pages: Page[];
  activePageIndex: number;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveRevisionId?: string;
  driveSyncedAt?: number;
  schemaVersion?: string;
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
