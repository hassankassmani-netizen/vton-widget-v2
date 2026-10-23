// Serverless function: hides the Hugging Face token and calls the try-on Space.
import { Client, handle_file } from "@gradio/client";

const SPACE = process.env.VTON_SPACE || "yisol/IDM-VTON";

function dataUrlToBlob(s) {
  const m = /^data:(.+?);base64,(.+)$/.exec(s || "");
  if (!m) throw new Error("Invalid person image");
  return new Blob([Buffer.from(m[2], "base64")], { type: m[1] });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { person, garment, name = "garment" } = req.body || {};
    if (!person || !garment) return res.status(400).json({ error: "person and garment are required" });
    if (!/^https?:\/\//i.test(garment)) return res.status(400).json({ error: "garment must be an http(s) URL" });

    const gr = await fetch(garment);
    if (!gr.ok) throw new Error("Could not download the garment image");
    const garmentBlob = await gr.blob();

    const client = await Client.connect(SPACE, { hf_token: process.env.HF_TOKEN });
    // Parameter names follow the IDM-VTON Space. If the Space changes,
    // open its "Use via API" page and match these names.
    const result = await client.predict("/tryon", {
      dict: { background: handle_file(dataUrlToBlob(person)), layers: [], composite: null },
      garm_img: handle_file(garmentBlob),
      garment_des: String(name).slice(0, 120),
      is_checked: true,
      is_checked_crop: false,
      denoise_steps: 30,
      seed: 42
    });

    const out = result?.data?.[0];
    const url = out?.url || out?.path;
    if (!url) throw new Error("No image returned");
    return res.status(200).json({ url });
  } catch (e) {
    console.error("tryon error:", e);
    return res.status(502).json({
      error: "The try-on service is busy or failed. Please try again in a minute. (" + (e.message || "unknown") + ")"
    });
  }
}
