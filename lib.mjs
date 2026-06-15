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

/* ---- Pro tools (require a valid VAULTIMG_LICENSE) ---- */

export async function imageWatermark(input, text, output) {
  const img = await Jimp.read(input);
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const y = Math.max(0, img.getHeight() - 44);
  img.print(font, 12, y, text);
  await img.writeAsync(output);
  return `Watermarked → ${output} ("${text}")`;
}

export async function imageCrop(input, x, y, width, height, output) {
  const img = await Jimp.read(input);
  if (x < 0 || y < 0 || width <= 0 || height <= 0) throw new Error("x,y must be >=0 and width,height >0");
  if (x + width > img.getWidth() || y + height > img.getHeight())
    throw new Error(`crop ${width}×${height} at ${x},${y} exceeds image ${img.getWidth()}×${img.getHeight()}`);
  img.crop(x, y, width, height);
  await img.writeAsync(output);
  return `Cropped → ${output} (${img.getWidth()}×${img.getHeight()} px)`;
}

export async function imageRotate(input, degrees, output) {
  const img = await Jimp.read(input);
  img.rotate(degrees);
  await img.writeAsync(output);
  return `Rotated ${degrees}° → ${output} (${img.getWidth()}×${img.getHeight()} px)`;
}
