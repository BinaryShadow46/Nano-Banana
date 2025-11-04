// api/generate.js
// Simple Vercel serverless endpoint that proxies a request to Google Gemini (image model).

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const { image_b64, prompt, num_images = 1, size = '1024' } = req.body || {};
    if (!image_b64 || !prompt) return res.status(400).json({ error: 'missing image or prompt' });

    // IMPORTANT: Set your API key in Vercel dashboard as ENV var: GEMINI_API_KEY
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'server missing GEMINI_API_KEY env variable' });

    // Prepare request payload for Gemini - NOTE: confirm final shape from the Gemini docs.
    // Current recommended model name: "gemini-2.5-flash-image" (aka nano-banana)
    // Docs (links included in README) show you can send inline base64 image data for small files.

    const model = 'gemini-2.5-flash-image';

    // This example uses the public REST style endpoint used by Google Generative APIs.
    // *If your account uses OAuth/ADC or a different path, change accordingly.*

    const endpoint = `https://api.generativeai.google/v1/models/${model}:generate`;

    // Build `inputs` per API. The exact field names may change — if your request fails,
    // inspect the official docs and adjust payload shape (I include links in README).
    const body = {
      // high-level request envelope — for image editing, include the image as an input
      input: [
        {
          type: 'image',
          image: {
            // the API may accept base64 directly or a data URI — strip prefix if necessary
            data: image_b64.split(',').pop(),
            encoding: 'base64'
          }
        },
        { type: 'text', text: prompt }
      ],
      // options such as number of images and size
      params: { num_images: Number(num_images), size: `${size}x${size}` }
    };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AIzaSyBqY-6jC0vd6xlfBykn1CR1dzFhiT10Zc4}` },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error('Gemini error', r.status, txt);
      return res.status(502).json({ error: 'Gemini API error', details: txt });
    }

    const data = await r.json();

    // The response shape varies. Here we try to extract base64 images from a common shape.
    // You may need to adapt this parsing depending on the actual Gemini response.
    const images = [];
    try {
      // Example: data.candidates[0].content.parts with inline_data.data bytes (see docs)
      const candidates = data.candidates || data.outputs || [];
      for (const c of candidates) {
        if (c.content && c.content.parts) {
          for (const p of c.content.parts) {
            if (p.inline_data && p.inline_data.data) {
              // inline_data.data is base64 bytes
              images.push(p.inline_data.data);
            }
          }
        }
        if (c.image && c.image.data) {
          images.push(c.image.data);
        }
        if (c.output_images) {
          for (const im of c.output_images) if (im.data) images.push(im.data);
        }
      }
    } catch (e) {
      console.warn('response parse fallback', e);
    }

    // Fallback: if the response contains a single image encoded as `b64` or `base64`
    if (!images.length && data.base64_image) images.push(data.base64_image);

    return res.status(200).json({ images });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error', details: String(err) });
  }
}
