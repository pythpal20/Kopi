import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Coffee,
  Package,
  DollarSign,
  Layers,
  X,
  Check,
  Lock,
  User,
  LogOut,
  ShieldCheck,
  UserPlus,
  ShieldAlert,
  Calculator,
  Database,
  Search,
  Printer,
  Users,
  Loader2,
  Menu as MenuIcon,
  KeyRound,
  ShoppingCart,
  Receipt,
  BarChart3,
  TrendingUp,
  CreditCard,
  QrCode,
  Banknote,
  Minus,
  CheckCircle2,
} from "lucide-react";

const API_URL = "http://localhost:5001/api";

export default function App() {
  // ----------------------------------------------------
  // 1. AUTHENTICATION & JWT STATE
  // ----------------------------------------------------
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("kopi_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("kopi_token") || null);
  const [authMode, setAuthMode] = useState("login");

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", username: "", password: "", role: "admin" });
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // ----------------------------------------------------
  // 2. NAVIGASI TAB UTAMA
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState("pos"); // "pos" | "history" | "calculator" | "database" | "users"
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ----------------------------------------------------
  // 3. MASTER DATA DARI MYSQL
  // ----------------------------------------------------
  const [ingredients, setIngredients] = useState([]);
  const [menus, setMenus] = useState([]);
  const [userList, setUserList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Form Filter & CRUD States
  const [searchQuery, setSearchQuery] = useState("");
  const [ingForm, setIngForm] = useState({ name: "", price: "", size: "", unit: "gr" });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [recipeForm, setRecipeForm] = useState({ ingredientId: "", amount: "" });

  // State User Management (Superadmin)
  const [userForm, setUserForm] = useState({ name: "", username: "", password: "", role: "admin" });
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userMsg, setUserMsg] = useState({ type: "", text: "" });

  // ----------------------------------------------------
  // 4. POS KASIR STATE
  // ----------------------------------------------------
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "qris" | "transfer"
  const [paidAmount, setPaidAmount] = useState("");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // ----------------------------------------------------
  // FETCH ALL DATA
  // ----------------------------------------------------
  const fetchIngredients = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/ingredients`, { headers: getAuthHeaders() });
      if (res.status === 401 || res.status === 403) return handleLogout();
      const data = await res.json();
      setIngredients(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setRecipeForm((prev) => ({ ...prev, ingredientId: prev.ingredientId || data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/menus`, { headers: getAuthHeaders() });
      if (res.status === 401 || res.status === 403) return handleLogout();
      const data = await res.json();
      if (Array.isArray(data)) {
        setMenus(data);
        if (data.length > 0) {
          setActiveMenuId((prev) => (data.some((m) => m.id === prev) ? prev : data[0].id));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/orders`, { headers: getAuthHeaders() });
      const data = await res.json();
      setOrdersList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/reports/summary`, { headers: getAuthHeaders() });
      const data = await res.json();
      setReportSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    if (!token || currentUser?.role !== "superadmin") return;
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
      const data = await res.json();
      setUserList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllData = async () => {
    setIsLoadingData(true);
    await Promise.all([fetchIngredients(), fetchMenus(), fetchOrders(), fetchReports()]);
    if (currentUser?.role === "superadmin") await fetchUsers();
    setIsLoadingData(false);
  };

  useEffect(() => {
    if (currentUser && token) {
      loadAllData();
    }
  }, [currentUser, token]);

  // ----------------------------------------------------
  // AUTHENTICATION HANDLERS
  // ----------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsLoadingAuth(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem("kopi_token", data.token);
        localStorage.setItem("kopi_user", JSON.stringify(data.user));
        setLoginForm({ username: "", password: "" });
      } else {
        setAuthError(data.message || "Username atau password salah!");
      }
    } catch (err) {
      setAuthError("Server backend MySQL belum berjalan!");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!registerForm.name || !registerForm.username || !registerForm.password) {
      return setAuthError("Semua kolom wajib diisi!");
    }
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthSuccess("Registrasi berhasil! Silakan login.");
        setRegisterForm({ name: "", username: "", password: "", role: "admin" });
        setAuthMode("login");
      } else {
        setAuthError(data.message || "Registrasi gagal");
      }
    } catch (err) {
      setAuthError("Server backend MySQL belum berjalan!");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("kopi_token");
    localStorage.removeItem("kopi_user");
    setActiveTab("pos");
    setIsSidebarOpen(false);
    setCart([]);
  };

  // ----------------------------------------------------
  // HITUNG HPP ITEM MENU
  // ----------------------------------------------------
  const calculateMenuHPP = (menu) => {
    if (!menu || !Array.isArray(menu.recipe)) return 0;
    return menu.recipe.reduce((total, item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (!ing) return total;
      const unitCost = Number(ing.price) / Number(ing.size);
      return total + unitCost * Number(item.amount);
    }, 0);
  };

  // ----------------------------------------------------
  // POS CART & TRANSACTION LOGIC
  // ----------------------------------------------------
  const addToCart = (menu) => {
    const existing = cart.find((item) => item.id === menu.id);
    const itemCost = calculateMenuHPP(menu);
    if (existing) {
      setCart(cart.map((it) => (it.id === menu.id ? { ...it, qty: it.qty + 1 } : it)));
    } else {
      setCart([...cart, { id: menu.id, name: menu.name, price: Number(menu.customPrice) || 0, cost: itemCost, qty: 1 }]);
    }
  };

  const updateCartQty = (id, delta) => {
    setCart(
      cart
        .map((it) => {
          if (it.id === id) {
            const newQty = it.qty + delta;
            return newQty > 0 ? { ...it, qty: newQty } : null;
          }
          return it;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((it) => it.id !== id));
  };

  const cartSubtotal = cart.reduce((sum, it) => sum + it.price * it.qty, 0);
  const cartCostTotal = cart.reduce((sum, it) => sum + it.cost * it.qty, 0);
  const cartProfitEst = cartSubtotal - cartCostTotal;

  const openCheckoutModal = () => {
    if (cart.length === 0) return alert("Keranjang pesanan masih kosong!");
    setPaidAmount(cartSubtotal.toString());
    setIsCheckoutModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    const paidNum = Number(paidAmount) || cartSubtotal;
    if (paymentMethod === "cash" && paidNum < cartSubtotal) {
      return alert("Nominal uang pembayaran kurang!");
    }

    setIsProcessingPayment(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          customerName: customerName.trim() || "Pelanggan",
          paymentMethod,
          items: cart,
          paidAmount: paymentMethod === "cash" ? paidNum : cartSubtotal,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCompletedOrder(data.order);
        setCart([]);
        setCustomerName("");
        setIsCheckoutModalOpen(false);
        fetchOrders();
        fetchReports();
      } else {
        alert(data.message || "Gagal memproses transaksi!");
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi ke server!");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // ----------------------------------------------------
  // INGREDIENTS & MENU CRUD HANDLERS
  // ----------------------------------------------------
  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== "superadmin") return;
    try {
      const res = await fetch(`${API_URL}/ingredients`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: ingForm.name,
          price: parseFloat(ingForm.price),
          size: parseFloat(ingForm.size),
          unit: ingForm.unit,
        }),
      });
      if (res.ok) {
        setIngForm({ name: "", price: "", size: "", unit: "gr" });
        fetchIngredients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteIngredient = async (id) => {
    if (currentUser?.role !== "superadmin") return;
    if (window.confirm("Yakin ingin menghapus bahan ini? Data resep menu terkait juga akan terhapus.")) {
      try {
        const res = await fetch(`${API_URL}/ingredients/${id}`, { method: "DELETE", headers: getAuthHeaders() });
        if (res.ok) {
          fetchIngredients();
          fetchMenus();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveEditIngredient = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== "superadmin") return;
    try {
      const res = await fetch(`${API_URL}/ingredients/${editingIngredient.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editingIngredient.name,
          price: parseFloat(editingIngredient.price),
          size: parseFloat(editingIngredient.size),
          unit: editingIngredient.unit,
        }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingIngredient(null);
        fetchIngredients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMenu = async (e) => {
    e.preventDefault();
    if (!newMenuName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/menus`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newMenuName, customPrice: 35000 }),
      });
      const newMenu = await res.json();
      if (res.ok) {
        setNewMenuName("");
        await fetchMenus();
        if (newMenu && newMenu.id) setActiveMenuId(newMenu.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMenu = async (id) => {
    if (currentUser?.role !== "superadmin") return;
    if (menus.length <= 1) return alert("Minimal harus ada 1 menu!");
    if (window.confirm("Hapus menu ini beserta seluruh resepnya?")) {
      try {
        const res = await fetch(`${API_URL}/menus/${id}`, { method: "DELETE", headers: getAuthHeaders() });
        if (res.ok) {
          const rem = menus.filter((m) => m.id !== id);
          if (rem.length > 0) setActiveMenuId(rem[0].id);
          fetchMenus();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddRecipeItem = async (e) => {
    e.preventDefault();
    if (!activeMenuId || !recipeForm.amount || parseFloat(recipeForm.amount) <= 0) return;
    const ingId = recipeForm.ingredientId || (ingredients[0] && ingredients[0].id);
    try {
      const res = await fetch(`${API_URL}/menus/${activeMenuId}/recipe`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ingredientId: parseInt(ingId), amount: parseFloat(recipeForm.amount) }),
      });
      if (res.ok) {
        setRecipeForm({ ...recipeForm, amount: "" });
        fetchMenus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecipeItem = async (ingId) => {
    try {
      const res = await fetch(`${API_URL}/menus/${activeMenuId}/recipe/${ingId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) fetchMenus();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomPriceChange = async (val) => {
    if (!activeMenuId) return;
    const newPrice = parseFloat(val) || 0;
    setMenus((prev) => prev.map((m) => (m.id === activeMenuId ? { ...m, customPrice: newPrice } : m)));
    try {
      await fetch(`${API_URL}/menus/${activeMenuId}/price`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ customPrice: newPrice }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // User CRUD Handlers
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (res.ok) {
        setUserMsg({ type: "success", text: `User ${userForm.name} berhasil ditambahkan!` });
        setUserForm({ name: "", username: "", password: "", role: "admin" });
        fetchUsers();
      } else {
        setUserMsg({ type: "error", text: data.message || "Gagal menambah user" });
      }
    } catch (err) {
      setUserMsg({ type: "error", text: "Koneksi server gagal!" });
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (id === currentUser.id) return alert("Tidak dapat menghapus akun sendiri!");
    if (window.confirm(`Hapus user "${name}"?`)) {
      try {
        const res = await fetch(`${API_URL}/users/${id}`, { method: "DELETE", headers: getAuthHeaders() });
        if (res.ok) fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/users/${editingUser.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editingUser.name,
          username: editingUser.username,
          password: editingUser.password,
          role: editingUser.role,
        }),
      });
      if (res.ok) {
        setIsEditUserModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Kalkulasi HPP Menu Terpilih di Tab Calculator
  const activeMenu = menus.find((m) => m.id === activeMenuId) || menus[0] || null;
  const totalHPP = calculateMenuHPP(activeMenu);
  const roundThousand = (val) => Math.ceil(val / 1000) * 1000;
  const price30 = totalHPP > 0 ? roundThousand(totalHPP / 0.3) : 0;
  const price35 = totalHPP > 0 ? roundThousand(totalHPP / 0.35) : 0;
  const price40 = totalHPP > 0 ? roundThousand(totalHPP / 0.4) : 0;
  const priceOjol = price35 > 0 ? roundThousand(price35 / 0.8) : 0;
  const customPriceVal = activeMenu?.customPrice || 0;
  const customProfit = customPriceVal - totalHPP;
  const customMargin = customPriceVal > 0 ? (customProfit / customPriceVal) * 100 : 0;
  const customFC = customPriceVal > 0 ? (totalHPP / customPriceVal) * 100 : 0;

  const isSuperadmin = currentUser?.role === "superadmin";

  // ----------------------------------------------------
  // LAYAR LOGIN JIKA BELUM TERAUTENTIKASI
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-amber-100 rounded-2xl text-amber-600 mb-1">
              <Coffee className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Sistem POS & HPP Kopi</h1>
          </div>

          {authError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2"><ShieldAlert className="w-4 h-4 shrink-0" /><span>{authError}</span></div>}
          {authSuccess && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center space-x-2"><Check className="w-4 h-4 shrink-0" /><span>{authSuccess}</span></div>}

          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input type="text" required placeholder="Masukkan username" className="w-full pl-9 pr-3 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-xs" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input type="password" required placeholder="Masukkan password" className="w-full pl-9 pr-3 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-xs" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
              </div>

              <button type="submit" disabled={isLoadingAuth} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center space-x-2">
                {isLoadingAuth ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Masuk Kasir & Dashboard</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">Nama Lengkap</label>
                <input type="text" required placeholder="Nama Lengkap" className="w-full p-2.5 border rounded-xl text-xs" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">Username</label>
                <input type="text" required placeholder="Username login" className="w-full p-2.5 border rounded-xl text-xs" value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">Password</label>
                <input type="password" required placeholder="Password akun" className="w-full p-2.5 border rounded-xl text-xs" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">User Access</label>
                <select className="w-full p-2.5 border rounded-xl bg-white text-xs" value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}>
                  <option value="admin">admin (Kasir, Resep & Menu)</option>
                  <option value="superadmin">Superadmin (Akses Penuh CRUD)</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center space-x-1"><UserPlus className="w-4 h-4" /> <span>Daftarkan Akun</span></button>
              <div className="pt-2 text-center text-xs text-slate-500">
                Sudah punya akun? <button type="button" onClick={() => setAuthMode("login")} className="text-amber-600 font-bold hover:underline">Kembali ke Login</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // DASHBOARD & SISTEM POS LENGKAP
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased">
      {/* 1. BACKDROP MOBILE */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden" />
      )}

      {/* 2. SIDEBAR NAVIGATION */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col justify-between shadow-2xl transition-transform duration-300 print:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div>
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-600 rounded-xl text-white shadow-md">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-black text-base tracking-tight text-white leading-tight">Coffee POS & HPP</h1>
                <p className="text-[10px] text-slate-400">Point of Sale System</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="px-4 py-6 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Modul Penjualan</div>

            <button
              onClick={() => { setActiveTab("pos"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold transition ${activeTab === "pos" ? "bg-amber-600 text-white shadow-md" : "text-slate-300 hover:text-white hover:bg-slate-800/70"}`}
            >
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-4 h-4" />
                <span>Kasir (Point of Sale)</span>
              </div>
              {cart.length > 0 && <span className="bg-white text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-black">{cart.length}</span>}
            </button>

            <button
              onClick={() => { setActiveTab("history"); setIsSidebarOpen(false); fetchOrders(); fetchReports(); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold transition ${activeTab === "history" ? "bg-amber-600 text-white shadow-md" : "text-slate-300 hover:text-white hover:bg-slate-800/70"}`}
            >
              <div className="flex items-center space-x-3">
                <Receipt className="w-4 h-4" />
                <span>Riwayat & Laporan Omset</span>
              </div>
            </button>

            <div className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Master & HPP</div>

            <button
              onClick={() => { setActiveTab("calculator"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold transition ${activeTab === "calculator" ? "bg-amber-600 text-white shadow-md" : "text-slate-300 hover:text-white hover:bg-slate-800/70"}`}
            >
              <div className="flex items-center space-x-3">
                <Calculator className="w-4 h-4" />
                <span>Kalkulator HPP & Resep</span>
              </div>
              <span className="text-[10px] bg-slate-950/40 px-2 py-0.5 rounded-full font-bold">{menus.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab("database"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold transition ${activeTab === "database" ? "bg-amber-600 text-white shadow-md" : "text-slate-300 hover:text-white hover:bg-slate-800/70"}`}
            >
              <div className="flex items-center space-x-3">
                <Database className="w-4 h-4" />
                <span>Database Bahan Baku</span>
              </div>
              <span className="text-[10px] bg-slate-950/40 px-2 py-0.5 rounded-full font-bold">{ingredients.length}</span>
            </button>

            {isSuperadmin && (
              <button
                onClick={() => { setActiveTab("users"); setIsSidebarOpen(false); fetchUsers(); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold transition ${activeTab === "users" ? "bg-amber-600 text-white shadow-md" : "text-slate-300 hover:text-white hover:bg-slate-800/70"}`}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4" />
                  <span>Kelola User Staf</span>
                </div>
                <span className="text-[10px] bg-slate-950/40 px-2 py-0.5 rounded-full font-bold">{userList.length}</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] uppercase font-semibold text-amber-400">{currentUser.role}</div>
              </div>
            </div>
            <button onClick={handleLogout} title="Logout" className="p-2 bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white rounded-xl transition shrink-0 ml-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 3. CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72 min-h-screen">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs print:hidden">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700">
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base md:text-xl font-extrabold text-slate-900 tracking-tight">
                {activeTab === "pos" && "Point of Sale (Samora Coffee)"}
                {activeTab === "history" && "Laporan Penjualan & Riwayat Kasir"}
                {activeTab === "calculator" && "Kalkulator HPP & Resep Menu"}
                {activeTab === "database" && "Database Master Bahan Baku"}
                {activeTab === "users" && "Manajemen Pengguna Aplikasi"}
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">Sistem POS Terintegrasi Perhitungan HPP Real-time</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-emerald-800 bg-emerald-50 border border-emerald-200 font-semibold text-[11px]">
              <KeyRound className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Live
            </span>
          </div>
        </header>

        {/* TEMPLATE PRINT RECEIPT STRUK THERMAL (58mm/80mm) */}
        <div className="hidden print:block p-4 bg-white text-black font-mono text-xs max-w-xs mx-auto">
          {completedOrder && (
            <div className="text-center space-y-2">
              <div className="text-sm font-black uppercase">Samora Coffee</div>
              <div className="text-[10px]">KoRea (Kopo Area) | Telp: 0812-1409-8020</div>
              <div className="border-t border-b border-dashed border-black py-1 text-[10px] text-left">
                <div>No: {completedOrder.orderNumber}</div>
                <div>Kasir: {completedOrder.cashier}</div>
                <div>Tgl: {new Date(completedOrder.date).toLocaleString("id-ID")}</div>
                <div>Pelanggan: {completedOrder.customerName}</div>
              </div>

              <div className="py-2 text-left space-y-1">
                {completedOrder.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <div>{it.qty}x {it.name}</div>
                    <div>Rp {(it.price * it.qty).toLocaleString("id-ID")}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-black pt-2 space-y-1 text-right font-bold">
                <div className="flex justify-between"><span>TOTAL:</span><span>Rp {completedOrder.totalAmount.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between font-normal text-[11px]"><span>Bayar ({completedOrder.paymentMethod.toUpperCase()}):</span><span>Rp {completedOrder.paidAmount.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between font-normal text-[11px]"><span>Kembali:</span><span>Rp {completedOrder.changeAmount.toLocaleString("id-ID")}</span></div>
              </div>

              <div className="border-t border-dashed border-black pt-3 text-[10px] text-center">
                <div>Terima Kasih Atas Pesanan Anda!</div>
                <div>Have a good mood with samora coffee ☕</div>
              </div>
            </div>
          )}
        </div>

        {/* MAIN BODY PAGES */}
        <main className="flex-1 p-4 md:p-8 space-y-6 print:hidden">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              <span className="text-sm font-semibold text-slate-600">Memuat data dari database...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: POS (POINT OF SALE KASIR) */}
              {activeTab === "pos" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Grid Menu Produk */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-800">Katalog Menu Kopi</div>
                      <span className="text-xs text-slate-500">{menus.length} Varian Tersedia</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {menus.map((m) => {
                        const hppVal = calculateMenuHPP(m);
                        const priceVal = Number(m.customPrice) || 0;
                        const marginPct = priceVal > 0 ? ((priceVal - hppVal) / priceVal) * 100 : 0;
                        return (
                          <div key={m.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3">
                            <div>
                              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3">
                                <Coffee className="w-5 h-5" />
                              </div>
                              <h3 className="font-extrabold text-base text-slate-800">{m.name}</h3>
                              <div className="text-xs text-slate-400 mt-0.5">HPP Modal: Rp {Math.round(hppVal).toLocaleString("id-ID")}</div>
                            </div>

                            <div>
                              <div className="flex justify-between items-baseline mb-3">
                                <span className="text-lg font-black text-slate-900">Rp {priceVal.toLocaleString("id-ID")}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  +{marginPct.toFixed(0)}% Margin
                                </span>
                              </div>

                              <button
                                onClick={() => addToCart(m)}
                                className="w-full bg-slate-900 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center space-x-1 text-xs"
                              >
                                <Plus className="w-4 h-4" /> <span>Pesan / Tambah</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cart Drawer Kasir */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="w-5 h-5 text-amber-600" />
                          <h3 className="font-black text-base text-slate-900">Keranjang Kasir</h3>
                        </div>
                        {cart.length > 0 && (
                          <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">
                            Kosongkan
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Nama Pelanggan (Opsional)"
                        className="w-full p-2.5 border rounded-xl outline-none text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {cart.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 italic">Keranjang kosong. Klik menu untuk menambahkan pesanan.</div>
                        ) : (
                          cart.map((item) => (
                            <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                              <div className="truncate pr-2">
                                <div className="font-bold text-xs text-slate-800 truncate">{item.name}</div>
                                <div className="text-[11px] text-slate-500">Rp {item.price.toLocaleString("id-ID")}</div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-300">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black w-5 text-center">{item.qty}</span>
                                <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-300">
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Total Modal (HPP):</span>
                          <span>Rp {Math.round(cartCostTotal).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-amber-400 font-semibold">
                          <span>Estimasi Laba Bersih:</span>
                          <span>Rp {Math.round(cartProfitEst).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                          <span className="font-bold text-sm">TOTAL TAGIHAN:</span>
                          <span className="text-xl font-black text-white">Rp {cartSubtotal.toLocaleString("id-ID")}</span>
                        </div>
                      </div>

                      <button
                        onClick={openCheckoutModal}
                        disabled={cart.length === 0}
                        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold py-3 rounded-2xl transition shadow-md flex items-center justify-center space-x-2 text-sm"
                      >
                        <Banknote className="w-5 h-5" /> <span>Bayar / Checkout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RIWAYAT & LAPORAN */}
              {activeTab === "history" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-slate-500 font-bold uppercase">Total Omset Penjualan</div>
                      <div className="text-2xl font-black text-slate-900 mt-2">
                        Rp {Number(reportSummary?.summary?.total_revenue || 0).toLocaleString("id-ID")}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                        Dari {reportSummary?.summary?.total_transactions || 0} transaksi
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-slate-500 font-bold uppercase">Total Modal (HPP)</div>
                      <div className="text-2xl font-black text-amber-700 mt-2">
                        Rp {Number(reportSummary?.summary?.total_cost || 0).toLocaleString("id-ID")}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Biaya pokok bahan baku</div>
                    </div>

                    <div className="bg-emerald-600 text-white p-5 rounded-3xl shadow-md">
                      <div className="text-xs text-emerald-100 font-bold uppercase">Total Laba Bersih Kotor</div>
                      <div className="text-2xl font-black text-white mt-2">
                        Rp {Number(reportSummary?.summary?.total_gross_profit || 0).toLocaleString("id-ID")}
                      </div>
                      <div className="text-[11px] text-emerald-200 mt-1">Keuntungan bersih penjualan</div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-slate-500 font-bold uppercase">Rata-rata Margin</div>
                      <div className="text-2xl font-black text-indigo-600 mt-2">
                        {reportSummary?.summary?.total_revenue > 0
                          ? ((reportSummary.summary.total_gross_profit / reportSummary.summary.total_revenue) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Efisiensi keuntungan menu</div>
                    </div>
                  </div>

                  {reportSummary?.topMenus && reportSummary.topMenus.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center space-x-2 border-b pb-3">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                        <h3 className="font-extrabold text-base text-slate-900">5 Menu Kopi Terlaris (Top Best Seller)</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        {reportSummary.topMenus.map((m, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="text-[10px] font-bold text-amber-700 uppercase">Rank #{idx + 1}</div>
                            <div className="font-black text-sm text-slate-800 truncate mt-1">{m.menu_name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{m.total_qty} cup terjual</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center space-x-2">
                        <Receipt className="w-5 h-5 text-amber-600" />
                        <h3 className="font-extrabold text-base text-slate-900">Riwayat Struk & Transaksi Kasir</h3>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                          <tr>
                            <th className="p-3.5">No. Invoice</th>
                            <th className="p-3.5">Waktu</th>
                            <th className="p-3.5">Pelanggan</th>
                            <th className="p-3.5">Items</th>
                            <th className="p-3.5">Metode</th>
                            <th className="p-3.5">Total Tagihan</th>
                            <th className="p-3.5 text-center">Struk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ordersList.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-slate-400 italic">Belum ada riwayat transaksi.</td>
                            </tr>
                          ) : (
                            ordersList.map((ord) => (
                              <tr key={ord.id} className="hover:bg-slate-50 transition text-xs">
                                <td className="p-3.5 font-bold font-mono text-slate-800">{ord.order_number}</td>
                                <td className="p-3.5 text-slate-500">{new Date(ord.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</td>
                                <td className="p-3.5 font-semibold text-slate-700">{ord.customer_name}</td>
                                <td className="p-3.5 text-slate-600">
                                  {ord.items?.map((it) => `${it.qty}x ${it.menu_name}`).join(", ")}
                                </td>
                                <td className="p-3.5">
                                  <span className="uppercase px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border text-slate-700">
                                    {ord.payment_method}
                                  </span>
                                </td>
                                <td className="p-3.5 font-black text-slate-900">Rp {Number(ord.total_amount).toLocaleString("id-ID")}</td>
                                <td className="p-3.5 text-center">
                                  <button
                                    onClick={() => {
                                      setCompletedOrder({
                                        orderNumber: ord.order_number,
                                        customerName: ord.customer_name,
                                        paymentMethod: ord.payment_method,
                                        totalAmount: Number(ord.total_amount),
                                        paidAmount: Number(ord.paid_amount),
                                        changeAmount: Number(ord.change_amount),
                                        items: ord.items?.map(it => ({ name: it.menu_name, price: Number(it.price), qty: it.qty })) || [],
                                        cashier: ord.cashier_name || "Kasir",
                                        date: ord.created_at
                                      });
                                      setTimeout(() => window.print(), 100);
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                    title="Cetak Ulang Struk"
                                  >
                                    <Printer className="w-4 h-4 inline" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KALKULATOR HPP */}
              {activeTab === "calculator" && (
                <div className="space-y-6">
                  <div className="bg-white p-5 md:p-6 rounded-3xl shadow-xs border border-slate-200">
                    <div className="flex items-center justify-between border-b pb-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-5 h-5 text-amber-600" />
                        <h3 className="font-bold text-base md:text-lg text-slate-800">Daftar Menu Kopi</h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {menus.map((m) => (
                        <div key={m.id} className="flex items-center bg-slate-100 rounded-xl overflow-hidden border">
                          <button
                            onClick={() => setActiveMenuId(m.id)}
                            className={`px-4 py-2 font-semibold text-sm transition ${activeMenuId === m.id ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"}`}
                          >
                            {m.name}
                          </button>
                          {isSuperadmin && menus.length > 1 && (
                            <button onClick={() => handleDeleteMenu(m.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddMenu} className="flex flex-col sm:flex-row gap-2 text-sm max-w-xl">
                      <input type="text" placeholder="Nama Varian Menu Baru" className="flex-1 p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} />
                      <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition"><Plus className="w-4 h-4" /> <span>Tambah Menu</span></button>
                    </form>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-white p-5 md:p-6 rounded-3xl shadow-xs border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold text-lg text-slate-800">Resep: <span className="text-amber-700">{activeMenu ? activeMenu.name : "Pilih Menu"}</span></h3>
                      </div>

                      <form onSubmit={handleAddRecipeItem} className="flex flex-wrap gap-2 text-sm bg-slate-50 p-3.5 rounded-2xl border">
                        <select className="flex-1 min-w-[160px] p-2.5 border rounded-xl bg-white text-xs md:text-sm" value={recipeForm.ingredientId} onChange={(e) => setRecipeForm({ ...recipeForm, ingredientId: e.target.value })}>
                          {ingredients.map((ing) => (<option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>))}
                        </select>
                        <input type="number" step="any" placeholder="Takaran" className="w-28 p-2.5 border rounded-xl bg-white text-xs md:text-sm" value={recipeForm.amount} onChange={(e) => setRecipeForm({ ...recipeForm, amount: e.target.value })} />
                        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl transition text-xs md:text-sm">+ Masukkan Resep</button>
                      </form>

                      <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-100 text-slate-600">
                            <tr><th className="p-3">Bahan</th><th className="p-3">Takaran</th><th className="p-3">Biaya Satuan</th><th className="p-3">Subtotal</th><th className="p-3 text-center">Aksi</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeMenu?.recipe?.map((item) => {
                              const ing = ingredients.find((i) => i.id === item.ingredientId);
                              if (!ing) return null;
                              const unitCost = Number(ing.price) / Number(ing.size);
                              return (
                                <tr key={item.ingredientId} className="hover:bg-slate-50 text-xs md:text-sm">
                                  <td className="p-3 font-medium">{ing.name}</td>
                                  <td className="p-3">{item.amount} {ing.unit}</td>
                                  <td className="p-3 text-xs text-slate-500">Rp {unitCost.toFixed(1)}/{ing.unit}</td>
                                  <td className="p-3 font-semibold">Rp {Math.round(unitCost * item.amount).toLocaleString("id-ID")}</td>
                                  <td className="p-3 text-center">
                                    <button onClick={() => handleDeleteRecipeItem(item.ingredientId)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline" /></button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-amber-900">Total HPP per Cup:</span>
                        <span className="text-2xl font-black text-amber-800">Rp {Math.round(totalHPP).toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 space-y-4">
                        <h3 className="font-bold text-lg text-slate-800">Rekomendasi Harga Jual</h3>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-slate-50 border rounded-2xl p-3"><div className="text-[11px] text-slate-500">Target 30%</div><div className="text-base font-extrabold mt-1">Rp {price30.toLocaleString("id-ID")}</div></div>
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3"><div className="text-[11px] text-amber-800 font-bold">Target 35%</div><div className="text-base font-extrabold text-amber-900 mt-1">Rp {price35.toLocaleString("id-ID")}</div></div>
                          <div className="bg-slate-50 border rounded-2xl p-3"><div className="text-[11px] text-slate-500">Target 40%</div><div className="text-base font-extrabold mt-1">Rp {price40.toLocaleString("id-ID")}</div></div>
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3"><div className="text-[11px] text-emerald-800 font-bold">Ojol (+20%)</div><div className="text-base font-extrabold text-emerald-900 mt-1">Rp {priceOjol.toLocaleString("id-ID")}</div></div>
                        </div>

                        <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2">
                          <span className="text-xs font-semibold text-slate-300">Pasang Harga Kasir (POS)</span>
                          <input type="number" className="w-full pl-3 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm" value={activeMenu?.customPrice || ""} onChange={(e) => handleCustomPriceChange(e.target.value)} />
                          <div className="text-xs text-slate-400 flex justify-between pt-1"><span>Laba: Rp {Math.round(customProfit).toLocaleString("id-ID")}</span><span>Margin: {customMargin.toFixed(1)}%</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DATABASE BAHAN BAKU */}
              {activeTab === "database" && (
                <div className="space-y-6">
                  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-200 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Database Master Bahan Baku</h3>
                        <p className="text-xs text-slate-500">Harga beli supplier dan satuan master.</p>
                      </div>
                      <input type="text" placeholder="Cari bahan..." className="p-2.5 border rounded-xl text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>

                    {isSuperadmin && (
                      <form onSubmit={handleAddIngredient} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm bg-slate-50 p-5 rounded-2xl border">
                        <input type="text" placeholder="Nama Bahan" required className="lg:col-span-2 p-2.5 border rounded-xl bg-white" value={ingForm.name} onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })} />
                        <input type="number" placeholder="Harga Beli (Rp)" required className="p-2.5 border rounded-xl bg-white" value={ingForm.price} onChange={(e) => setIngForm({ ...ingForm, price: e.target.value })} />
                        <div className="flex space-x-2">
                          <input type="number" placeholder="Isi" required className="w-2/3 p-2.5 border rounded-xl bg-white" value={ingForm.size} onChange={(e) => setIngForm({ ...ingForm, size: e.target.value })} />
                          <select className="w-1/3 p-2.5 border rounded-xl bg-white" value={ingForm.unit} onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}>
                            <option value="gr">gr</option><option value="ml">ml</option><option value="set">set</option><option value="porsi">porsi</option>
                          </select>
                        </div>
                        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl">+ Tambah Bahan</button>
                      </form>
                    )}

                    <div className="overflow-x-auto rounded-2xl border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                          <tr><th className="p-3.5">Nama Bahan</th><th className="p-3.5">Harga Beli</th><th className="p-3.5">Isi</th><th className="p-3.5">Biaya/Satuan</th>{isSuperadmin && <th className="p-3.5 text-center">Aksi</th>}</tr>
                        </thead>
                        <tbody className="divide-y">
                          {ingredients.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map((ing) => (
                            <tr key={ing.id} className="hover:bg-slate-50 text-xs md:text-sm">
                              <td className="p-3.5 font-bold text-slate-800">{ing.name}</td>
                              <td className="p-3.5 font-semibold">Rp {Number(ing.price).toLocaleString("id-ID")}</td>
                              <td className="p-3.5">{ing.size} {ing.unit}</td>
                              <td className="p-3.5 font-bold text-amber-700">Rp {(Number(ing.price) / Number(ing.size)).toFixed(2)}/{ing.unit}</td>
                              {isSuperadmin && (
                                <td className="p-3.5 text-center space-x-2">
                                  <button onClick={() => { setEditingIngredient({ ...ing }); setIsEditModalOpen(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteIngredient(ing.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: KELOLA USER (SUPERADMIN) */}
              {activeTab === "users" && isSuperadmin && (
                <div className="space-y-6">
                  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-200 space-y-6">
                    <div className="border-b pb-4">
                      <h3 className="text-xl font-bold text-slate-900">Manajemen Pengguna & Staf Kasir</h3>
                    </div>

                    {userMsg.text && (
                      <div className={`p-3 text-xs rounded-xl flex items-center space-x-2 ${userMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        <span>{userMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm bg-slate-50 p-5 rounded-2xl border">
                      <input type="text" placeholder="Nama Lengkap" required className="p-2.5 border rounded-xl bg-white" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
                      <input type="text" placeholder="Username" required className="p-2.5 border rounded-xl bg-white" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
                      <input type="password" placeholder="Password" required className="p-2.5 border rounded-xl bg-white" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                      <select className="p-2.5 border rounded-xl bg-white" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                        <option value="admin">admin (Kasir & Resep)</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                      <button type="submit" className="bg-slate-900 text-white font-bold py-2.5 rounded-xl">+ Tambah Staf</button>
                    </form>

                    <div className="overflow-x-auto rounded-2xl border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                          <tr><th className="p-3.5">Nama Staf</th><th className="p-3.5">Username</th><th className="p-3.5">Akses Role</th><th className="p-3.5 text-center">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y">
                          {userList.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 text-xs md:text-sm">
                              <td className="p-3.5 font-bold">{u.name}</td>
                              <td className="p-3.5 font-mono">{u.username}</td>
                              <td className="p-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === "superadmin" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{u.role}</span></td>
                              <td className="p-3.5 text-center space-x-2">
                                <button onClick={() => { setEditingUser({ ...u, password: "" }); setIsEditUserModalOpen(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteUser(u.id, u.name)} disabled={u.id === currentUser.id} className="p-1.5 bg-red-50 text-red-600 rounded-lg disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL CHECKOUT PEMBAYARAN */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-lg text-slate-900">Pembayaran Kasir</h3>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-2xl border text-center space-y-1">
                <div className="text-xs text-slate-500">Total Yang Harus Dibayar:</div>
                <div className="text-2xl font-black text-slate-900">Rp {cartSubtotal.toLocaleString("id-ID")}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 border ${paymentMethod === "cash" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 text-slate-700"}`}
                  >
                    <Banknote className="w-4 h-4" /> <span>Tunai (Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qris")}
                    className={`py-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 border ${paymentMethod === "qris" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 text-slate-700"}`}
                  >
                    <QrCode className="w-4 h-4" /> <span>QRIS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("transfer")}
                    className={`py-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 border ${paymentMethod === "transfer" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 text-slate-700"}`}
                  >
                    <CreditCard className="w-4 h-4" /> <span>Transfer</span>
                  </button>
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Uang Diterima (Rp)</label>
                  <input
                    type="number"
                    required
                    className="w-full p-2.5 border rounded-xl font-bold text-base outline-none focus:ring-2 focus:ring-amber-500"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPaidAmount(cartSubtotal.toString())} className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold">Uang Pas</button>
                    <button type="button" onClick={() => setPaidAmount("50000")} className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold">50.000</button>
                    <button type="button" onClick={() => setPaidAmount("100000")} className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold">100.000</button>
                  </div>

                  {Number(paidAmount) >= cartSubtotal && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex justify-between items-center text-xs font-bold">
                      <span>Kembalian:</span>
                      <span className="text-sm font-black">Rp {(Number(paidAmount) - cartSubtotal).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessingPayment}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-2xl transition flex items-center justify-center space-x-2"
              >
                {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Selesaikan & Cetak Struk</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL STRUK SELESAI TRANSAKSI */}
      {completedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900">Transaksi Berhasil!</h3>
            <div className="text-xs text-slate-500">Invoice: <span className="font-mono font-bold text-slate-800">{completedOrder.orderNumber}</span></div>

            <div className="p-4 bg-slate-50 rounded-2xl border text-left text-xs space-y-1.5">
              <div className="flex justify-between font-bold"><span>Total:</span><span>Rp {completedOrder.totalAmount.toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between text-slate-500"><span>Bayar ({completedOrder.paymentMethod.toUpperCase()}):</span><span>Rp {completedOrder.paidAmount.toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between text-emerald-700 font-bold"><span>Kembalian:</span><span>Rp {completedOrder.changeAmount.toLocaleString("id-ID")}</span></div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setCompletedOrder(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs">Tutup</button>
              <button onClick={() => window.print()} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1">
                <Printer className="w-4 h-4 text-amber-400" /> <span>Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT MASTER BAHAN */}
      {isEditModalOpen && editingIngredient && isSuperadmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg">Edit Bahan Baku</h3>
            <form onSubmit={handleSaveEditIngredient} className="space-y-3 text-sm">
              <input type="text" required className="w-full p-2.5 border rounded-xl" value={editingIngredient.name} onChange={(e) => setEditingIngredient({ ...editingIngredient, name: e.target.value })} />
              <input type="number" required className="w-full p-2.5 border rounded-xl" value={editingIngredient.price} onChange={(e) => setEditingIngredient({ ...editingIngredient, price: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" required className="p-2.5 border rounded-xl" value={editingIngredient.size} onChange={(e) => setEditingIngredient({ ...editingIngredient, size: e.target.value })} />
                <select className="p-2.5 border rounded-xl bg-white" value={editingIngredient.unit} onChange={(e) => setEditingIngredient({ ...editingIngredient, unit: e.target.value })}>
                  <option value="gr">gr</option><option value="ml">ml</option><option value="set">set</option><option value="porsi">porsi</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-slate-100 py-2.5 rounded-xl">Batal</button>
                <button type="submit" className="flex-1 bg-amber-600 text-white font-bold py-2.5 rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT USER */}
      {isEditUserModalOpen && editingUser && isSuperadmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg">Edit Pengguna Staf</h3>
            <form onSubmit={handleSaveEditUser} className="space-y-3 text-sm">
              <input type="text" required className="w-full p-2.5 border rounded-xl" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
              <input type="text" required className="w-full p-2.5 border rounded-xl" value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} />
              <input type="password" placeholder="Password Baru (Opsional)" className="w-full p-2.5 border rounded-xl" value={editingUser.password} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} />
              <select className="w-full p-2.5 border rounded-xl bg-white" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                <option value="admin">admin (Kasir & Resep)</option>
                <option value="superadmin">superadmin</option>
              </select>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="flex-1 bg-slate-100 py-2.5 rounded-xl">Batal</button>
                <button type="submit" className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}