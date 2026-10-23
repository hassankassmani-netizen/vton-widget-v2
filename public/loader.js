/* One-line embed for any store:
   <script src="https://YOUR-APP.vercel.app/loader.js" defer></script>
   Optional: data-accent="#0f766e" to match the brand colour. */
(function () {
  if (window.__VTON_LOADED__) return;
  window.__VTON_LOADED__ = true;

  var me = document.currentScript;
  var APP = new URL(me.src).origin;
  var accent = me.getAttribute("data-accent") || "";

  var frame = document.createElement("iframe");
  frame.src = APP + "/" + (accent ? "?accent=" + encodeURIComponent(accent) : "");
  frame.title = "Virtual try-on";
  frame.style.cssText =
    "position:fixed;right:20px;bottom:20px;width:180px;height:60px;border:0;" +
    "background:transparent;color-scheme:normal;z-index:2147483647;";
  document.body.appendChild(frame);

  function abs(u) { try { return new URL(u, location.href).href; } catch (e) { return ""; } }
  function category(t) {
    t = t.toLowerCase();
    if (/shoe|khussa|sandal|slipper|chappal|footwear|sneaker/.test(t)) return "footwear";
    if (/trouser|pant|shalwar|jean|bottom|capri|skirt|chino/.test(t)) return "bottom";
    if (/bag|watch|scarf|dupatta|belt|accessor|cap\b|wallet/.test(t)) return "accessories";
    return "upper";
  }
  function gender(t) {
    t = t.toLowerCase();
    if (/\b(women|woman|ladies|female|girls?)\b/.test(t)) return "female";
    if (/\b(men|man|male|boys?|gents)\b/.test(t)) return "male";
    return "unisex";
  }

  async function fromShopify() {
    var r = await fetch("/products.json?limit=250");
    if (!r.ok) throw 0;
    var j = await r.json();
    return j.products.map(function (p) {
      var t = [p.title, p.product_type, (p.tags || []).join ? [].concat(p.tags).join(" ") : p.tags].join(" ");
      return {
        id: String(p.id), name: p.title,
        price: p.variants && p.variants[0] ? p.variants[0].price : "",
        img: p.images && p.images[0] ? abs(p.images[0].src) : "",
        url: location.origin + "/products/" + p.handle,
        category: category(t), gender: gender(t)
      };
    });
  }
  async function fromWoo() {
    var r = await fetch("/wp-json/wc/store/v1/products?per_page=100");
    if (!r.ok) throw 0;
    var j = await r.json();
    return j.map(function (p) {
      var cats = (p.categories || []).map(function (c) { return c.name; }).join(" ");
      var t = p.name + " " + cats;
      var minor = p.prices ? Number(p.prices.currency_minor_unit || 0) : 0;
      return {
        id: String(p.id), name: p.name,
        price: p.prices ? (Number(p.prices.price) / Math.pow(10, minor)).toFixed(minor ? 2 : 0) : "",
        img: p.images && p.images[0] ? abs(p.images[0].src) : "",
        url: p.permalink, category: category(t), gender: gender(t)
      };
    });
  }
  async function loadCatalog() {
    if (window.VTON_PRODUCTS && window.VTON_PRODUCTS.length) return window.VTON_PRODUCTS; // brand-supplied
    try { return await fromShopify(); } catch (e) {}
    try { return await fromWoo(); } catch (e) {}
    return [];
  }

  var ready = false, catalog = null;
  function send() {
    if (ready && catalog && frame.contentWindow)
      frame.contentWindow.postMessage({ type: "VTON_CATALOG", products: catalog }, APP);
  }
  loadCatalog().then(function (c) { catalog = c; send(); });

  window.addEventListener("message", function (e) {
    if (e.origin !== APP) return;
    var d = e.data || {};
    if (d.type === "VTON_READY") { ready = true; send(); }
    if (d.type === "VTON_RESIZE") {
      var small = window.innerWidth < 520;
      if (d.open) {
        frame.style.width = small ? "100vw" : "400px";
        frame.style.height = small ? "100dvh" : "640px";
        frame.style.right = small ? "0" : "20px";
        frame.style.bottom = small ? "0" : "20px";
      } else {
        frame.style.width = "180px"; frame.style.height = "60px";
        frame.style.right = "20px"; frame.style.bottom = "20px";
      }
    }
    if (d.type === "VTON_OPEN_PRODUCT" && /^https?:\/\//.test(d.url || "")) window.open(d.url, "_blank", "noopener");
  });
})();
