const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'kopi_secret_jwt_key_987654321_secure';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '', // Sesuaikan password MySQL Anda
  database: 'db_kopi_hpp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Auto migration untuk kolom diskon/voucher pada tabel orders
(async () => {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'discount_amount'");
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE orders 
        ADD COLUMN subtotal DECIMAL(15,2) DEFAULT 0.00 AFTER payment_method,
        ADD COLUMN discount_type VARCHAR(20) DEFAULT 'none' AFTER subtotal,
        ADD COLUMN discount_value DECIMAL(15,2) DEFAULT 0.00 AFTER discount_type,
        ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0.00 AFTER discount_value`);
      console.log('Kolom diskon & voucher berhasil ditambahkan ke tabel orders.');
    }
  } catch (err) {
    console.log('Info migrasi orders:', err.message);
  }
})();

// Middleware JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'Token tidak ditemukan!' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Format token tidak valid!' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Sesi kedaluwarsa. Silakan login kembali.' });
  }
};

const requireSuperadmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') next();
  else res.status(403).json({ success: false, message: 'Hak akses Superadmin diperlukan!' });
};

// ----------------------------------------------------
// 1. AUTHENTICATION & USERS
// ----------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Username atau password salah!' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    const isPlainMatch = user.password === password;

    if (!isMatch && !isPlainMatch) return res.status(401).json({ success: false, message: 'Username atau password salah!' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { name, username, password, role } = req.body;
  try {
    const [exist] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (exist.length > 0) return res.status(400).json({ success: false, message: 'Username sudah digunakan!' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', [name, username, hashedPassword, role || 'admin']);
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, username, role, created_at FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', verifyToken, requireSuperadmin, async (req, res) => {
  const { name, username, password, role } = req.body;
  try {
    const [exist] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (exist.length > 0) return res.status(400).json({ success: false, message: 'Username sudah digunakan!' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', [name, username, hashedPassword, role || 'admin']);
    res.json({ id: result.insertId, name, username, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', verifyToken, requireSuperadmin, async (req, res) => {
  const { id } = req.params;
  const { name, username, password, role } = req.body;
  try {
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET name = ?, username = ?, password = ?, role = ? WHERE id = ?', [name, username, hashedPassword, role, id]);
    } else {
      await pool.query('UPDATE users SET name = ?, username = ?, role = ? WHERE id = ?', [name, username, role, id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 2. INGREDIENTS
// ----------------------------------------------------
app.get('/api/ingredients', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ingredients ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ingredients', verifyToken, requireSuperadmin, async (req, res) => {
  const { name, price, size, unit } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO ingredients (name, price, size, unit) VALUES (?, ?, ?, ?)', [name, price, size, unit]);
    res.json({ id: result.insertId, name, price, size, unit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/ingredients/:id', verifyToken, requireSuperadmin, async (req, res) => {
  const { id } = req.params;
  const { name, price, size, unit } = req.body;
  try {
    await pool.query('UPDATE ingredients SET name = ?, price = ?, size = ?, unit = ? WHERE id = ?', [name, price, size, unit, id]);
    res.json({ id: Number(id), name, price, size, unit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/ingredients/:id', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM ingredients WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. MENUS & RECIPES
// ----------------------------------------------------
app.get('/api/menus', verifyToken, async (req, res) => {
  try {
    const [menus] = await pool.query('SELECT * FROM menus ORDER BY id ASC');
    const [recipes] = await pool.query('SELECT * FROM menu_recipes');
    const combined = menus.map(m => ({
      ...m,
      recipe: recipes.filter(r => r.menu_id === m.id).map(r => ({ ingredientId: r.ingredient_id, amount: Number(r.amount) }))
    }));
    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menus', verifyToken, async (req, res) => {
  const { name, customPrice } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO menus (name, customPrice) VALUES (?, ?)', [name, customPrice || 35000]);
    res.json({ id: result.insertId, name, customPrice: customPrice || 35000, recipe: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menus/:id/price', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE menus SET customPrice = ? WHERE id = ?', [req.body.customPrice, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menus/:id', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM menus WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menus/:id/recipe', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { ingredientId, amount } = req.body;
  try {
    await pool.query(`INSERT INTO menu_recipes (menu_id, ingredient_id, amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE amount = ?`, [id, ingredientId, amount, amount]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menus/:menuId/recipe/:ingredientId', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM menu_recipes WHERE menu_id = ? AND ingredient_id = ?', [req.params.menuId, req.params.ingredientId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. POS (POINT OF SALE) DENGAN DISKON/VOUCHER
// ----------------------------------------------------
app.post('/api/orders', verifyToken, async (req, res) => {
  const { customerName, paymentMethod, items, paidAmount, discountType, discountValue, discountAmount } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Keranjang pesanan kosong!' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let subtotalAmount = 0;
    let totalCost = 0;
    for (const item of items) {
      subtotalAmount += Number(item.price) * Number(item.qty);
      totalCost += Number(item.cost || 0) * Number(item.qty);
    }

    const discAmt = Math.max(0, Math.min(Number(discountAmount) || 0, subtotalAmount));
    const finalTotalAmount = Math.max(0, subtotalAmount - discAmt);

    const changeAmount = Number(paidAmount) - finalTotalAmount;
    if (changeAmount < 0 && paymentMethod === 'cash') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Uang pembayaran kurang!' });
    }

    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `INV-${dateStr}-${randomSuffix}`;

    const [orderRes] = await conn.query(
      `INSERT INTO orders (order_number, user_id, customer_name, payment_method, subtotal, discount_type, discount_value, discount_amount, total_amount, total_cost, paid_amount, change_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [
        orderNumber,
        req.user.id,
        customerName || 'Pelanggan',
        paymentMethod || 'cash',
        subtotalAmount,
        discountType || 'none',
        Number(discountValue) || 0,
        discAmt,
        finalTotalAmount,
        totalCost,
        paidAmount || finalTotalAmount,
        changeAmount > 0 ? changeAmount : 0
      ]
    );

    const orderId = orderRes.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, menu_id, menu_name, price, cost, qty, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.id, item.name, item.price, item.cost || 0, item.qty, Number(item.price) * Number(item.qty)]
      );
    }

    await conn.commit();

    res.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        customerName: customerName || 'Pelanggan',
        paymentMethod,
        subtotal: subtotalAmount,
        discountType: discountType || 'none',
        discountValue: Number(discountValue) || 0,
        discountAmount: discAmt,
        totalAmount: finalTotalAmount,
        totalCost,
        paidAmount: paidAmount || finalTotalAmount,
        changeAmount: changeAmount > 0 ? changeAmount : 0,
        items,
        cashier: req.user.username,
        date: new Date()
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.name as cashier_name 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       ORDER BY o.id DESC LIMIT 100`
    );

    const [items] = await pool.query(`SELECT * FROM order_items`);

    const fullOrders = orders.map(o => ({
      ...o,
      items: items.filter(it => it.order_id === o.id)
    }));

    res.json(fullOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/summary', verifyToken, async (req, res) => {
  try {
    const [summaryRows] = await pool.query(
      `SELECT 
        COUNT(id) as total_transactions,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(total_amount - total_cost), 0) as total_gross_profit
       FROM orders WHERE status = 'completed'`
    );

    const [topMenus] = await pool.query(
      `SELECT menu_name, SUM(qty) as total_qty, SUM(subtotal) as total_sales
       FROM order_items 
       GROUP BY menu_name 
       ORDER BY total_qty DESC LIMIT 5`
    );

    res.json({
      summary: summaryRows[0],
      topMenus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5. MODUL BELANJA / EXPENSES (SUPERADMIN ONLY)
// ----------------------------------------------------
app.get('/api/purchases', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.name as recorded_by, i.name as ingredient_name 
       FROM purchases p 
       LEFT JOIN users u ON p.created_by = u.id 
       LEFT JOIN ingredients i ON p.ingredient_id = i.id 
       ORDER BY p.purchase_date DESC, p.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', verifyToken, requireSuperadmin, async (req, res) => {
  const { purchaseDate, ingredientId, itemName, category, qty, unit, unitPrice, totalAmount, supplier, notes, updateMasterPrice } = req.body;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO purchases (purchase_date, ingredient_id, item_name, category, qty, unit, unit_price, total_amount, supplier, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        purchaseDate || new Date().toISOString().slice(0, 10),
        ingredientId ? parseInt(ingredientId) : null,
        itemName,
        category || 'Bahan Baku',
        parseFloat(qty) || 1,
        unit || 'unit',
        parseFloat(unitPrice) || 0,
        parseFloat(totalAmount) || (parseFloat(qty) * parseFloat(unitPrice)),
        supplier || '-',
        notes || '',
        req.user.id
      ]
    );

    if (updateMasterPrice && ingredientId) {
      await conn.query(
        `UPDATE ingredients SET price = ? WHERE id = ?`,
        [parseFloat(unitPrice) || parseFloat(totalAmount), parseInt(ingredientId)]
      );
    }

    await conn.commit();
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.put('/api/purchases/:id', verifyToken, requireSuperadmin, async (req, res) => {
  const { id } = req.params;
  const { purchaseDate, ingredientId, itemName, category, qty, unit, unitPrice, totalAmount, supplier, notes } = req.body;
  try {
    await pool.query(
      `UPDATE purchases 
       SET purchase_date = ?, ingredient_id = ?, item_name = ?, category = ?, qty = ?, unit = ?, unit_price = ?, total_amount = ?, supplier = ?, notes = ?
       WHERE id = ?`,
      [
        purchaseDate,
        ingredientId ? parseInt(ingredientId) : null,
        itemName,
        category,
        parseFloat(qty),
        unit,
        parseFloat(unitPrice),
        parseFloat(totalAmount),
        supplier,
        notes,
        id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/purchases/:id', verifyToken, requireSuperadmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM purchases WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/cashflow-comparison', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const [salesRow] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_omset FROM orders WHERE status = 'completed'`
    );
    const [expenseRow] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_expense FROM purchases`
    );

    const totalOmset = parseFloat(salesRow[0].total_omset);
    const totalExpense = parseFloat(expenseRow[0].total_expense);
    const netCashflow = totalOmset - totalExpense;

    res.json({
      totalOmset,
      totalExpense,
      netCashflow
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Coffee POS & HPP REST API Server running on port ${PORT}`);
});