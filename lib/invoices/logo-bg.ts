/** Make near-uniform corner color transparent. Typical for logos on a white plate. */

function pixelAt(data: Uint8ClampedArray, width: number, x: number, y: number): [number, number, number, number] {
  const index = (y * width + x) * 4;
  return [data[index]!, data[index + 1]!, data[index + 2]!, data[index + 3]!];
}

export function cornerBackgroundColor(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): { r: number; g: number; b: number } | null {
  if (width < 4 || height < 4) {
    return null;
  }
  const samples = [
    pixelAt(data, width, 1, 1),
    pixelAt(data, width, width - 2, 1),
    pixelAt(data, width, 1, height - 2),
    pixelAt(data, width, width - 2, height - 2),
  ];
  const r = samples.reduce((sum, pixel) => sum + pixel[0], 0) / samples.length;
  const g = samples.reduce((sum, pixel) => sum + pixel[1], 0) / samples.length;
  const b = samples.reduce((sum, pixel) => sum + pixel[2], 0) / samples.length;
  const spread = samples.reduce((max, pixel) => {
    const dist = Math.abs(pixel[0] - r) + Math.abs(pixel[1] - g) + Math.abs(pixel[2] - b);
    return Math.max(max, dist);
  }, 0);
  if (spread > 90) {
    return null;
  }
  return { r, g, b };
}

function similarTo(data: Uint8ClampedArray, index: number, bg: { r: number; g: number; b: number }, tolerance: number): boolean {
  const dr = data[index]! - bg.r;
  const dg = data[index + 1]! - bg.g;
  const db = data[index + 2]! - bg.b;
  return Math.abs(dr) + Math.abs(dg) + Math.abs(db) <= tolerance * 3;
}

export function knockoutCornerBackground(data: Uint8ClampedArray, width: number, height: number, tolerance = 36): boolean {
  const bg = cornerBackgroundColor(data, width, height);
  if (!bg) {
    return false;
  }
  for (let index = 0; index < data.length; index += 4) {
    if (similarTo(data, index, bg, tolerance)) {
      data[index + 3] = 0;
    }
  }
  return true;
}

/** Clear background that touches the corners without punching holes in matching colors inside the mark. */
export function floodClearBackground(data: Uint8ClampedArray, width: number, height: number, tolerance = 32): boolean {
  const bg = cornerBackgroundColor(data, width, height);
  if (!bg) {
    return false;
  }
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];
  const seeds = [0, width - 1, (height - 1) * width, height * width - 1];
  for (const seed of seeds) {
    if (similarTo(data, seed * 4, bg, tolerance)) {
      stack.push(seed);
    }
  }
  let cleared = 0;
  while (stack.length > 0) {
    const cell = stack.pop()!;
    if (visited[cell]) {
      continue;
    }
    visited[cell] = 1;
    const offset = cell * 4;
    if (!similarTo(data, offset, bg, tolerance)) {
      continue;
    }
    data[offset + 3] = 0;
    cleared += 1;
    const x = cell % width;
    const y = (cell / width) | 0;
    if (x > 0) {
      stack.push(cell - 1);
    }
    if (x + 1 < width) {
      stack.push(cell + 1);
    }
    if (y > 0) {
      stack.push(cell - width);
    }
    if (y + 1 < height) {
      stack.push(cell + width);
    }
  }
  return cleared > 0;
}
