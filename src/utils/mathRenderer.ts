import katex from 'katex';

/**
 * Renders a LaTeX mathematical expression to HTML markup via KaTeX.
 */
export function renderLatexToHtml(latex: string, displayMode = true): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch {
    return `<span class="text-rose-400 font-mono">${latex}</span>`;
  }
}

/**
 * Generates an SVG data URL embedding the rendered KaTeX formula for canvas display.
 */
export function renderLatexToSvgDataUrl(latex: string, color = '#ffffff', fontSize = 22): string {
  const html = renderLatexToHtml(latex, true);
  // Estimate dimensions based on length
  const width = Math.max(200, Math.min(800, latex.length * 16));
  const height = 90;

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${color}; font-size: ${fontSize}px; display: flex; align-items: center; justify-content: center; height: 100%;">
          ${html}
        </div>
      </foreignObject>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}
