#!/usr/bin/env node
/**
 * VaultImage MCP — local image tools for AI agents (Claude, ChatGPT Apps, any MCP host).
 * Images are read and written on the local machine; nothing is uploaded.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { imageInfo, imageResize, imageConvert, imageStripMetadata, imageWatermark, imageCrop, imageRotate } from "./lib.mjs";
import { licenseStatus, upgradeMessage } from "./license.mjs";

const server = new McpServer({ name: "vaultimg-mcp", version: "0.2.0" });
const text = t => ({ content: [{ type: "text", text: t }] });
const wrap = fn => async (args) => {
  try { return text(await fn(args)); }
  catch (e) { return { isError: true, content: [{ type: "text", text: "Error: " + e.message }] }; }
};
const pro = fn => async (args) => {
  const st = await licenseStatus();
  if (!st.pro) return text(upgradeMessage(st.reason));
  try { return text(await fn(args)); }
  catch (e) { return { isError: true, content: [{ type: "text", text: "Error: " + e.message }] }; }
};

server.registerTool("image_info", {
  title: "Image info",
  description: "Return dimensions, format, file size and whether a local image carries EXIF metadata.",
  inputSchema: { path: z.string().describe("Absolute path to the image") }
}, wrap(({ path }) => imageInfo(path)));

server.registerTool("image_resize", {
  title: "Resize image",
  description: "Resize a local image. Give width and/or height in pixels; pass only one to preserve aspect ratio.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source image"),
    width: z.number().int().positive().optional().describe("Target width in pixels (optional)"),
    height: z.number().int().positive().optional().describe("Target height in pixels (optional)"),
    output: z.string().describe("Absolute path to write the resized image")
  }
}, wrap(({ input, width, height, output }) => imageResize(input, width, height, output)));

server.registerTool("image_convert", {
  title: "Convert image format",
  description: "Convert a local image to another format. The target format is taken from the output file extension (.png/.jpg/.jpeg/.bmp/.tiff/.gif).",
  inputSchema: {
    input: z.string().describe("Absolute path to the source image"),
    output: z.string().describe("Absolute path with the desired extension, e.g. /tmp/out.png")
  }
}, wrap(({ input, output }) => imageConvert(input, output)));

server.registerTool("image_strip_metadata", {
  title: "Strip image metadata",
  description: "Write a copy of a local image with EXIF/GPS/camera metadata removed (privacy). Useful before sharing photos.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source image"),
    output: z.string().describe("Absolute path to write the cleaned image")
  }
}, wrap(({ input, output }) => imageStripMetadata(input, output)));

/* ---- Pro tools (one-time 9 USDC license; see README) ---- */

server.registerTool("image_watermark", {
  title: "Watermark image (Pro)",
  description: "Pro: print a text watermark onto a local image.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source image"),
    text: z.string().describe("Watermark text"),
    output: z.string().describe("Absolute path to write the watermarked image")
  }
}, pro(({ input, text, output }) => imageWatermark(input, text, output)));

server.registerTool("image_crop", {
  title: "Crop image (Pro)",
  description: "Pro: crop a rectangular region from a local image.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source image"),
    x: z.number().int().min(0).describe("Left offset in pixels"),
    y: z.number().int().min(0).describe("Top offset in pixels"),
    width: z.number().int().positive().describe("Crop width in pixels"),
    height: z.number().int().positive().describe("Crop height in pixels"),
    output: z.string().describe("Absolute path to write the cropped image")
  }
}, pro(({ input, x, y, width, height, output }) => imageCrop(input, x, y, width, height, output)));

server.registerTool("image_rotate", {
  title: "Rotate image (Pro)",
  description: "Pro: rotate a local image by any number of degrees.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source image"),
    degrees: z.number().describe("Rotation in degrees (clockwise)"),
    output: z.string().describe("Absolute path to write the rotated image")
  }
}, pro(({ input, degrees, output }) => imageRotate(input, degrees, output)));

await server.connect(new StdioServerTransport());
