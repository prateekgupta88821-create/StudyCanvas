import { WhiteboardProject, Page, CanvasElement } from '@/types/whiteboard';

export const CURRENT_SCHEMA_VERSION = '2.0.0';

/**
 * Validates and migrates any versioned StudyCanvas project JSON to the latest schema version.
 * Supports legacy V1 projects (without schemaVersion or with missing grid types/elements).
 */
export function migrateProject(raw: unknown): WhiteboardProject {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid project file: expected a JSON object.');
  }

  const data = raw as Record<string, any>;

  // Basic sanity check
  const id = typeof data.id === 'string' ? data.id : 'canvas_' + Math.random().toString(36).substring(2, 9);
  const title = typeof data.title === 'string' ? data.title : 'Untitled Whiteboard';
  const subject = typeof data.subject === 'string' ? data.subject : 'General';
  const ownerId = typeof data.ownerId === 'string' ? data.ownerId : 'guest';
  const tags = Array.isArray(data.tags) ? data.tags : ['Notes'];
  const version = typeof data.version === 'number' ? data.version : 2;
  const createdAt = typeof data.createdAt === 'number' ? data.createdAt : Date.now();
  const updatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : Date.now();

  // Validate or migrate pages
  let pages: Page[] = [];
  if (Array.isArray(data.pages) && data.pages.length > 0) {
    pages = data.pages.map((p: any, idx: number): Page => {
      const pageId = typeof p.id === 'string' ? p.id : `page-${idx + 1}`;
      const pageTitle = typeof p.title === 'string' ? p.title : `Page ${idx + 1}`;
      const gridType = p.gridType || 'dots';
      const backgroundColor = p.backgroundColor || '#090b0e';
      const elements: CanvasElement[] = Array.isArray(p.elements)
        ? p.elements.map((el: any) => migrateElement(el))
        : [];

      return {
        id: pageId,
        title: pageTitle,
        elements,
        gridType,
        backgroundColor,
        pdfBackground: p.pdfBackground,
      };
    });
  } else {
    // Default initial page if project had no pages
    pages = [
      {
        id: 'page-1',
        title: 'Page 1',
        elements: [],
        gridType: 'dots',
        backgroundColor: '#090b0e',
      },
    ];
  }

  const activePageIndex = typeof data.activePageIndex === 'number' && data.activePageIndex >= 0 && data.activePageIndex < pages.length
    ? data.activePageIndex
    : 0;

  const migratedProject: WhiteboardProject = {
    id,
    title,
    description: data.description,
    subject,
    tags,
    ownerId,
    ownerEmail: data.ownerEmail,
    isFavorite: Boolean(data.isFavorite),
    isTrashed: Boolean(data.isTrashed),
    trashedAt: data.trashedAt,
    sharedWith: Array.isArray(data.sharedWith) ? data.sharedWith : [],
    pages,
    activePageIndex,
    driveFileId: data.driveFileId,
    driveWebViewLink: data.driveWebViewLink,
    driveRevisionId: data.driveRevisionId,
    driveSyncedAt: data.driveSyncedAt,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    thumbnailUrl: data.thumbnailUrl,
    createdAt,
    updatedAt,
    version,
  };

  return migratedProject;
}

/**
 * Migrates individual canvas elements to guarantee all required fields are present.
 */
function migrateElement(el: any): CanvasElement {
  const base = {
    id: el.id || 'elem_' + Math.random().toString(36).substring(2, 9),
    type: el.type,
    x: typeof el.x === 'number' ? el.x : 0,
    y: typeof el.y === 'number' ? el.y : 0,
    rotation: typeof el.rotation === 'number' ? el.rotation : 0,
    opacity: typeof el.opacity === 'number' ? el.opacity : 1,
    stroke: el.stroke || el.strokeColor,
    strokeWidth: el.strokeWidth,
    isLocked: Boolean(el.isLocked),
    createdAt: el.createdAt || Date.now(),
    updatedAt: el.updatedAt || Date.now(),
  };

  switch (el.type) {
    case 'pen':
    case 'highlighter':
      return {
        ...base,
        type: el.type,
        points: Array.isArray(el.points) ? el.points : [],
        color: el.color || '#ffffff',
        size: typeof el.size === 'number' ? el.size : (typeof el.width === 'number' ? el.width : 2),
        tension: el.tension,
        lineCap: el.lineCap || 'round',
        lineJoin: el.lineJoin || 'round',
      };

    case 'shape':
      return {
        ...base,
        type: 'shape',
        shapeType: el.shapeType || 'rectangle',
        width: typeof el.width === 'number' ? el.width : 100,
        height: typeof el.height === 'number' ? el.height : 100,
        fill: el.fill || el.fillColor || 'transparent',
        stroke: el.stroke || el.strokeColor || '#ffffff',
        strokeWidth: el.strokeWidth || 2,
      };

    case 'text':
      return {
        ...base,
        type: 'text',
        text: el.text || '',
        fontSize: el.fontSize || 20,
        fontFamily: el.fontFamily || 'Inter, sans-serif',
        fontColor: el.fontColor || el.color || '#ffffff',
        width: el.width,
      };

    case 'sticky':
      return {
        ...base,
        type: 'sticky',
        text: el.text || '',
        color: el.color || '#fef08a',
        width: el.width || 180,
        height: el.height || 160,
      };

    case 'image':
      return {
        ...base,
        type: 'image',
        src: el.src || '',
        width: el.width || 200,
        height: el.height || 200,
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight,
        alt: el.alt,
      };

    case 'formula':
      return {
        ...base,
        type: 'formula',
        latex: el.latex || '',
        renderedText: el.renderedText || '',
        fontSize: el.fontSize || 22,
        color: el.color || '#ffffff',
        renderedSvg: el.renderedSvg,
        width: el.width || 240,
        height: el.height || 80,
      };

    case 'graph':
      return {
        ...base,
        type: 'graph',
        expression: el.expression || el.functionStr || 'x',
        label: el.label || `f(x) = ${el.expression || el.functionStr || 'x'}`,
        xMin: typeof el.xMin === 'number' ? el.xMin : -10,
        xMax: typeof el.xMax === 'number' ? el.xMax : 10,
        yMin: typeof el.yMin === 'number' ? el.yMin : -10,
        yMax: typeof el.yMax === 'number' ? el.yMax : 10,
        width: el.width || 340,
        height: el.height || 260,
        strokeColor: el.strokeColor || el.stroke || '#a3e635',
        showAxes: el.showAxes !== undefined ? el.showAxes : true,
        showGrid: el.showGrid !== undefined ? el.showGrid : true,
      };

    case 'table':
      return {
        ...base,
        type: 'table',
        rows: el.rows || 3,
        cols: el.cols || 3,
        headers: Array.isArray(el.headers) ? el.headers : ['Column 1', 'Column 2', 'Column 3'],
        data: Array.isArray(el.data) ? el.data : (Array.isArray(el.cells) ? el.cells : [['', '', ''], ['', '', '']]),
        width: el.width || 420,
        height: el.height || 200,
        borderColor: el.borderColor || '#334155',
        headerBg: el.headerBg || '#1e293b',
      };

    case 'flowchart':
      return {
        ...base,
        type: 'flowchart',
        nodeType: el.nodeType || 'process',
        label: el.label || el.text || 'Step',
        width: el.width || 140,
        height: el.height || 70,
        fill: el.fill || '#1e293b',
        stroke: el.stroke || '#a3e635',
        strokeWidth: el.strokeWidth || 2,
      };

    case 'mindmap':
      return {
        ...base,
        type: 'mindmap',
        label: el.label || el.text || 'Concept',
        parentId: el.parentId,
        level: typeof el.level === 'number' ? el.level : 0,
        color: el.color || '#38bdf8',
        width: el.width || 150,
        height: el.height || 50,
      };

    default:
      return el;
  }
}
