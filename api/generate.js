// File: /api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image_b64, prompt, num_images = 3, size = 1024 } = req.body;

    if (!image_b64 || !prompt) {
      return res.status(400).json({ error: 'Missing image or prompt' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
    }

    // Remove any "data:image/png;base64," prefix
    const base64Data = image_b64.includes(',') ? image_b64.split(',')[1] : image_b64;

    const model = 'gemini-2.5-flash-image';
    const endpoint = `https://api.generativeai.google/v1/models/${model}:generate`;

    const body = {
      input: [
        { type: 'image', image: { data: base64Data, encoding: 'base64' } },
        { type: 'text', text: prompt }
      ],
      params: {
        num_images: Number(num_images),
        size: `${size}x${size}`
      }
    };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).json({ error: 'Gemini API error', details: txt });
    }

    const data = await r.json();

    // Extract base64 images from response
    const images = [];
    if (data.candidates) {
      data.candidates.forEach(c => {
        if (c.image?.data) images.push(c.image.data);
        if (c.content?.parts) {
          c.content.parts.forEach(p => {
            if (p.inline_data?.data) images.push(p.inline_data.data);
          });
        }
      });
    } else if (data.base64_image) {
      images.push(data.base64_image);
    }

    if (!images.length) {
      return res.status(500).json({ error: 'No images returned from Gemini API' });
    }

    return res.status(200).json({ images });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', details: String(err) });
  }
}
