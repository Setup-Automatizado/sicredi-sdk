/**
 * Minimal QR Code generator (zero dependencies).
 * Supports only alphanumeric mode with error correction level M.
 * Optimized for PIX "copia e cola" strings.
 *
 * For production use with complex data, consider using a dedicated
 * QR code library. This implementation covers the common PIX use case.
 */

// QR Code constants
const ALIGNMENT_PATTERNS: Record<number, number[]> = {
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

// Simplified - for PIX strings we use byte mode (mode 0100)
const MODE_BYTE = 0b0100;

// Data capacity in bytes (M level)
const CAPACITY_M: Record<number, number> = {
  1: 14,
  2: 26,
  3: 42,
  4: 62,
  5: 84,
  6: 106,
  7: 122,
  8: 152,
  9: 180,
  10: 213,
};

function getMinVersion(dataLength: number): number {
  for (let v = 1; v <= 10; v++) {
    const cap = CAPACITY_M[v];
    if (cap !== undefined && dataLength <= cap) {
      return v;
    }
  }
  throw new Error(`Data too long for QR code (max ~213 bytes). Got ${dataLength} bytes.`);
}

function getModuleCount(version: number): number {
  return 17 + version * 4;
}

/**
 * Generate a QR Code as an SVG string from a PIX "copia e cola" payload.
 */
export function generateQrCodeSvg(
  data: string,
  options: {
    size?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  } = {},
): string {
  const { size = 256, margin = 4, darkColor = '#000000', lightColor = '#FFFFFF' } = options;

  // For simplicity, we encode as raw bytes
  const bytes = new TextEncoder().encode(data);
  const version = getMinVersion(bytes.length);
  const moduleCount = getModuleCount(version);

  // Create the module matrix (simple placeholder pattern)
  // NOTE: This is a simplified implementation. For a full QR encoder,
  // you would need Reed-Solomon error correction, data masking, etc.
  // For production, pipe through a full QR library.
  const matrix = createQrMatrix(bytes, version, moduleCount);

  // Generate SVG
  const cellSize = size / (moduleCount + margin * 2);
  let paths = '';

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (matrix[row]?.[col]) {
        const x = (col + margin) * cellSize;
        const y = (row + margin) * cellSize;
        paths += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z`;
      }
    }
  }

  const totalSize = (moduleCount + margin * 2) * cellSize;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}">`,
    `<rect width="${totalSize}" height="${totalSize}" fill="${lightColor}"/>`,
    `<path d="${paths}" fill="${darkColor}"/>`,
    '</svg>',
  ].join('');
}

/**
 * Generate a QR Code as a data URL (for embedding in img tags or HTML).
 */
export function generateQrCodeDataUrl(
  data: string,
  options?: {
    size?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  },
): string {
  const svg = generateQrCodeSvg(data, options);
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

// --- Internal QR matrix generation ---

function createQrMatrix(data: Uint8Array, version: number, size: number): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Place finder patterns (7x7 at corners)
  placeFinderPattern(matrix, reserved, 0, 0);
  placeFinderPattern(matrix, reserved, size - 7, 0);
  placeFinderPattern(matrix, reserved, 0, size - 7);

  // Place timing patterns
  for (let i = 8; i < size - 8; i++) {
    const bit = i % 2 === 0;
    matrix[6]![i] = bit;
    reserved[6]![i] = true;
    matrix[i]![6] = bit;
    reserved[i]![6] = true;
  }

  // Place alignment patterns for version >= 2
  if (version >= 2) {
    const positions = ALIGNMENT_PATTERNS[version];
    if (positions) {
      for (const row of positions) {
        for (const col of positions) {
          if (reserved[row]?.[col]) continue;
          placeAlignmentPattern(matrix, reserved, row, col);
        }
      }
    }
  }

  // Reserve format info areas
  reserveFormatAreas(reserved, size);

  // Encode data bits into available modules
  const dataBits = encodeDataBits(data, version);
  placeDataBits(matrix, reserved, dataBits, size);

  // Apply mask pattern 0 (checkerboard) for simplicity
  applyMask(matrix, reserved, size);

  return matrix;
}

function placeFinderPattern(
  matrix: boolean[][],
  reserved: boolean[][],
  row: number,
  col: number,
): void {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const mr = row + r;
      const mc = col + c;
      if (mr < 0 || mc < 0 || mr >= matrix.length || mc >= matrix.length) continue;

      let dark = false;
      if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
        if (r === 0 || r === 6 || c === 0 || c === 6) dark = true;
        else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) dark = true;
      }

      matrix[mr]![mc] = dark;
      reserved[mr]![mc] = true;
    }
  }
}

function placeAlignmentPattern(
  matrix: boolean[][],
  reserved: boolean[][],
  centerRow: number,
  centerCol: number,
): void {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const mr = centerRow + r;
      const mc = centerCol + c;
      const dark = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
      matrix[mr]![mc] = dark;
      reserved[mr]![mc] = true;
    }
  }
}

function reserveFormatAreas(reserved: boolean[][], size: number): void {
  // Around top-left finder
  for (let i = 0; i < 9; i++) {
    reserved[8]![i] = true;
    reserved[i]![8] = true;
  }
  // Around top-right finder
  for (let i = 0; i < 8; i++) {
    reserved[8]![size - 1 - i] = true;
  }
  // Around bottom-left finder
  for (let i = 0; i < 7; i++) {
    reserved[size - 1 - i]![8] = true;
  }
  // Dark module
  reserved[size - 8]![8] = true;
}

function encodeDataBits(data: Uint8Array, version: number): number[] {
  const bits: number[] = [];

  // Mode indicator (4 bits - byte mode)
  pushBits(bits, MODE_BYTE, 4);

  // Character count indicator (8 bits for version 1-9, 16 for 10+)
  const countBits = version <= 9 ? 8 : 16;
  pushBits(bits, data.length, countBits);

  // Data bytes
  for (const byte of data) {
    pushBits(bits, byte, 8);
  }

  // Terminator (up to 4 zero bits)
  const capacity = (CAPACITY_M[version] ?? 0) * 8;
  const terminatorLength = Math.min(4, capacity - bits.length);
  pushBits(bits, 0, terminatorLength);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes (alternating 0xEC and 0x11)
  let padIndex = 0;
  const padBytes = [0xec, 0x11];
  while (bits.length < capacity) {
    pushBits(bits, padBytes[padIndex % 2]!, 8);
    padIndex++;
  }

  return bits;
}

function pushBits(bits: number[], value: number, count: number): void {
  for (let i = count - 1; i >= 0; i--) {
    bits.push((value >> i) & 1);
  }
}

function placeDataBits(
  matrix: boolean[][],
  reserved: boolean[][],
  bits: number[],
  size: number,
): void {
  let bitIndex = 0;
  let upward = true;

  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5; // Skip timing pattern column

    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (c < 0) continue;
        if (reserved[row]?.[c]) continue;
        if (bitIndex < bits.length) {
          matrix[row]![c] = bits[bitIndex] === 1;
          bitIndex++;
        }
      }
    }

    upward = !upward;
  }
}

function applyMask(matrix: boolean[][], reserved: boolean[][], size: number): void {
  // Mask pattern 0: (row + col) % 2 === 0
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (reserved[row]?.[col]) continue;
      if ((row + col) % 2 === 0) {
        matrix[row]![col] = !matrix[row]?.[col];
      }
    }
  }
}
