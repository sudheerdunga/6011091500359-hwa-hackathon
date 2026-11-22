const STORE = (() => {
  const CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const dollars = (c) => CURRENCY.format(c / 100);

  const product = {
    id: 'foraging-labyrinth-1',
    name: 'Scent-Trail & Micro-Kibble Foraging Labyrinth',
    tagline: 'Keeps your dog happily busy while you\'re away.',
    description: 'A scent-driven foraging puzzle that turns mealtime into a long, rewarding hunt. Choose your base labyrinth, your dog\'s size and play pace, and a scent cartridge pack to match.',
    image: null,
    features: [
      'Scent trails and hidden micro-kibble tap into your dog&rsquo;s natural foraging instinct',
      'Slow-rewarding pods stretch mealtime into a long, satisfying hunt while you are away',
      'Hours of sniffing, nudging, and problem-solving tire your dog out and reduce boredom',
      'Three labyrinth sizes (8, 12, or 18 pods) match every home and appetite',
      'Wall thickness and slide resistance tuned to Small/Gentle, Medium/Curious, or Large/Determined dogs',
      'Swap-in scent cartridges: Roasted Peanut, Savory Broth, Calming Herb, or Variety 3-Pack',
      'Easy to refill, easy to clean, built for daily use'
    ],
    variants: {
      base: [
        { id: 'starter', name: 'Starter Mat', pods: 8, price: 3400, desc: '8 pods &mdash; perfect for first-time foragers' },
        { id: 'standard', name: 'Standard Labyrinth', pods: 12, price: 4900, desc: '12 pods &mdash; the sweet spot of challenge and reward' },
        { id: 'extended', name: 'Extended Home Pack', pods: 18, price: 6900, desc: '18 pods + connector &mdash; the full foraging experience' }
      ],
      size: [
        { id: 'small', name: 'Small / Gentle', price: 0, desc: 'Thin walls, light slide resistance' },
        { id: 'medium', name: 'Medium / Curious', price: 800, desc: 'Medium walls, moderate slide resistance' },
        { id: 'large', name: 'Large / Determined', price: 1500, desc: 'Thick walls, firm slide resistance' }
      ],
      scent: [
        { id: 'peanut', name: 'Roasted Peanut', price: 800, desc: 'Rich, nutty scent trail' },
        { id: 'broth', name: 'Savory Broth', price: 800, desc: 'Meaty, savory aroma' },
        { id: 'herb', name: 'Calming Herb', price: 800, desc: 'Soothing herbal blend' },
        { id: 'variety', name: 'Variety 3-Pack', price: 2200, desc: 'All three scents in rotation' }
      ]
    }
  };

  const CART_KEY = 'foraging_cart';
  let cart = [];
  const listeners = [];

  const load = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      cart = raw ? JSON.parse(raw) : [];
    } catch (e) { cart = []; }
    normalize();
    save();
    notify();
  };

  const normalize = () => {
    cart = cart.filter(item => item && item.qty && item.qty > 0 && item.base && item.size && item.scent);
    cart.forEach(item => {
      if (!item.qty || item.qty < 1) item.qty = 1;
    });
  };

  const save = () => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  };

  const notify = () => listeners.forEach(fn => fn(cart));

  const subscribe = (fn) => { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; };

  const getProduct = () => product;
  const getCart = () => cart;
  const getCartCount = () => cart.reduce((s, i) => s + i.qty, 0);
  const getCartTotal = () => cart.reduce((s, i) => s + itemLineTotal(i), 0);

  const variantPrice = (baseId, sizeId, scentId) => {
    const b = product.variants.base.find(x => x.id === baseId);
    const s = product.variants.size.find(x => x.id === sizeId);
    const sc = product.variants.scent.find(x => x.id === scentId);
    return (b ? b.price : 0) + (s ? s.price : 0) + (sc ? sc.price : 0);
  };

  const itemLineTotal = (item) => variantPrice(item.base, item.size, item.scent) * item.qty;

  const variantLabel = (item) => {
    const b = product.variants.base.find(x => x.id === item.base);
    const s = product.variants.size.find(x => x.id === item.size);
    const sc = product.variants.scent.find(x => x.id === item.scent);
    return `${b ? b.name : item.base} &bull; ${s ? s.name : item.size} &bull; ${sc ? sc.name : item.scent}`;
  };

  const addOrUpdate = ({ base, size, scent }) => {
    const existing = cart.find(i => i.base === base && i.size === size && i.scent === scent);
    if (existing) { existing.qty += 1; }
    else { cart.push({ base, size, scent, qty: 1 }); }
    normalize(); save(); notify();
    return cart;
  };

  const setQty = (index, qty) => {
    const i = cart[index];
    if (!i) return cart;
    qty = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
    i.qty = qty;
    normalize(); save(); notify();
    return cart;
  };

  const remove = (index) => {
    cart.splice(index, 1);
    normalize(); save(); notify();
    return cart;
  };

  const clear = () => {
    cart = []; save(); notify();
  };

  return { cents, dollars, product, getProduct, getCart, getCartCount, getCartTotal, addOrUpdate, setQty, remove, clear, load, subscribe, itemLineTotal, variantPrice, variantLabel };
})();

window.STORE = STORE;
