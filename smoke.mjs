import Jimp from "jimp";
import { imageInfo, imageResize, imageConvert, imageStripMetadata, imageWatermark, imageCrop, imageRotate } from "./lib.mjs";
import { licenseStatus } from "./license.mjs";
import { readFile } from "node:fs/promises";
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

// --- Pro tools ---
const wm = join(t, "vaultimg_wm.png"), cr = join(t, "vaultimg_cr.png"), ro = join(t, "vaultimg_ro.png");
await imageWatermark(src, "DRAFT", wm);
ok((await Jimp.read(wm)).getWidth() === 120, "image_watermark writes image");
await imageCrop(src, 10, 10, 50, 40, cr);
const cri = await Jimp.read(cr);
ok(cri.getWidth() === 50 && cri.getHeight() === 40, "image_crop -> 50×40");
await imageRotate(src, 90, ro);
ok((await Jimp.read(ro)).getHeight() === 120, "image_rotate 90° swaps dims");

// --- license rail round-trip ---
const b64url = b => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function sign(p) {
  const priv = JSON.parse(await readFile("./license_private_key.json", "utf8"));
  const k = await crypto.subtle.importKey("jwk", priv, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const data = new TextEncoder().encode(JSON.stringify(p));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k, data);
  return b64url(data) + "." + b64url(new Uint8Array(sig));
}
delete process.env.VAULTIMG_LICENSE;
ok((await licenseStatus()).pro === false, "license: pro=false without env");
process.env.VAULTIMG_LICENSE = await sign({ email: "t@t.io", plan: "pro", iat: Math.floor(Date.now() / 1000) });
ok((await licenseStatus()).pro === true, "license: pro=true with valid key");
process.env.VAULTIMG_LICENSE = "bad.sig";
ok((await licenseStatus()).pro === false, "license: pro=false for tampered key");

for (const f of [src, r, c, s, wm, cr, ro]) { try { await unlink(f); } catch {} }
console.log(fail ? `\n${fail} FAILED` : "\nALL PASS");
process.exit(fail ? 1 : 0);
