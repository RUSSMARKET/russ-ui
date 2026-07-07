import { describe, expect, it } from 'vitest';
import { extractDominantColorFromImageData } from './extractDominantColorFromLogo';

function createImageData(pixels: Array<[number, number, number, number]>): {
  data: Uint8ClampedArray;
  width: number;
  height: number;
} {
  const width = pixels.length;
  const height = 1;
  const data = new Uint8ClampedArray(width * 4);

  pixels.forEach(([r, g, b, a], index) => {
    const offset = index * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = a;
  });

  return { data, width, height };
}

describe('extractDominantColorFromImageData', () => {
  it('returns most frequent non-white color as hex', () => {
    const result = extractDominantColorFromImageData(
      createImageData([
        [255, 255, 255, 255],
        [255, 255, 255, 255],
        [32, 64, 128, 255],
        [32, 64, 128, 255],
        [32, 64, 128, 255],
        [10, 20, 30, 255],
      ]),
    );

    expect(result).toBe('#204080');
  });

  it('ignores transparent pixels', () => {
    const result = extractDominantColorFromImageData(
      createImageData([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [200, 40, 40, 255],
      ]),
    );

    expect(result).toBe('#d03030');
  });

  it('returns null when only white or transparent pixels remain', () => {
    const result = extractDominantColorFromImageData(
      createImageData([
        [255, 255, 255, 255],
        [250, 250, 250, 255],
        [0, 0, 0, 0],
      ]),
    );

    expect(result).toBeNull();
  });

  it('quantizes similar colors into one bucket', () => {
    const result = extractDominantColorFromImageData(
      createImageData([
        [33, 65, 129, 255],
        [34, 66, 130, 255],
        [35, 67, 131, 255],
      ]),
    );

    expect(result).toBe('#204080');
  });
});
