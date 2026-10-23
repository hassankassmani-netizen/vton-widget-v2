# Virtual try-on widget

## Deploy (about 10 minutes)
1. Add `public/models/female.jpg` and `public/models/male.jpg` (full body, front view, plain background).
2. Push this folder to a GitHub repo.
3. On vercel.com: New Project -> import the repo -> Environment Variables:
   - `HF_TOKEN` = your Hugging Face token (create a free one at huggingface.co/settings/tokens, read access)
4. Deploy. You get `https://YOUR-APP.vercel.app`.
5. Test: open that URL directly. Click the button, paste a clothing image URL, press "Try it on".

## Give a brand one line
<script src="https://YOUR-APP.vercel.app/loader.js" data-accent="#0f766e" defer></script>

The loader reads the store's products automatically (Shopify and WooCommerce).
Any other site can define `window.VTON_PRODUCTS = [{id,name,price,img,url,category,gender}]` before the script.
category: upper | bottom | footwear | accessories. gender: male | female | unisex.

## Know the limits
- The free Hugging Face Space is shared: it can queue, run out of GPU quota, or be down. For paying brands, move to a paid API (fal.ai or Replicate) by editing `api/tryon.js` only.
- IDM-VTON fits tops. Pants and shoes need a different model.
- Add rate limiting before real traffic, because each try-on costs quota or money.
