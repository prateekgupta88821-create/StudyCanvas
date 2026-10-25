import { Point } from '@/types/whiteboard';

/**
 * Calculates Euclidean distance between two points
 */
export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Smoothens raw pointer points into a curve using Catmull-Rom or Bezier interpolation
 */
export function smoothPoints(points: number[]): number[] {
  if (points.length <= 4) return points;
  
  const smoothed: number[] = [points[0], points[1]];
  for (let i = 2; i < points.length - 2; i += 2) {
    const xc = (points[i] + points[i + 2]) / 2;
    const yc = (points[i + 1] + points[i + 3]) / 2;
    smoothed.push(points[i], points[i + 1], xc, yc);
  }
  smoothed.push(points[points.length - 2], points[points.length - 1]);
  return smoothed;
}

/**
 * Computes bounding box for a series of flattened x,y points
 */
export function getBoundingBox(points: number[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = points[0];
  let maxX = points[0];
  let minY = points[1];
  let maxY = points[1];

  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
