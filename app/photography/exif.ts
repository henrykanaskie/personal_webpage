// ─── Server-only: minimal EXIF reader ────────────────────────────────────────
// Parses the raw EXIF buffer Sharp returns ("Exif\0\0" + TIFF block) for the
// handful of tags the lightbox displays. Anything unreadable is skipped.

import type { PhotoExif } from "./data";

const TAG = {
  make: 0x010f,
  model: 0x0110,
  exifPointer: 0x8769,
  exposureTime: 0x829a,
  fNumber: 0x829d,
  iso: 0x8827,
  dateOriginal: 0x9003,
  focalLength: 0x920a,
  lensModel: 0xa434,
} as const;

// Byte size of one value for each TIFF field type
const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

type Value = string | number | undefined;

export function parseExif(raw: Buffer | undefined): PhotoExif {
  if (!raw || raw.length < 14) return {};
  // Sharp's buffer starts with the "Exif\0\0" APP1 header; the TIFF block follows.
  const base = raw.toString("latin1", 0, 4) === "Exif" ? 6 : 0;
  const tiff = raw.subarray(base);
  const le = tiff.toString("latin1", 0, 2) === "II";
  const u16 = (o: number) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o: number) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));

  const readIfd = (offset: number): Map<number, Value> => {
    const out = new Map<number, Value>();
    if (offset + 2 > tiff.length) return out;
    const count = u16(offset);
    for (let i = 0; i < count; i++) {
      const entry = offset + 2 + i * 12;
      if (entry + 12 > tiff.length) break;
      const tag = u16(entry);
      const type = u16(entry + 2);
      const n = u32(entry + 4);
      const size = (TYPE_SIZE[type] ?? 1) * n;
      // Values of 4 bytes or fewer live inline in the entry itself
      const at = size <= 4 ? entry + 8 : u32(entry + 8);
      if (at + size > tiff.length) continue;

      if (type === 2) {
        out.set(
          tag,
          tiff
            .toString("latin1", at, at + n)
            .replace(/\0.*$/s, "")
            .trim(),
        );
      } else if (type === 3) {
        out.set(tag, u16(at));
      } else if (type === 4) {
        out.set(tag, u32(at));
      } else if (type === 5 || type === 10) {
        const den = u32(at + 4);
        out.set(tag, den ? u32(at) / den : undefined);
      }
    }
    return out;
  };

  try {
    const ifd0 = readIfd(u32(4));
    const ptr = ifd0.get(TAG.exifPointer);
    const exif = typeof ptr === "number" ? readIfd(ptr) : new Map<number, Value>();

    const str = (v: Value) => (typeof v === "string" && v ? v : undefined);
    const num = (v: Value) => (typeof v === "number" && isFinite(v) && v > 0 ? v : undefined);

    const make = str(ifd0.get(TAG.make));
    let model = str(ifd0.get(TAG.model));
    // Avoid "SONY ILCE-7M4" style duplication when the model already names the maker
    if (make && model && !model.toLowerCase().startsWith(make.toLowerCase().split(" ")[0])) {
      model = `${make.split(" ")[0]} ${model}`;
    }
    const date = str(exif.get(TAG.dateOriginal));

    return {
      camera: model,
      lens: str(exif.get(TAG.lensModel)),
      focal: num(exif.get(TAG.focalLength)),
      aperture: num(exif.get(TAG.fNumber)),
      shutter: num(exif.get(TAG.exposureTime)),
      iso: num(exif.get(TAG.iso)),
      // EXIF dates look like "2024:05:17 19:42:03"
      date: date ? date.slice(0, 10).replace(/:/g, "-") : undefined,
    };
  } catch {
    return {};
  }
}
