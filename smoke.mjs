import Jimp from "jimp";
import { imageInfo, imageResize, imageConvert, imageStripMetadata } from "./lib.mjs";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const t = tmpdir();
const src = join(t, "vaultimg_src.png");
const r = join(t, "vaultimg_r.png");
const c = join(t, "vaultimg_c.jpg");
const s = join(t, "vaultimg_s.png");

let fail = 0;
const ok = (cond, msg) => { console.log((cond ? "PASS" : "FAIL") + " — " + msg); if (!cond) fail++; };

// make a 120x80 test image
const img = new Jimp(120, 80, 0xff0000ff);
await img.writeAsync(src);

const info = await imageInfo(src);
ok(/120×80/.test(info), "image_info reports dimensions: " + info.split("\n")[0]);

await imageResize(src, 60, undefined, r);
const ri = await Jimp.read(r);
ok(ri.getWidth() === 60 && ri.getHeight() === 40, "image_resize keeps aspect (got " + ri.getWidth() + "×" + ri.getHeight() + ")");

await imageConvert(src, c);
const ci = await Jimp.read(c);
ok(ci.getMIME() === "image/jpeg", "image_convert png→jpg (got " + ci.getMIME() + ")");

const stripMsg = await imageStripMetadata(src, s);
ok(/stripped/.test(stripMsg), "image_strip_metadata runs: " + stripMsg);

for (const f of [src, r, c, s]) { try { await unlink(f); } catch {} }
console.log(fail ? `\n${fail} FAILED` : "\nALL PASS");
process.exit(fail ? 1 : 0);
