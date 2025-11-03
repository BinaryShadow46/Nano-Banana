# NanoBanana Pro — Vanilla JS

## Quick start (mobile-friendly)

1. Create a GitHub repo and push these files (use TrebEdit to create files on your phone).
2. Connect the repo to Vercel and enable deployments for the `main` branch.
3. In Vercel dashboard -> Project -> Settings -> Environment Variables, add:
   - `GEMINI_API_KEY` = <your Gemini API key or Bearer token>

   *Alternative auth:* If you prefer to use Google service account (ADC), set up ADC on Vercel following Google Cloud docs and modify `api/generate.js` to use ADC headers.

4. Deploy. The frontend will be served at `/` and the serverless function at `/api/generate`.

5. Usage: open your deployed site on your phone, upload an image, write a prompt, tap Generate.

## Notes & troubleshooting

- **Gemini endpoint & model name:** Current recommended model: `gemini-2.5-flash-image` (aka Nano Banana). If you receive errors, check the official docs: https://ai.google.dev/gemini-api/docs and Vertex AI docs https://cloud.google.com/vertex-ai.

- **Request format:** The example server function sends inline base64. For larger images, upload to a signed URL (Cloud Storage) and pass a URI reference to Gemini instead.

- **Security:** Keep `GEMINI_API_KEY` private in Vercel env vars. Do not put the key in `index.html`.

- **Costs:** Monitor usage/billing in Google Cloud or AI Studio.

- **Improving quality:** Build a prompt rewriter microservice (you can call Gemini to rewrite/expand a user prompt before sending to the image model).

## References

- Gemini image docs: https://ai.google.dev/gemini-api/docs/image-generation
- Vertex AI image generation: https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/image-generation