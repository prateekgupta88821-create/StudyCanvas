import React from 'react';
import { 
  Group as KonvaGroup, 
  Rect as KonvaRect, 
  Text as KonvaText, 
  Line as KonvaLine,
  Line as KonvaPolygon 
} from 'react-konva';
import { 
  GraphElement, 
  TableElement, 
  FlowchartNodeElement, 
  MindmapNodeElement 
} from '@/types/whiteboard';

/**
 * Evaluates basic math expressions f(x) safely for sampling on canvas.
 */
function evaluateExpression(expr: string, x: number): number {
  try {
    const clean = expr
      .replace(/\^/g, '**')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/exp/g, 'Math.exp')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/abs/g, 'Math.abs')
      .replace(/ln/g, 'Math.log')
      .replace(/pi/gi, 'Math.PI');

    const fn = new Function('x', `return ${clean};`);
    const val = fn(x);
    return isFinite(val) ? val : 0;
  } catch {
    return 0;
  }
}

// 1. Graph Element Component
export const CanvasGraphItem: React.FC<{
  element: GraphElement;
  tool: string;
  onSelect: (e: any) => void;
  onDragEnd: (e: any) => void;
}> = ({ element, tool, onSelect, onDragEnd }) => {
  const { width, height, xMin, xMax, yMin, yMax, expression, label, strokeColor } = element;

  // Sample 60 points across [xMin, xMax]
  const steps = 60;
  const curvePoints: number[] = [];
  const padding = 20;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  for (let i = 0; i <= steps; i++) {
    const xVal = xMin + (i / steps) * (xMax - xMin);
    const yVal = evaluateExpression(expression, xVal);

    // Map xVal from [xMin, xMax] to [padding, padding + plotW]
    const px = padding + ((xVal - xMin) / (xMax - xMin)) * plotW;
    // Map yVal from [yMin, yMax] to [padding + plotH, padding] (inverted y-axis)
    const clampedY = Math.max(yMin, Math.min(yMax, yVal));
    const py = padding + plotH - ((clampedY - yMin) / (yMax - yMin)) * plotH;

    curvePoints.push(px, py);
  }

  // Axes coordinates
  const originX = padding + ((0 - xMin) / (xMax - xMin)) * plotW;
  const originY = padding + plotH - ((0 - yMin) / (yMax - yMin)) * plotH;

  return (
    <KonvaGroup
      id={element.id}
      x={element.x}
      y={element.y}
      draggable={tool === 'select' && !element.isLocked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
    >
      {/* Background Board */}
      <KonvaRect
        width={width}
        height={height}
        fill="#0c1017"
        stroke="#1e293b"
        strokeWidth={1.5}
        cornerRadius={12}
        shadowColor="rgba(0,0,0,0.5)"
        shadowBlur={16}
      />

      {/* Title / Function Label */}
      <KonvaText
        x={padding}
        y={8}
        text={label || `f(x) = ${expression}`}
        fontFamily="JetBrains Mono, monospace"
        fontSize={12}
        fontStyle="bold"
        fill="#a3e635"
      />

      {/* Axis X */}
      <KonvaLine
        points={[padding, originY, padding + plotW, originY]}
        stroke="#475569"
        strokeWidth={1}
      />

      {/* Axis Y */}
      <KonvaLine
        points={[originX, padding, originX, padding + plotH]}
        stroke="#475569"
        strokeWidth={1}
      />

      {/* Function Curve */}
      <KonvaLine
        points={curvePoints}
        stroke={strokeColor || '#a3e635'}
        strokeWidth={2.5}
        tension={0.3}
        lineCap="round"
      />
    </KonvaGroup>
  );
};

// 2. Table Element Component
export const CanvasTableItem: React.FC<{
  element: TableElement;
  tool: string;
  onSelect: (e: any) => void;
  onDragEnd: (e: any) => void;
}> = ({ element, tool, onSelect, onDragEnd }) => {
  const { width, rows, cols, headers, data } = element;
  const colWidth = width / cols;
  const rowHeight = 34;

  return (
    <KonvaGroup
      id={element.id}
      x={element.x}
      y={element.y}
      draggable={tool === 'select' && !element.isLocked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
    >
      {/* Table Outer Border */}
      <KonvaRect
        width={width}
        height={(rows + 1) * rowHeight}
        fill="#0c1017"
        stroke="#334155"
        strokeWidth={1.5}
        cornerRadius={8}
        shadowColor="rgba(0,0,0,0.4)"
        shadowBlur={10}
      />

      {/* Header Row Background */}
      <KonvaRect
        width={width}
        height={rowHeight}
        fill="#1e293b"
        cornerRadius={[8, 8, 0, 0]}
      />

      {/* Headers text */}
      {headers.map((h, c) => (
        <KonvaText
          key={`h_${c}`}
          x={c * colWidth + 8}
          y={10}
          width={colWidth - 16}
          text={h}
          fontFamily="Inter, sans-serif"
          fontSize={12}
          fontStyle="bold"
          fill="#f1f5f9"
          ellipsis={true}
        />
      ))}

      {/* Data Rows */}
      {data.slice(0, rows).map((row, r) => (
        <React.Fragment key={`r_${r}`}>
          <KonvaLine
            points={[0, (r + 1) * rowHeight, width, (r + 1) * rowHeight]}
            stroke="#1e293b"
            strokeWidth={1}
          />
          {row.slice(0, cols).map((cell, c) => (
            <KonvaText
              key={`c_${r}_${c}`}
              x={c * colWidth + 8}
              y={(r + 1) * rowHeight + 10}
              width={colWidth - 16}
              text={cell}
              fontFamily="Inter, sans-serif"
              fontSize={11}
              fill="#94a3b8"
              ellipsis={true}
            />
          ))}
        </React.Fragment>
      ))}

      {/* Vertical Column Separators */}
      {Array.from({ length: cols - 1 }).map((_, c) => (
        <KonvaLine
          key={`v_${c}`}
          points={[(c + 1) * colWidth, 0, (c + 1) * colWidth, (rows + 1) * rowHeight]}
          stroke="#1e293b"
          strokeWidth={1}
        />
      ))}
    </KonvaGroup>
  );
};

// 3. Flowchart Node Component
export const CanvasFlowchartItem: React.FC<{
  element: FlowchartNodeElement;
  tool: string;
  onSelect: (e: any) => void;
  onDragEnd: (e: any) => void;
}> = ({ element, tool, onSelect, onDragEnd }) => {
  const { nodeType, label, width, height, stroke, strokeWidth } = element;

  return (
    <KonvaGroup
      id={element.id}
      x={element.x}
      y={element.y}
      draggable={tool === 'select' && !element.isLocked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
    >
      {/* Node Geometry according to FlowchartNodeType */}
      {nodeType === 'terminator' ? (
        <KonvaRect
          width={width}
          height={height}
          fill="#0c1017"
          stroke={stroke}
          strokeWidth={strokeWidth}
          cornerRadius={height / 2}
        />
      ) : nodeType === 'decision' ? (
        <KonvaPolygon
          points={[
            width / 2, 0,
            width, height / 2,
            width / 2, height,
            0, height / 2,
          ]}
          closed={true}
          fill="#0c1017"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ) : nodeType === 'io' ? (
        <KonvaPolygon
          points={[
            16, 0,
            width, 0,
            width - 16, height,
            0, height,
          ]}
          closed={true}
          fill="#0c1017"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ) : (
        // Standard Process rectangle
        <KonvaRect
          width={width}
          height={height}
          fill="#0c1017"
          stroke={stroke}
          strokeWidth={strokeWidth}
          cornerRadius={8}
        />
      )}

      {/* Centered Node Label */}
      <KonvaText
        x={8}
        y={height / 2 - 8}
        width={width - 16}
        text={label}
        align="center"
        fontFamily="Inter, sans-serif"
        fontSize={12}
        fontStyle="bold"
        fill="#f8fafc"
        ellipsis={true}
      />
    </KonvaGroup>
  );
};

// 4. Mindmap Node Component
export const CanvasMindmapItem: React.FC<{
  element: MindmapNodeElement;
  tool: string;
  onSelect: (e: any) => void;
  onDragEnd: (e: any) => void;
}> = ({ element, tool, onSelect, onDragEnd }) => {
  const { label, color, width, height, level } = element;
  const isRoot = level === 0;

  return (
    <KonvaGroup
      id={element.id}
      x={element.x}
      y={element.y}
      draggable={tool === 'select' && !element.isLocked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
    >
      <KonvaRect
        width={width}
        height={height}
        fill={isRoot ? '#12161f' : '#0c1017'}
        stroke={color || '#a3e635'}
        strokeWidth={isRoot ? 2.5 : 1.5}
        cornerRadius={20}
        shadowColor="rgba(0,0,0,0.5)"
        shadowBlur={isRoot ? 16 : 8}
      />
      <KonvaText
        x={10}
        y={height / 2 - 7}
        width={width - 20}
        text={label}
        align="center"
        fontFamily="Inter, sans-serif"
        fontSize={isRoot ? 13 : 11}
        fontStyle={isRoot ? 'bold' : 'normal'}
        fill="#f8fafc"
        ellipsis={true}
      />
    </KonvaGroup>
  );
};
