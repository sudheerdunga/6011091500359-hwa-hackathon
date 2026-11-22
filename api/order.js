const fs = require('fs');
const path = require('path');

const ORDERS_FILE = process.env.VERCEL === '1'
  ? '/tmp/orders.json'
  : path.join(__dirname, 'orders.json');

// Source of truth for pricing (mirrors the frontend store).
const BASE_PRICES = { starter: 3400, standard: 4900, extended: 6900 };
const SIZE_PRICES = { small: 0, medium: 800, large: 1500 };
const SCENT_PRICES = { peanut: 800, broth: 800, herb: 800, variety: 2200 };

const readOrders = () => {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

const writeOrders = (orders) => {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
  }

  const body = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

  let order;
  try { order = JSON.parse(body); } catch (e) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid JSON body.' }));
  }

  if (!order || typeof order !== 'object') {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Order body must be an object.' }));
  }

  const { customer, items, total } = order;

  if (!customer || typeof customer !== 'object') {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'customer is required.' }));
  }
  const { name, email, address } = customer;
  if (!name || !String(name).trim()) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'customer.name is required.' }));
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'customer.email is required and must be valid.' }));
  }
  if (!address || !String(address).trim()) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'customer.address is required.' }));
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'items must be a non-empty array.' }));
  }

  let computed = 0;
  for (const it of items) {
    if (!it.productId || !it.name) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Each item needs productId and name.' }));
    }
    if (!it.base || !(it.base in BASE_PRICES)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Each item needs a valid base tier.' }));
    }
    if (!it.size || !(it.size in SIZE_PRICES)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Each item needs a valid size/pace.' }));
    }
    if (!it.scent || !(it.scent in SCENT_PRICES)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Each item needs a valid scent pack.' }));
    }
    const qty = Number(it.qty);
    if (!qty || qty < 1 || qty > 99) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Each item qty must be 1-99.' }));
    }
    computed += (BASE_PRICES[it.base] + SIZE_PRICES[it.size] + SCENT_PRICES[it.scent]) * qty;
  }

  const providedTotal = Number(total);
  if (!providedTotal || providedTotal < 0 || Math.abs(providedTotal - computed) > 1) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Order total does not match itemized total.' }));
  }

  const orderId = 'SCNT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const record = {
    orderId,
    customer: { name: String(name).trim(), email: String(email).trim(), address: String(address).trim() },
    items: items.map(it => ({
      productId: it.productId,
      name: it.name,
      qty: Number(it.qty),
      base: it.base,
      size: it.size,
      scent: it.scent,
      unitPrice: BASE_PRICES[it.base] + SIZE_PRICES[it.size] + SCENT_PRICES[it.scent]
    })),
    total: computed,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  const orders = readOrders();
  orders.push(record);
  writeOrders(orders);

  res.statusCode = 200;
  return res.end(JSON.stringify({ ok: true, orderId, total: computed }));
};
