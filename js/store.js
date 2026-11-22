const STORE = (() => {
  const CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const cents = (n) => Math.round(n * 100);
  const dollars = (c) => CURRENCY.format(c / 100);

  const product = {
    id: 'luma-lamp-1',
    name: 'Luma Smart Desk Lamp',
    tagline: 'Light that works as hard as you do.',
    price: 8900,
    image: null,
    description: 'A single, beautifully considered desk lamp with wireless charging, touch-controlled brightness, and memory presets so your workspace is always set just right.',
    features: [
      'Wireless charging pad in the base',
      'Touch-controlled dimming with 5 brightness levels',
      'Warm-to-cool color temperature shift',
      'USB-C pass-through port on the back',
      'Memory presets recall your last brightness',
      'Aluminum body, 800+ lumens, flicker-free'
    ]
  };

  const addOns = [
    { id: 'warranty', name: 'Extended 2-Year Warranty', price: 1900, description: 'Parts and labor coverage beyond the first year.' },
    { id: 'bulb', name: 'Premium LED Bulb Upgrade', price: 1200, description: 'Higher CRI, warmer glow, longer lifespan.' },
    { id: 'mount', name: 'Desk Organizer Mount', price: 2400, description: 'Clip-on holder for pens, phone, and notes.' }
  ];

  const CART_KEY = 'luma_cart';
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
    cart = cart.filter(item => item && item.qty && item.qty > 0);
    cart.forEach(item => {
      if (!Array.isArray(item.addOnIds)) item.addOnIds = [];
      if (!item.qty || item.qty < 1) item.qty = 1;
    });
  };

  const save = () => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  };

  const notify = () => listeners.forEach(fn => fn(cart));

  const subscribe = (fn) => { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; };

  const getProduct = () => product;
  const getAddOns = () => addOns;
  const getCart = () => cart;
  const getCartCount = () => cart.reduce((s, i) => s + i.qty, 0);
  const getCartTotal = () => cart.reduce((s, i) => s + itemLineTotal(i), 0);

  const itemLineTotal = (item) => {
    let total = product.price * item.qty;
    item.addOnIds.forEach(id => {
      const a = addOns.find(x => x.id === id);
      if (a) total += a.price * item.qty;
    });
    return total;
  };

  const addOrUpdate = (addOnIds) => {
    const clean = Array.isArray(addOnIds) ? addOnIds.filter(Boolean) : [];
    const existing = cart.find(i => JSON.stringify(i.addOnIds.sort()) === JSON.stringify(clean.sort()));
    if (existing) { existing.qty += 1; }
    else { cart.push({ productId: product.id, qty: 1, addOnIds: clean }); }
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

  return { cents, dollars, product, addOns, getProduct, getAddOns, getCart, getCartCount, getCartTotal, addOrUpdate, setQty, remove, clear, load, subscribe, itemLineTotal };
})();

window.STORE = STORE;