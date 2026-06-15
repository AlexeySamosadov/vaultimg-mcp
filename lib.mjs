import Jimp from "jimp";
import { stat } from "node:fs/promises";

const AUTO = Jimp.AUTO;

export async function imageInfo(path) {
  const img = await Jimp.read(path);
  const hasExif = !!(img._exif && img._exif.tags && Object.keys(img._exif.tags).length);
  const { size } = await stat(path);
  return [
    `${img.getWidth()}×${img.getHeight()} px`,
    `format: ${img.getMIME()}`,
    `file size: ${(size / 1024).toFixed(1)} KB`,
    `EXIF metadata: ${hasExif ? "present (use image_strip_metadata to remove)" : "none"}`
  ].join("\n");
}

export async function imageResize(input, width, height, output) {
  const img = await Jimp.read(input);
  const w = width && width > 0 ? width : AUTO;
  const h = height && height > 0 ? height : AUTO;
  if (w === AUTO && h === AUTO) throw new Error("Provide width and/or height (in pixels)");
  img.resize(w, h); // one AUTO preserves aspect ratio
  await img.writeAsync(output);
  return `Resized → ${output} (${img.getWidth()}×${img.getHeight()} px)`;
}

export async function imageConvert(input, output) {
  // Target format is inferred from the output extension (.png/.jpg/.jpeg/.bmp/.tiff/.gif)
  const img = await Jimp.read(input);
  const from = img.getMIME();
  await img.writeAsync(output);
  return `Converted ${from} → ${output}`;
}

export async function imageStripMetadata(input, output) {
  const img = await Jimp.read(input);
  const had = !!(img._exif && img._exif.tags && Object.keys(img._exif.tags).length);
  // Jimp re-encodes from raw pixels, so EXIF/GPS/camera metadata is dropped.
  await img.writeAsync(output);
  return `Wrote ${output} with metadata stripped (EXIF was ${had ? "present" : "absent"} in the source).`;
}
