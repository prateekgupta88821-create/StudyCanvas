import { describe, it, expect } from 'vitest';
import { 
  CanvasElement, 
  StrokeElement, 
  ShapeElement, 
  TextElement, 
  StickyElement, 
  ImageElement,
  GraphElement,
  TableElement,
  FlowchartNodeElement,
  MindmapNodeElement,
  FormulaElement,
  Page,
  WhiteboardProject
} from '@/types/whiteboard';
import { migrateProject, CURRENT_SCHEMA_VERSION } from '@/services/schemaMigration';
import { exportPageToSvg } from '@/services/pdfService';
import { renderLatexToHtml, renderLatexToSvgDataUrl } from '@/utils/mathRenderer';

describe('StudyCanvas Core Whiteboard System', () => {
  // Coordinate transformations
  describe('World Coordinate System & Canvas Transformations', () => {
    it('correctly converts screen coordinates to world coordinates under scale and pan', () => {
      const stagePos = { x: 100, y: 50 };
      const scale = 1.5;

      const screenPoint = { x: 400, y: 350 };
      const worldX = (screenPoint.x - stagePos.x) / scale;
      const worldY = (screenPoint.y - stagePos.y) / scale;

      expect(worldX).toBe(200);
      expect(worldY).toBe(200);
    });

    it('correctly converts world coordinates back to screen coordinates', () => {
      const stagePos = { x: -200, y: -100 };
      const scale = 2.0;

      const worldPoint = { x: 500, y: 300 };
      const screenX = worldPoint.x * scale + stagePos.x;
      const screenY = worldPoint.y * scale + stagePos.y;

      expect(screenX).toBe(800);
      expect(screenY).toBe(500);
    });

    it('calculates pointer-centered zoom correctly so the point under cursor remains fixed', () => {
      const stagePos = { x: 100, y: 100 };
      const oldScale = 1.0;
      const newScale = 2.0;
      const pointer = { x: 300, y: 300 };

      // Point in world coordinates before zoom
      const mouseWorld = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      // New stage position keeping world coordinate under pointer fixed
      const newStagePos = {
        x: pointer.x - mouseWorld.x * newScale,
        y: pointer.y - mouseWorld.y * newScale,
      };

      expect(mouseWorld).toEqual({ x: 200, y: 200 });
      expect(newStagePos).toEqual({ x: -100, y: -100 });

      // Verifying that under new scale and stagePos, pointer projects to the same world point
      const worldAfter = {
        x: (pointer.x - newStagePos.x) / newScale,
        y: (pointer.y - newStagePos.y) / newScale,
      };
      expect(worldAfter).toEqual(mouseWorld);
    });

    it('clamps zoom scales within sensible bounds (0.2x to 4.0x)', () => {
      const clampZoom = (val: number) => Math.min(Math.max(0.2, val), 4.0);

      expect(clampZoom(0.05)).toBe(0.2);
      expect(clampZoom(5.5)).toBe(4.0);
      expect(clampZoom(1.25)).toBe(1.25);
    });
  });

  // Document Model & Elements
  describe('Document Model & Canvas Elements', () => {
    it('creates and validates a freehand stroke element with opacity and width', () => {
      const stroke: StrokeElement = {
        id: 'stroke_1',
        type: 'pen',
        x: 0,
        y: 0,
        points: [10, 10, 25, 30, 45, 60],
        color: '#a3e635',
        size: 4,
        opacity: 0.9,
        createdAt: 1000,
        updatedAt: 1000,
      };

      expect(stroke.type).toBe('pen');
      expect(stroke.points).toHaveLength(6);
      expect(stroke.color).toBe('#a3e635');
      expect(stroke.size).toBe(4);
    });

    it('creates highlighter stroke with transparent alpha blending', () => {
      const highlighter: StrokeElement = {
        id: 'highlighter_1',
        type: 'highlighter',
        x: 0,
        y: 0,
        points: [0, 50, 100, 50],
        color: '#fef08a',
        size: 24,
        opacity: 0.35,
        createdAt: 1000,
        updatedAt: 1000,
      };

      expect(highlighter.type).toBe('highlighter');
      expect(highlighter.opacity).toBeLessThan(0.5);
      expect(highlighter.size).toBeGreaterThanOrEqual(20);
    });

    it('creates geometric shapes including rectangle, circle, and ellipse', () => {
      const rect: ShapeElement = {
        id: 'rect_1',
        type: 'shape',
        shapeType: 'rectangle',
        x: 50,
        y: 60,
        width: 200,
        height: 120,
        stroke: '#38bdf8',
        strokeWidth: 2,
        fill: 'transparent',
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
      };

      const ellipse: ShapeElement = {
        id: 'ellipse_1',
        type: 'shape',
        shapeType: 'ellipse',
        x: 150,
        y: 180,
        width: 160,
        height: 90,
        stroke: '#a855f7',
        strokeWidth: 3,
        fill: '#a855f7',
        opacity: 0.8,
        createdAt: 1000,
        updatedAt: 1000,
      };

      expect(rect.shapeType).toBe('rectangle');
      expect(ellipse.shapeType).toBe('ellipse');
      expect(ellipse.width).toBe(160);
      expect(ellipse.height).toBe(90);
    });

    it('creates text elements with custom typography and dimensions', () => {
      const textElem: TextElement = {
        id: 'text_1',
        type: 'text',
        text: 'Stokes Theorem:\n∮ F · dr = ∬ (∇ × F) · dS',
        x: 100,
        y: 150,
        fontSize: 24,
        fontFamily: 'Inter, sans-serif',
        fontColor: '#ffffff',
        width: 320,
        createdAt: 1000,
        updatedAt: 1000,
      };

      expect(textElem.type).toBe('text');
      expect(textElem.fontSize).toBe(24);
      expect(textElem.text).toContain('Stokes Theorem');
    });

    it('creates sticky note with custom pastel color and markdown/text content', () => {
      const sticky: StickyElement = {
        id: 'sticky_1',
        type: 'sticky',
        text: 'Exam Prep: Review boundary orientations',
        x: 400,
        y: 200,
        width: 220,
        height: 180,
        color: '#fef08a',
        createdAt: 1000,
        updatedAt: 1000,
      };

      expect(sticky.type).toBe('sticky');
      expect(sticky.color).toBe('#fef08a');
      expect(sticky.width).toBe(220);
    });

    it('creates image elements with natural dimensions and scale ratio', () => {
      const image: ImageElement = {
        id: 'img_1',
        type: 'image',
        src: 'data:image/png;base64,mockImageData',
        x: 250,
        y: 300,
        width: 300,
        height: 200,
        naturalWidth: 1200,
        naturalHeight: 800,
        rotation: 0,
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
      };

      expect(image.type).toBe('image');
      expect((image.naturalWidth ?? 1200) / (image.naturalHeight ?? 800)).toBe(image.width / image.height);
    });
  });

  // Hit Detection & Selection
  describe('Hit Detection & Marquee Selection', () => {
    const mockElements: CanvasElement[] = [
      {
        id: 'shape_1',
        type: 'shape',
        shapeType: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        stroke: '#fff',
        strokeWidth: 2,
        fill: 'transparent',
        opacity: 1,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'sticky_1',
        type: 'sticky',
        x: 300,
        y: 300,
        width: 100,
        height: 100,
        text: 'Note',
        color: '#fef08a',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'shape_2',
        type: 'shape',
        shapeType: 'circle',
        x: 700,
        y: 700,
        width: 100,
        height: 100,
        stroke: '#fff',
        strokeWidth: 2,
        fill: 'transparent',
        opacity: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ];

    it('detects elements enclosed within or intersecting a selection box', () => {
      // Box covering shape_1 (100..200, 100..200) only
      const selectionBox = { x: 50, y: 50, width: 180, height: 180 };

      // Helper function matching stage marquee hit detection
      const hitTest = (box: { x: number; y: number; width: number; height: number }, el: CanvasElement) => {
        if ('x' in el && 'y' in el && 'width' in el && 'height' in el) {
          const elX = el.x as number;
          const elY = el.y as number;
          const elW = el.width as number;
          const elH = el.height as number;

          return !(
            elX > box.x + box.width ||
            elX + elW < box.x ||
            elY > box.y + box.height ||
            elY + elH < box.y
          );
        }
        return false;
      };

      const selected = mockElements.filter((el) => hitTest(selectionBox, el));
      expect(selected.map((s) => s.id)).toEqual(['shape_1']);
    });

    it('selects multiple elements when marquee encompasses them', () => {
      // Wide box covering shape_1 (100) and sticky_1 (300), but not shape_2 (700)
      const wideBox = { x: 50, y: 50, width: 400, height: 400 };
      const hitTest = (box: { x: number; y: number; width: number; height: number }, el: CanvasElement) => {
        if ('x' in el && 'y' in el && 'width' in el && 'height' in el) {
          const elX = el.x as number;
          const elY = el.y as number;
          const elW = el.width as number;
          const elH = el.height as number;

          return !(
            elX > box.x + box.width ||
            elX + elW < box.x ||
            elY > box.y + box.height ||
            elY + elH < box.y
          );
        }
        return false;
      };

      const selected = mockElements.filter((el) => hitTest(wideBox, el));
      expect(selected.map((s) => s.id)).toContain('shape_1');
      expect(selected.map((s) => s.id)).toContain('sticky_1');
      expect(selected.map((s) => s.id)).not.toContain('shape_2');
    });
  });

  // Multi-step History (Undo / Redo)
  describe('History System (Undo / Redo)', () => {
    it('manages undo and redo stacks without data loss', () => {
      let elements: CanvasElement[] = [];
      const undoStack: CanvasElement[][] = [];
      const redoStack: CanvasElement[][] = [];

      const commit = (newElements: CanvasElement[]) => {
        undoStack.push(elements);
        redoStack.length = 0; // clear redo on new action
        elements = newElements;
      };

      const undo = () => {
        if (undoStack.length === 0) return;
        const prev = undoStack.pop()!;
        redoStack.push(elements);
        elements = prev;
      };

      const redo = () => {
        if (redoStack.length === 0) return;
        const next = redoStack.pop()!;
        undoStack.push(elements);
        elements = next;
      };

      // 1. Initial state
      expect(elements).toHaveLength(0);

      // 2. Add stroke
      const stroke1: StrokeElement = {
        id: 's1',
        type: 'pen',
        x: 0,
        y: 0,
        points: [0, 0, 10, 10],
        color: '#fff',
        size: 2,
        opacity: 1,
        createdAt: 1,
        updatedAt: 1,
      };
      commit([stroke1]);
      expect(elements).toHaveLength(1);
      expect(undoStack).toHaveLength(1);
      expect(redoStack).toHaveLength(0);

      // 3. Add shape
      const shape1: ShapeElement = {
        id: 'r1',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 20,
        width: 100,
        height: 50,
        stroke: '#38bdf8',
        strokeWidth: 2,
        fill: 'transparent',
        opacity: 1,
        createdAt: 2,
        updatedAt: 2,
      };
      commit([stroke1, shape1]);
      expect(elements).toHaveLength(2);

      // 4. Undo back to single element
      undo();
      expect(elements).toHaveLength(1);
      expect(elements[0].id).toBe('s1');
      expect(redoStack).toHaveLength(1);

      // 5. Undo to empty
      undo();
      expect(elements).toHaveLength(0);
      expect(redoStack).toHaveLength(2);

      // 6. Redo forward
      redo();
      expect(elements).toHaveLength(1);
      redo();
      expect(elements).toHaveLength(2);
      expect(elements[1].id).toBe('r1');
    });
  });

  // Clipboard & Object Operations (Duplicate, Copy, Paste, Delete)
  describe('Clipboard & Object Manipulation', () => {
    it('duplicates selected elements with position offset and unique IDs', () => {
      const original: ShapeElement = {
        id: 'orig_rect',
        type: 'shape',
        shapeType: 'rectangle',
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        stroke: '#a3e635',
        strokeWidth: 2,
        fill: 'transparent',
        opacity: 1,
        createdAt: 1000,
        updatedAt: 1000,
      };

      const duplicate = (el: CanvasElement, offset = 30): CanvasElement => {
        const newId = 'shape_' + Math.random().toString(36).substring(2, 9);
        return {
          ...el,
          id: newId,
          x: el.x + offset,
          y: el.y + offset,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      };

      const dup = duplicate(original) as ShapeElement;
      expect(dup.id).not.toBe(original.id);
      expect(dup.x).toBe(130);
      expect(dup.y).toBe(130);
      expect(dup.width).toBe(original.width);
      expect(dup.stroke).toBe(original.stroke);
    });

    it('copies and pastes elements with relative offset', () => {
      let clipboard: CanvasElement[] = [];

      const copy = (selected: CanvasElement[]) => {
        clipboard = JSON.parse(JSON.stringify(selected));
      };

      const paste = (offset = 25): CanvasElement[] => {
        return clipboard.map((item) => {
          const newId = 'pasted_' + Math.random().toString(36).substring(2, 9);
          return {
            ...item,
            id: newId,
            x: item.x + offset,
            y: item.y + offset,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        });
      };

      const text: TextElement = {
        id: 't1',
        type: 'text',
        text: 'Integration by Parts',
        x: 200,
        y: 200,
        fontSize: 18,
        fontFamily: 'Inter',
        fontColor: '#ffffff',
        createdAt: 1,
        updatedAt: 1,
      };

      copy([text]);
      expect(clipboard).toHaveLength(1);

      const pasted = paste();
      expect(pasted).toHaveLength(1);
      expect(pasted[0].id).not.toBe(text.id);
      expect((pasted[0] as TextElement).text).toBe('Integration by Parts');
      expect((pasted[0] as TextElement).x).toBe(225);
      expect((pasted[0] as TextElement).y).toBe(225);
    });

    it('deletes selected elements without affecting unrelated objects', () => {
      const allElements: CanvasElement[] = [
        { id: '1', type: 'pen', x: 0, y: 0, points: [0, 0], color: '#fff', size: 2, opacity: 1, createdAt: 1, updatedAt: 1 },
        { id: '2', type: 'sticky', x: 0, y: 0, width: 100, height: 100, text: 'Keep me', color: '#fef08a', createdAt: 1, updatedAt: 1 },
        { id: '3', type: 'shape', shapeType: 'circle', x: 50, y: 50, width: 50, height: 50, stroke: '#fff', strokeWidth: 1, fill: 'transparent', opacity: 1, createdAt: 1, updatedAt: 1 },
      ];

      const toDelete = ['1', '3'];
      const remaining = allElements.filter((el) => !toDelete.includes(el.id));

      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('2');
      expect((remaining[0] as StickyElement).text).toBe('Keep me');
    });
  });

  // Eraser Behavior (Stroke vs Object)
  describe('Eraser Behavior', () => {
    it('erases object completely in object eraser mode', () => {
      const elements: CanvasElement[] = [
        { id: 'shape1', type: 'shape', shapeType: 'rectangle', x: 10, y: 10, width: 40, height: 40, stroke: '#fff', strokeWidth: 1, fill: 'transparent', opacity: 1, createdAt: 1, updatedAt: 1 },
        { id: 'shape2', type: 'shape', shapeType: 'rectangle', x: 200, y: 200, width: 40, height: 40, stroke: '#fff', strokeWidth: 1, fill: 'transparent', opacity: 1, createdAt: 1, updatedAt: 1 },
      ];

      const eraserRadius = 15;
      const eraserPos = { x: 25, y: 25 }; // Hits shape1

      const objectEraserHit = (el: CanvasElement) => {
        if ('x' in el && 'y' in el && 'width' in el && 'height' in el) {
          const elX = el.x as number;
          const elY = el.y as number;
          const elW = el.width as number;
          const elH = el.height as number;

          const closestX = Math.max(elX, Math.min(eraserPos.x, elX + elW));
          const closestY = Math.max(elY, Math.min(eraserPos.y, elY + elH));
          const distSq = (eraserPos.x - closestX) ** 2 + (eraserPos.y - closestY) ** 2;
          return distSq <= eraserRadius ** 2;
        }
        return false;
      };

      const remaining = elements.filter((el) => !objectEraserHit(el));
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('shape2');
    });

    it('erases freehand stroke segments upon intersection', () => {
      const stroke: StrokeElement = {
        id: 'stroke_test',
        type: 'pen',
        x: 0,
        y: 0,
        points: [0, 0, 50, 50, 100, 100],
        color: '#fff',
        size: 4,
        opacity: 1,
        createdAt: 1,
        updatedAt: 1,
      };

      const eraserPos = { x: 50, y: 50 };
      const eraserRadius = 10;

      // Stroke hit test
      let hit = false;
      for (let i = 0; i < stroke.points.length; i += 2) {
        const px = stroke.points[i];
        const py = stroke.points[i + 1];
        const dist = Math.hypot(px - eraserPos.x, py - eraserPos.y);
        if (dist <= eraserRadius) {
          hit = true;
          break;
        }
      }

      expect(hit).toBe(true);
    });
  });

  // Page Management
  describe('Page Management', () => {
    it('manages multiple whiteboard pages and switches active slide', () => {
      const project: WhiteboardProject = {
        id: 'proj_1',
        title: 'Linear Algebra',
        subject: 'Mathematics',
        tags: ['matrices', 'vectors'],
        ownerId: 'prof_1',
        pages: [
          { id: 'p1', title: 'Page 1', elements: [], gridType: 'dots', backgroundColor: '#090b0e' },
          { id: 'p2', title: 'Page 2', elements: [], gridType: 'grid', backgroundColor: '#090b0e' },
        ],
        activePageIndex: 0,
        createdAt: 1000,
        updatedAt: 1000,
        version: 1,
      };

      expect(project.pages).toHaveLength(2);
      expect(project.activePageIndex).toBe(0);

      // Add page
      const newPage: Page = {
        id: 'p3',
        title: 'Page 3',
        elements: [],
        gridType: 'ruled',
        backgroundColor: '#090b0e',
      };
      project.pages.push(newPage);
      project.activePageIndex = project.pages.length - 1;

      expect(project.pages).toHaveLength(3);
      expect(project.activePageIndex).toBe(2);
      expect(project.pages[project.activePageIndex].title).toBe('Page 3');
    });

    it('duplicates a page and deep-clones all elements with fresh IDs', () => {
      const pageToDuplicate: Page = {
        id: 'orig_page',
        title: 'Original Lesson',
        gridType: 'coordinate',
        backgroundColor: '#090b0e',
        elements: [
          {
            id: 'orig_stroke',
            type: 'pen',
            x: 0,
            y: 0,
            points: [10, 10, 20, 20],
            color: '#a3e635',
            size: 2,
            opacity: 1,
            createdAt: 100,
            updatedAt: 100,
          },
          {
            id: 'orig_text',
            type: 'text',
            text: 'Newton Second Law',
            x: 50,
            y: 50,
            fontSize: 18,
            fontFamily: 'Inter',
            fontColor: '#ffffff',
            createdAt: 100,
            updatedAt: 100,
          },
        ],
      };

      const duplicatedPage: Page = {
        ...pageToDuplicate,
        id: 'page_dup_' + Math.random().toString(36).substring(2, 7),
        title: `${pageToDuplicate.title} (Copy)`,
        elements: pageToDuplicate.elements.map((el) => ({
          ...el,
          id: el.id + '_copy_' + Math.random().toString(36).substring(2, 6),
        })),
      };

      expect(duplicatedPage.id).not.toBe(pageToDuplicate.id);
      expect(duplicatedPage.title).toBe('Original Lesson (Copy)');
      expect(duplicatedPage.gridType).toBe('coordinate');
      expect(duplicatedPage.elements).toHaveLength(2);
      expect(duplicatedPage.elements[0].id).not.toBe(pageToDuplicate.elements[0].id);
      expect((duplicatedPage.elements[1] as TextElement).text).toBe('Newton Second Law');
    });

    it('reorders pages sequentially without data loss', () => {
      const pages: Page[] = [
        { id: 'slide_1', title: 'Slide 1', elements: [], gridType: 'dots', backgroundColor: '#090b0e' },
        { id: 'slide_2', title: 'Slide 2', elements: [], gridType: 'grid', backgroundColor: '#090b0e' },
        { id: 'slide_3', title: 'Slide 3', elements: [], gridType: 'blank', backgroundColor: '#090b0e' },
      ];

      // Move slide 3 to index 1 (between slide 1 and slide 2)
      const fromIndex = 2;
      const toIndex = 1;
      const reordered = [...pages];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      expect(reordered.map((p) => p.id)).toEqual(['slide_1', 'slide_3', 'slide_2']);
    });

    it('renames a page cleanly', () => {
      const page: Page = {
        id: 'p_rename',
        title: 'Draft',
        elements: [],
        gridType: 'dots',
        backgroundColor: '#090b0e',
      };

      const updatedPage = { ...page, title: 'Calculus IV: Multivariable Integrals' };
      expect(updatedPage.title).toBe('Calculus IV: Multivariable Integrals');
    });
  });

  // Versioned Project Schema & Migration
  describe('Document Schema & Migration System', () => {
    it('migrates legacy V1 project without schemaVersion to V2 schema with current version tag', () => {
      const legacyProject = {
        id: 'legacy_123',
        title: 'Legacy Physics Notes',
        ownerId: 'user_xyz',
        pages: [
          {
            id: 'legacy_page_1',
            title: 'Intro',
            // Missing gridType and elements
          },
        ],
      };

      const migrated = migrateProject(legacyProject);

      expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(migrated.id).toBe('legacy_123');
      expect(migrated.title).toBe('Legacy Physics Notes');
      expect(migrated.pages).toHaveLength(1);
      expect(migrated.pages[0].gridType).toBe('dots'); // Default fallback
      expect(migrated.pages[0].elements).toEqual([]);
      expect(migrated.activePageIndex).toBe(0);
    });

    it('normalizes missing fields in canvas elements during migration', () => {
      const projectWithIncompleteElements = {
        id: 'proj_incomplete',
        title: 'Incomplete Test',
        pages: [
          {
            id: 'p1',
            title: 'Page 1',
            gridType: 'coordinate',
            elements: [
              {
                id: 'el_stroke',
                type: 'pen',
                points: [0, 0, 10, 10],
                // Missing size, color, opacity
              },
              {
                id: 'el_shape',
                type: 'shape',
                shapeType: 'rectangle',
                x: 10,
                y: 20,
                // Missing width, height, stroke
              },
            ],
          },
        ],
      };

      const migrated = migrateProject(projectWithIncompleteElements);
      const elements = migrated.pages[0].elements;

      const stroke = elements[0] as StrokeElement;
      expect(stroke.size).toBe(2);
      expect(stroke.color).toBe('#ffffff');
      expect(stroke.opacity).toBe(1);

      const shape = elements[1] as ShapeElement;
      expect(shape.width).toBe(100);
      expect(shape.height).toBe(100);
      expect(shape.stroke).toBe('#ffffff');
    });

    it('preserves coordinate grid type and educational elements during migration', () => {
      const educationalProject = {
        schemaVersion: '2.0.0',
        id: 'edu_1',
        title: 'Coordinate Geometry',
        pages: [
          {
            id: 'page_coord',
            title: 'Parabolas',
            gridType: 'coordinate',
            elements: [
              {
                id: 'graph_1',
                type: 'graph',
                functionStr: 'x^2 - 4',
                xMin: -5,
                xMax: 5,
                yMin: -5,
                yMax: 5,
                x: 100,
                y: 100,
                width: 320,
                height: 240,
                stroke: '#38bdf8',
                strokeWidth: 2,
              },
            ],
          },
        ],
      };

      const migrated = migrateProject(educationalProject);
      expect(migrated.pages[0].gridType).toBe('coordinate');
      expect(migrated.pages[0].elements[0].type).toBe('graph');
      expect((migrated.pages[0].elements[0] as GraphElement).expression).toBe('x^2 - 4');
    });
  });

  // Educational Features
  describe('Educational Features & Components', () => {
    describe('2D Function Graph Plotter', () => {
      it('creates and validates a GraphElement', () => {
        const graph: GraphElement = {
          id: 'graph_elem_1',
          type: 'graph',
          expression: 'sin(x)',
          label: 'f(x) = sin(x)',
          xMin: -6.28,
          xMax: 6.28,
          yMin: -1.5,
          yMax: 1.5,
          x: 150,
          y: 200,
          width: 360,
          height: 240,
          strokeColor: '#38bdf8',
          createdAt: 1000,
          updatedAt: 1000,
        };

        expect(graph.type).toBe('graph');
        expect(graph.expression).toBe('sin(x)');
        expect(graph.xMin).toBeCloseTo(-6.28, 2);
        expect(graph.xMax).toBeCloseTo(6.28, 2);
      });

      it('evaluates math expression points across domain and maps to pixel coordinates', () => {
        // Mathematical curve: y = x^2, domain [-2, 2], range [0, 4]
        const xMin = -2;
        const xMax = 2;
        const yMin = 0;
        const yMax = 4;
        const width = 200;
        const height = 100;

        const fn = (x: number) => x * x;
        const samples = 5; // x = -2, -1, 0, 1, 2
        const points: { x: number; y: number }[] = [];

        for (let i = 0; i < samples; i++) {
          const xVal = xMin + (i / (samples - 1)) * (xMax - xMin);
          const yVal = fn(xVal);

          // Map world math coordinates to pixel canvas:
          const px = ((xVal - xMin) / (xMax - xMin)) * width;
          const py = height - ((yVal - yMin) / (yMax - yMin)) * height;
          points.push({ x: px, y: py });
        }

        // At x = -2, px = 0, y = 4 -> py = 0 (top of graph box)
        expect(points[0].x).toBe(0);
        expect(points[0].y).toBe(0);

        // At x = 0, px = 100, y = 0 -> py = 100 (bottom of graph box)
        expect(points[2].x).toBe(100);
        expect(points[2].y).toBe(100);

        // At x = 2, px = 200, y = 4 -> py = 0 (top of graph box)
        expect(points[4].x).toBe(200);
        expect(points[4].y).toBe(0);
      });
    });

    describe('Flowchart Builder', () => {
      it('creates flowchart process, decision, and terminator nodes', () => {
        const processNode: FlowchartNodeElement = {
          id: 'fc_process',
          type: 'flowchart',
          nodeType: 'process',
          label: 'Compute Sum:\nsum = a + b',
          x: 100,
          y: 100,
          width: 160,
          height: 60,
          stroke: '#a3e635',
          strokeWidth: 2,
          fill: '#121721',
          createdAt: 1000,
          updatedAt: 1000,
        };

        const decisionNode: FlowchartNodeElement = {
          id: 'fc_decision',
          type: 'flowchart',
          nodeType: 'decision',
          label: 'Is sum > 100?',
          x: 100,
          y: 200,
          width: 140,
          height: 80,
          stroke: '#fbbf24',
          strokeWidth: 2,
          fill: '#1f1a10',
          createdAt: 1000,
          updatedAt: 1000,
        };

        const terminatorNode: FlowchartNodeElement = {
          id: 'fc_terminator',
          type: 'flowchart',
          nodeType: 'terminator',
          label: 'End Algorithm',
          x: 100,
          y: 320,
          width: 140,
          height: 50,
          stroke: '#f43f5e',
          strokeWidth: 2,
          fill: '#241015',
          createdAt: 1000,
          updatedAt: 1000,
        };

        expect(processNode.nodeType).toBe('process');
        expect(decisionNode.nodeType).toBe('decision');
        expect(terminatorNode.nodeType).toBe('terminator');
      });
    });

    describe('Mind Map Creator', () => {
      it('creates hierarchical mind map nodes with branch colors and parent links', () => {
        const rootNode: MindmapNodeElement = {
          id: 'mm_root',
          type: 'mindmap',
          label: 'Newtonian Mechanics',
          x: 300,
          y: 300,
          width: 180,
          height: 60,
          color: '#a3e635',
          level: 0,
          isRoot: true,
          createdAt: 1000,
          updatedAt: 1000,
        };

        const branch1: MindmapNodeElement = {
          id: 'mm_branch_1',
          type: 'mindmap',
          label: 'Kinematics',
          x: 120,
          y: 200,
          width: 130,
          height: 44,
          color: '#38bdf8',
          level: 1,
          parentId: 'mm_root',
          createdAt: 1000,
          updatedAt: 1000,
        };

        const branch2: MindmapNodeElement = {
          id: 'mm_branch_2',
          type: 'mindmap',
          label: 'Energy & Work',
          x: 480,
          y: 200,
          width: 130,
          height: 44,
          color: '#fbbf24',
          level: 1,
          parentId: 'mm_root',
          createdAt: 1000,
          updatedAt: 1000,
        };

        expect(rootNode.isRoot).toBe(true);
        expect(branch1.parentId).toBe('mm_root');
        expect(branch2.parentId).toBe('mm_root');
        expect(branch1.color).toBe('#38bdf8');
      });
    });

    describe('Lecture Notes & Comparison Tables', () => {
      it('creates and structures a comparison table element', () => {
        const table: TableElement = {
          id: 'tbl_1',
          type: 'table',
          rows: 3,
          cols: 2,
          headers: ['Feature', 'Description'],
          data: [
            ['Mitosis', 'Somatic cell division yielding 2 identical diploids'],
            ['Meiosis', 'Germ cell division yielding 4 diverse haploids'],
          ],
          x: 80,
          y: 120,
          width: 440,
          height: 180,
          createdAt: 1000,
          updatedAt: 1000,
        };

        expect(table.type).toBe('table');
        expect(table.rows).toBe(3);
        expect(table.cols).toBe(2);
        expect(table.headers).toHaveLength(2);
        expect(table.data[0][0]).toBe('Mitosis');
        expect(table.data[1][0]).toBe('Meiosis');
      });
    });

    describe('Mathematical Equation KaTeX Rendering', () => {
      it('renders LaTeX formulas to HTML strings correctly', () => {
        const latex = '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}';
        const html = renderLatexToHtml(latex);

        expect(html).toContain('katex');
        expect(html).toContain('katex-html');
      });

      it('generates an SVG data URL for a valid LaTeX formula', () => {
        const latex = 'E = mc^2';
        const dataUrl = renderLatexToSvgDataUrl(latex);

        expect(dataUrl).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
        expect(decodeURIComponent(dataUrl)).toContain('<svg');
        expect(decodeURIComponent(dataUrl)).toContain('foreignObject');
      });
    });

    describe('Selection Context Menu & Element Locking', () => {
      it('flags elements as locked to prevent unintentional dragging or edits', () => {
        const shape: ShapeElement = {
          id: 'locked_shape',
          type: 'shape',
          shapeType: 'rectangle',
          x: 100,
          y: 100,
          width: 150,
          height: 80,
          stroke: '#ffffff',
          strokeWidth: 2,
          fill: 'transparent',
          isLocked: true,
          createdAt: 1000,
          updatedAt: 1000,
        };

        expect(shape.isLocked).toBe(true);
      });

      it('reorders elements by bringing to front or sending to back', () => {
        const elements: CanvasElement[] = [
          { id: '1', type: 'text', text: 'Bottom', x: 0, y: 0, fontSize: 14, fontFamily: 'Inter', fontColor: '#fff', createdAt: 1, updatedAt: 1 },
          { id: '2', type: 'text', text: 'Middle', x: 0, y: 0, fontSize: 14, fontFamily: 'Inter', fontColor: '#fff', createdAt: 1, updatedAt: 1 },
          { id: '3', type: 'text', text: 'Top', x: 0, y: 0, fontSize: 14, fontFamily: 'Inter', fontColor: '#fff', createdAt: 1, updatedAt: 1 },
        ];

        // Bring element '1' to front
        const bringToFront = (id: string, list: CanvasElement[]) => {
          const idx = list.findIndex((el) => el.id === id);
          if (idx < 0) return list;
          const copy = [...list];
          const [item] = copy.splice(idx, 1);
          copy.push(item);
          return copy;
        };

        const afterBring = bringToFront('1', elements);
        expect(afterBring.map((el) => el.id)).toEqual(['2', '3', '1']);

        // Send element '3' to back
        const sendToBack = (id: string, list: CanvasElement[]) => {
          const idx = list.findIndex((el) => el.id === id);
          if (idx < 0) return list;
          const copy = [...list];
          const [item] = copy.splice(idx, 1);
          copy.unshift(item);
          return copy;
        };

        const afterSend = sendToBack('3', afterBring);
        expect(afterSend.map((el) => el.id)).toEqual(['3', '2', '1']);
      });
    });

    describe('Vector SVG Export Fidelity', () => {
      it('generates well-formed SVG markup for a page with strokes, shapes, and text', () => {
        const page: Page = {
          id: 'svg_page_1',
          title: 'Physics Vectors',
          gridType: 'coordinate',
          backgroundColor: '#0c1017',
          elements: [
            {
              id: 'rect_svg',
              type: 'shape',
              shapeType: 'rectangle',
              x: 50,
              y: 50,
              width: 120,
              height: 80,
              stroke: '#a3e635',
              strokeWidth: 2,
              fill: 'none',
              createdAt: 1,
              updatedAt: 1,
            },
            {
              id: 'text_svg',
              type: 'text',
              text: 'Displacement Vector',
              x: 60,
              y: 150,
              fontSize: 16,
              fontFamily: 'Inter',
              fontColor: '#ffffff',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        };

        const svgMarkup = exportPageToSvg(page);

        expect(svgMarkup).toContain('<svg');
        expect(svgMarkup).toContain('</svg>');
        expect(svgMarkup).toContain('<rect');
        expect(svgMarkup).toContain('stroke="#a3e635"');
        expect(svgMarkup).toContain('<text');
        expect(svgMarkup).toContain('Displacement Vector');
      });
    });
  });
});
