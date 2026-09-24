import React, { useState, useEffect, useMemo } from "react";
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
  ShoppingBag,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  History,
} from "lucide-react";

const API_URL = "http://localhost:5001/api";

// Helper fungsi proteksi format tanggal & string aman
const formatDateSafe = (dateVal) => {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal).slice(0, 10);
    return d.toLocaleDateString("id-ID", { dateStyle: "medium" });
  } catch {
    return String(dateVal || "-");
  }
};

const formatDateTimeSafe = (dateVal) => {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal).slice(0, 16);
    return d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(dateVal || "-");
  }
};

const formatDateInput = (dateVal) => {
  if (!dateVal) return new Date().toISOString().slice(0, 10);
  try {
    if (typeof dateVal === "string") return dateVal.slice(0, 10);
    return new Date(dateVal).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

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
  const [activeTab, setActiveTab] = useState("pos"); // "pos" | "history" | "calculator" | "database" | "purchases" | "users"
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ----------------------------------------------------
  // 3. MASTER DATA DARI MYSQL
  // ----------------------------------------------------
  const [ingredients, setIngredients] = useState([]);
  const [menus, setMenus] = useState([]);
  const [userList, setUserList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [purchasesList, setPurchasesList] = useState([]);
  const [cashflowComparison, setCashflowComparison] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filter & Form States
  const [searchQuery, setSearchQuery] = useState("");
  const [ingSortField, setIngSortField] = useState("name");
  const [ingSortOrder, setIngSortOrder] = useState("asc");
  const [ingPage, setIngPage] = useState(1);
  const [ingRowsPerPage, setIngRowsPerPage] = useState(10);

  const [ingForm, setIngForm] = useState({ name: "", price: "", size: "", unit: "gr" });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [recipeForm, setRecipeForm] = useState({ ingredientId: "", amount: "" });

  // State Riwayat Harga Bahan Baku
  const [priceHistoryList, setPriceHistoryList] = useState([]);
  const [activeHistoryIngredient, setActiveHistoryIngredient] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // State User Management (Superadmin)
  const [userForm, setUserForm] = useState({ name: "", username: "", password: "", role: "admin" });
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userMsg, setUserMsg] = useState({ type: "", text: "" });

  // State Belanja Bahan / Pengeluaran (Superadmin)
  const [purchaseForm, setPurchaseForm] = useState({
    purchaseDate: new Date().toISOString().slice(0, 10),
    ingredientId: "",
    itemName: "",
    category: "Bahan Baku",
    qty: "1",
    unit: "unit",
    unitPrice: "",
    totalAmount: "",
    supplier: "",
    notes: "",
    updateMasterPrice: true,
  });
  const [isEditPurchaseModalOpen, setIsEditPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);

  // Filter & Sorting Tabel Belanja
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchaseStartDate, setPurchaseStartDate] = useState("");
  const [purchaseEndDate, setPurchaseEndDate] = useState("");
  const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState("all");
  const [purchaseSortField, setPurchaseSortField] = useState("purchase_date");
  const [purchaseSortOrder, setPurchaseSortOrder] = useState("desc");

  // Filter, Sorting & Pagination Tabel Riwayat Kasir
  const [orderSearchCustomer, setOrderSearchCustomer] = useState("");
  const [orderStartDate, setOrderStartDate] = useState("");
  const [orderEndDate, setOrderEndDate] = useState("");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");
  const [orderSortField, setOrderSortField] = useState("created_at");
  const [orderSortOrder, setOrderSortOrder] = useState("desc");
  const [orderPage, setOrderPage] = useState(1);
  const [orderRowsPerPage, setOrderRowsPerPage] = useState(10);

  // ----------------------------------------------------
  // 4. POS KASIR STATE
  // ----------------------------------------------------
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const isSuperadmin = currentUser?.role === "superadmin";

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

  const fetchIngredientHistory = async (ingredient) => {
    if (!token || !ingredient) return;
    setActiveHistoryIngredient(ingredient);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/ingredients/${ingredient.id}/history`, { headers: getAuthHeaders() });
      const data = await res.json();
      setPriceHistoryList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPriceHistoryList([]);
    } finally {
      setIsLoadingHistory(false);
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
    if (!token || !isSuperadmin) return;
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
      const data = await res.json();
      setUserList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPurchases = async () => {
    if (!token || !isSuperadmin) return;
    try {
      const res = await fetch(`${API_URL}/purchases`, { headers: getAuthHeaders() });
      const data = await res.json();
      setPurchasesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPurchasesList([]);
    }
  };

  const fetchCashflowComparison = async () => {
    if (!token || !isSuperadmin) return;
    try {
      const res = await fetch(`${API_URL}/reports/cashflow-comparison`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data && !data.error) {
        setCashflowComparison(data);
      } else {
        setCashflowComparison({ totalOmset: 0, totalExpense: 0, netCashflow: 0 });
      }
    } catch (err) {
      console.error(err);
      setCashflowComparison({ totalOmset: 0, totalExpense: 0, netCashflow: 0 });
    }
  };

  const loadAllData = async () => {
    setIsLoadingData(true);
    await Promise.all([fetchIngredients(), fetchMenus(), fetchOrders(), fetchReports()]);
    if (isSuperadmin) {
      await Promise.all([fetchUsers(), fetchPurchases(), fetchCashflowComparison()]);
    }
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
    setDiscountType("none");
    setDiscountValue("");
  };

  // ----------------------------------------------------
  // HITUNG HPP ITEM MENU (OTOMATIS SINKRON DENGAN HARGA BAHAN TERBARU)
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

  const calculateDiscountAmount = () => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === "percent") {
      const pct = Math.min(100, Math.max(0, val));
      return Math.round((cartSubtotal * pct) / 100);
    } else if (discountType === "fixed_price") {
      return Math.max(0, cartSubtotal - Math.max(0, val));
    } else if (discountType === "nominal") {
      return Math.min(cartSubtotal, Math.max(0, val));
    }
    return 0;
  };

  const discountAmount = calculateDiscountAmount();
  const finalCartTotal = Math.max(0, cartSubtotal - discountAmount);
  const cartProfitEst = finalCartTotal - cartCostTotal;

  const openCheckoutModal = () => {
    if (cart.length === 0) return alert("Keranjang pesanan masih kosong!");
    setPaidAmount(finalCartTotal.toString());
    setIsCheckoutModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    const paidNum = Number(paidAmount) || finalCartTotal;
    if (paymentMethod === "cash" && paidNum < finalCartTotal) {
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
          subtotal: cartSubtotal,
          discountType,
          discountValue: parseFloat(discountValue) || 0,
          discountAmount,
          totalAmount: finalCartTotal,
          paidAmount: paymentMethod === "cash" ? paidNum : finalCartTotal,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCompletedOrder(data.order);
        setCart([]);
        setCustomerName("");
        setDiscountType("none");
        setDiscountValue("");
        setIsCheckoutModalOpen(false);
        fetchOrders();
        fetchReports();
        fetchCashflowComparison();
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
  // LOGIKA SORTING, FILTERING & PAGINASI RIWAYAT KASIR
  // ----------------------------------------------------
  const handleSortOrder = (field) => {
    if (orderSortField === field) {
      setOrderSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderSortField(field);
      setOrderSortOrder("asc");
    }
    setOrderPage(1);
  };

  const resetOrderFilter = () => {
    setOrderSearchCustomer("");
    setOrderStartDate("");
    setOrderEndDate("");
    setOrderPaymentFilter("all");
    setOrderSortField("created_at");
    setOrderSortOrder("desc");
    setOrderPage(1);
  };

  const processedOrders = useMemo(() => {
    let result = [...ordersList];

    if (orderSearchCustomer.trim()) {
      const q = orderSearchCustomer.toLowerCase();
      result = result.filter(
        (o) =>
          (o.customer_name || "").toLowerCase().includes(q) ||
          (o.order_number || "").toLowerCase().includes(q)
      );
    }

    if (orderPaymentFilter !== "all") {
      result = result.filter((o) => o.payment_method === orderPaymentFilter);
    }

    if (orderStartDate) {
      result = result.filter((o) => {
        const itemDate = o.created_at ? String(o.created_at).slice(0, 10) : "";
        return itemDate >= orderStartDate;
      });
    }

    if (orderEndDate) {
      result = result.filter((o) => {
        const itemDate = o.created_at ? String(o.created_at).slice(0, 10) : "";
        return itemDate <= orderEndDate;
      });
    }

    result.sort((a, b) => {
      let aVal = a[orderSortField];
      let bVal = b[orderSortField];

      if (orderSortField === "created_at") {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else if (orderSortField === "total_amount") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return orderSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return orderSortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    ordersList,
    orderSearchCustomer,
    orderPaymentFilter,
    orderStartDate,
    orderEndDate,
    orderSortField,
    orderSortOrder,
  ]);

  const totalFilteredOrderAmount = useMemo(() => {
    return processedOrders.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
  }, [processedOrders]);

  const totalOrderPages = Math.ceil(processedOrders.length / orderRowsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * orderRowsPerPage;
    return processedOrders.slice(startIndex, startIndex + orderRowsPerPage);
  }, [processedOrders, orderPage, orderRowsPerPage]);

  // ----------------------------------------------------
  // LOGIKA SORTING & PAGINASI DATABASE MASTER BAHAN BAKU
  // ----------------------------------------------------
  const handleSortIngredient = (field) => {
    if (ingSortField === field) {
      setIngSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setIngSortField(field);
      setIngSortOrder("asc");
    }
    setIngPage(1);
  };

  const processedIngredients = useMemo(() => {
    let result = [...ingredients];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          (i.name || "").toLowerCase().includes(q) ||
          (i.unit || "").toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal = a[ingSortField];
      let bVal = b[ingSortField];

      if (ingSortField === "unitCost") {
        aVal = (Number(a.price) || 0) / (Number(a.size) || 1);
        bVal = (Number(b.price) || 0) / (Number(b.size) || 1);
      } else if (ingSortField === "price" || ingSortField === "size") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return ingSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return ingSortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [ingredients, searchQuery, ingSortField, ingSortOrder]);

  const totalIngPages = Math.ceil(processedIngredients.length / ingRowsPerPage) || 1;
  const paginatedIngredients = useMemo(() => {
    const startIndex = (ingPage - 1) * ingRowsPerPage;
    return processedIngredients.slice(startIndex, startIndex + ingRowsPerPage);
  }, [processedIngredients, ingPage, ingRowsPerPage]);

  // ----------------------------------------------------
  // INGREDIENTS & MENU CRUD HANDLERS
  // ----------------------------------------------------
  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!isSuperadmin) return;
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
    if (!isSuperadmin) return;
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
    if (!isSuperadmin) return;
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
    if (!isSuperadmin) return;
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

  // ----------------------------------------------------
  // MODUL PENCATATAN BELANJA BAHAN (SUPERADMIN ONLY)
  // ----------------------------------------------------
  const handleSelectMasterIngredient = (ingId) => {
    if (!ingId) {
      setPurchaseForm({
        ...purchaseForm,
        ingredientId: "",
        itemName: "",
        unitPrice: "",
        unit: "unit",
      });
      return;
    }
    const found = ingredients.find((i) => i.id === parseInt(ingId));
    if (found) {
      const unitP = Number(found.price) || 0;
      const q = parseFloat(purchaseForm.qty) || 1;
      setPurchaseForm({
        ...purchaseForm,
        ingredientId: found.id.toString(),
        itemName: found.name,
        unit: found.unit,
        unitPrice: unitP.toString(),
        totalAmount: (q * unitP).toString(),
      });
    }
  };

  const handlePurchaseQtyChange = (qVal) => {
    const q = parseFloat(qVal) || 0;
    const p = parseFloat(purchaseForm.unitPrice) || 0;
    setPurchaseForm({
      ...purchaseForm,
      qty: qVal,
      totalAmount: (q * p).toString(),
    });
  };

  const handlePurchasePriceChange = (pVal) => {
    const p = parseFloat(pVal) || 0;
    const q = parseFloat(purchaseForm.qty) || 0;
    setPurchaseForm({
      ...purchaseForm,
      unitPrice: pVal,
      totalAmount: (q * p).toString(),
    });
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    if (!isSuperadmin) return;
    if (!purchaseForm.itemName || !purchaseForm.totalAmount) {
      return alert("Nama barang dan nominal total belanja wajib diisi!");
    }

    try {
      const res = await fetch(`${API_URL}/purchases`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(purchaseForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Catatan belanja bahan berhasil disimpan!");
        setPurchaseForm({
          purchaseDate: new Date().toISOString().slice(0, 10),
          ingredientId: "",
          itemName: "",
          category: "Bahan Baku",
          qty: "1",
          unit: "unit",
          unitPrice: "",
          totalAmount: "",
          supplier: "",
          notes: "",
          updateMasterPrice: true,
        });
        fetchPurchases();
        fetchCashflowComparison();
        if (purchaseForm.updateMasterPrice) {
          fetchIngredients();
        }
      } else {
        alert(data.message || "Gagal mencatat belanja!");
      }
    } catch (err) {
      alert("Koneksi server gagal!");
    }
  };

  const handleDeletePurchase = async (id, name) => {
    if (!isSuperadmin) return;
    if (window.confirm(`Hapus catatan belanja "${name}"?`)) {
      try {
        const res = await fetch(`${API_URL}/purchases/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          fetchPurchases();
          fetchCashflowComparison();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveEditPurchase = async (e) => {
    e.preventDefault();
    if (!isSuperadmin || !editingPurchase) return;
    try {
      const res = await fetch(`${API_URL}/purchases/${editingPurchase.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editingPurchase),
      });
      if (res.ok) {
        setIsEditPurchaseModalOpen(false);
        setEditingPurchase(null);
        fetchPurchases();
        fetchCashflowComparison();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSortPurchase = (field) => {
    if (purchaseSortField === field) {
      setPurchaseSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setPurchaseSortField(field);
      setPurchaseSortOrder("asc");
    }
  };

  const resetPurchaseFilter = () => {
    setPurchaseSearch("");
    setPurchaseStartDate("");
    setPurchaseEndDate("");
    setPurchaseCategoryFilter("all");
    setPurchaseSortField("purchase_date");
    setPurchaseSortOrder("desc");
  };

  const processedPurchases = useMemo(() => {
    let result = [...purchasesList];

    if (purchaseSearch.trim()) {
      const q = purchaseSearch.toLowerCase();
      result = result.filter(
        (p) =>
          (p.item_name || "").toLowerCase().includes(q) ||
          (p.supplier || "").toLowerCase().includes(q) ||
          (p.notes || "").toLowerCase().includes(q)
      );
    }

    if (purchaseCategoryFilter !== "all") {
      result = result.filter((p) => p.category === purchaseCategoryFilter);
    }

    if (purchaseStartDate) {
      result = result.filter((p) => {
        const itemDate = formatDateInput(p.purchase_date);
        return itemDate >= purchaseStartDate;
      });
    }

    if (purchaseEndDate) {
      result = result.filter((p) => {
        const itemDate = formatDateInput(p.purchase_date);
        return itemDate <= purchaseEndDate;
      });
    }

    result.sort((a, b) => {
      let aVal = a[purchaseSortField];
      let bVal = b[purchaseSortField];

      if (purchaseSortField === "purchase_date") {
        aVal = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
        bVal = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
        if (isNaN(aVal)) aVal = 0;
        if (isNaN(bVal)) bVal = 0;
      } else if (purchaseSortField === "total_amount" || purchaseSortField === "unit_price" || purchaseSortField === "qty") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return purchaseSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return purchaseSortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    purchasesList,
    purchaseSearch,
    purchaseCategoryFilter,
    purchaseStartDate,
    purchaseEndDate,
    purchaseSortField,
    purchaseSortOrder,
  ]);

  const filteredPurchasesTotal = useMemo(() => {
    return processedPurchases.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
  }, [processedPurchases]);

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

  // ----------------------------------------------------
  // LAYAR LOGIN
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
            <div className="inline-flex items-center space-x-1 text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
              <KeyRound className="w-3 h-3" />
              <span>Protected JWT & MySQL</span>
            </div>
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

              <div className="pt-2 text-center text-xs text-slate-500">
                Belum punya akun? <button type="button" onClick={() => setAuthMode("register")} className="text-amber-600 font-bold hover:underline">Daftar Sekarang</button>
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">Akun Pengujian:</div>
                <div>Superadmin: <span className="font-mono text-slate-800 font-bold">superadmin</span> / <span className="font-mono">123</span></div>
                <div>Admin: <span className="font-mono text-slate-800 font-bold">admin</span> / <span className="font-mono">123</span></div>
              </div>
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
  // DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased">
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden" />
      )}

      {/* SIDEBAR NAVIGATION */}
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

            {isSuperadmin && (
              <>
                <div className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Keuangan & Belanja</div>
                <button
                  onClick={() => {
                    setActiveTab("purchases");
                    setIsSidebarOpen(false);
                    fetchPurchases();
                    fetchCashflowComparison();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold transition ${activeTab === "purchases" ? "bg-amber-600 text-white shadow-md" : "text-slate-300 hover:text-white hover:bg-slate-800/70"}`}
                >
                  <div className="flex items-center space-x-3">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Belanja & Pengeluaran</span>
                  </div>
                  <span className="text-[10px] bg-slate-950/40 px-2 py-0.5 rounded-full font-bold">{purchasesList.length}</span>
                </button>
              </>
            )}

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

      {/* CONTENT AREA */}
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
                {activeTab === "purchases" && "Pencatatan Belanja & Arus Kas Riil"}
                {activeTab === "calculator" && "Kalkulator HPP & Resep Menu"}
                {activeTab === "database" && "Database Master Bahan Baku"}
                {activeTab === "users" && "Manajemen Pengguna Aplikasi"}
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">Sistem POS Terintegrasi Perhitungan HPP & Belanja Real-time</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-emerald-800 bg-emerald-50 border border-emerald-200 font-semibold text-[11px]">
              <KeyRound className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Live
            </span>
          </div>
        </header>

        {/* PRINT THERMAL RECEIPT */}
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
                {completedOrder.subtotal && completedOrder.subtotal !== completedOrder.totalAmount && (
                  <div className="flex justify-between font-normal text-[11px]">
                    <span>Subtotal:</span>
                    <span>Rp {Number(completedOrder.subtotal).toLocaleString("id-ID")}</span>
                  </div>
                )}
                {Number(completedOrder.discountAmount) > 0 && (
                  <div className="flex justify-between font-normal text-[11px]">
                    <span>Diskon:</span>
                    <span>- Rp {Number(completedOrder.discountAmount).toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm"><span>TOTAL:</span><span>Rp {completedOrder.totalAmount.toLocaleString("id-ID")}</span></div>
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
              {/* TAB 1: POS */}
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

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
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

                      {/* Voucher / Diskon Control */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                            <Tag className="w-3.5 h-3.5 text-amber-600" />
                            <span>Voucher / Diskon Pesanan</span>
                          </div>
                          {discountType !== "none" && (
                            <button
                              type="button"
                              onClick={() => { setDiscountType("none"); setDiscountValue(""); }}
                              className="text-[10px] text-red-500 hover:underline font-semibold"
                            >
                              Hapus Diskon
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setDiscountType("percent"); setDiscountValue(discountValue || "10"); }}
                            className={`py-1.5 px-2 rounded-xl font-bold text-[11px] border transition ${discountType === "percent"
                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                          >
                            Persen (%)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDiscountType("fixed_price"); setDiscountValue(discountValue || cartSubtotal.toString()); }}
                            className={`py-1.5 px-2 rounded-xl font-bold text-[11px] border transition ${discountType === "fixed_price"
                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                          >
                            Harga Jadi (Rp)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDiscountType("nominal"); setDiscountValue(discountValue || "5000"); }}
                            className={`py-1.5 px-2 rounded-xl font-bold text-[11px] border transition ${discountType === "nominal"
                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                          >
                            Potongan (Rp)
                          </button>
                        </div>

                        {discountType !== "none" && (
                          <div className="pt-1 space-y-1">
                            <label className="block text-[10px] font-bold text-slate-600">
                              {discountType === "percent" && "Masukkan Persentase Diskon (%):"}
                              {discountType === "fixed_price" && "Masukkan Harga Jual Akhir Setelah Diskon (Rp):"}
                              {discountType === "nominal" && "Masukkan Nominal Potongan Harga (Rp):"}
                            </label>
                            <div className="flex gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max={discountType === "percent" ? 100 : undefined}
                                className="flex-1 p-2 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                                placeholder={discountType === "percent" ? "misal: 10 atau 20" : "misal: 25000"}
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                              />
                              {discountType === "percent" && (
                                <div className="flex gap-1">
                                  <button type="button" onClick={() => setDiscountValue("10")} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-[10px] font-bold">10%</button>
                                  <button type="button" onClick={() => setDiscountValue("20")} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-[10px] font-bold">20%</button>
                                  <button type="button" onClick={() => setDiscountValue("50")} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-[10px] font-bold">50%</button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Subtotal Belanja:</span>
                          <span>Rp {cartSubtotal.toLocaleString("id-ID")}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-rose-400 font-bold">
                            <span>
                              Diskon {discountType === "percent" ? `(${discountValue}%)` : ""}:
                            </span>
                            <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-400">
                          <span>Total Modal (HPP):</span>
                          <span>Rp {Math.round(cartCostTotal).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-amber-400 font-semibold">
                          <span>Estimasi Laba Bersih:</span>
                          <span>Rp {Math.round(cartProfitEst).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                          <span className="font-bold text-sm">TOTAL AKHIR:</span>
                          <span className="text-xl font-black text-white">Rp {finalCartTotal.toLocaleString("id-ID")}</span>
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

              {/* TAB 2: RIWAYAT TRANSAKSI */}
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
                      <div className="text-xs text-slate-500 font-bold uppercase">Total Modal (HPP Kasir)</div>
                      <div className="text-2xl font-black text-amber-700 mt-2">
                        Rp {Number(reportSummary?.summary?.total_cost || 0).toLocaleString("id-ID")}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Estimasi HPP item terjual</div>
                    </div>

                    <div className="bg-emerald-600 text-white p-5 rounded-3xl shadow-md">
                      <div className="text-xs text-emerald-100 font-bold uppercase">Laba Bersih Kasir</div>
                      <div className="text-2xl font-black text-white mt-2">
                        Rp {Number(reportSummary?.summary?.total_gross_profit || 0).toLocaleString("id-ID")}
                      </div>
                      <div className="text-[11px] text-emerald-200 mt-1">Keuntungan kotor kasir</div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-slate-500 font-bold uppercase">Rata-rata Margin</div>
                      <div className="text-2xl font-black text-indigo-600 mt-2">
                        {reportSummary?.summary?.total_revenue > 0
                          ? ((reportSummary.summary.total_gross_profit / reportSummary.summary.total_revenue) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Rasio margin harga menu</div>
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
                      <div className="flex items-center space-x-2">
                        <Receipt className="w-5 h-5 text-amber-600" />
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900">Riwayat Struk & Transaksi Kasir</h3>
                          <p className="text-xs text-slate-500">Klik judul kolom untuk menyortir data transaksi.</p>
                        </div>
                      </div>

                      {/* Filter Controls Bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center space-x-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
                          <input
                            type="date"
                            className="bg-transparent outline-none p-1 text-xs"
                            value={orderStartDate}
                            onChange={(e) => { setOrderStartDate(e.target.value); setOrderPage(1); }}
                            title="Dari Tanggal"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="date"
                            className="bg-transparent outline-none p-1 text-xs"
                            value={orderEndDate}
                            onChange={(e) => { setOrderEndDate(e.target.value); setOrderPage(1); }}
                            title="Sampai Tanggal"
                          />
                        </div>

                        <select
                          className="p-2 border rounded-xl text-xs bg-slate-50 focus:bg-white outline-none"
                          value={orderPaymentFilter}
                          onChange={(e) => { setOrderPaymentFilter(e.target.value); setOrderPage(1); }}
                        >
                          <option value="all">Semua Metode</option>
                          <option value="cash">Tunai (Cash)</option>
                          <option value="qris">QRIS</option>
                          <option value="transfer">Transfer</option>
                        </select>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Cari pelanggan / invoice..."
                            className="pl-8 pr-3 py-1.5 border rounded-xl text-xs w-44 sm:w-56 outline-none focus:ring-2 focus:ring-amber-500"
                            value={orderSearchCustomer}
                            onChange={(e) => { setOrderSearchCustomer(e.target.value); setOrderPage(1); }}
                          />
                        </div>

                        {(orderSearchCustomer || orderStartDate || orderEndDate || orderPaymentFilter !== "all") && (
                          <button
                            onClick={resetOrderFilter}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition flex items-center space-x-1 text-xs font-semibold"
                            title="Reset Filter"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <div className="text-slate-600">
                        Menampilkan <span className="font-bold text-slate-900">{processedOrders.length}</span> transaksi
                        {orderStartDate && orderEndDate && (
                          <span> (Periode: {orderStartDate} s/d {orderEndDate})</span>
                        )}
                        <span className="ml-2 font-bold text-slate-800">
                          | Total Omset Terfilter: <span className="font-black text-emerald-700">Rp {totalFilteredOrderAmount.toLocaleString("id-ID")}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">Tampilkan baris:</span>
                        <select
                          className="p-1.5 bg-white border border-slate-300 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500"
                          value={orderRowsPerPage}
                          onChange={(e) => {
                            setOrderRowsPerPage(Number(e.target.value));
                            setOrderPage(1);
                          }}
                        >
                          <option value={5}>5 baris</option>
                          <option value={10}>10 baris</option>
                          <option value={20}>20 baris</option>
                          <option value={50}>50 baris</option>
                          <option value={100}>100 baris</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b text-xs select-none">
                          <tr>
                            <th onClick={() => handleSortOrder("order_number")} className="p-3.5 cursor-pointer hover:bg-slate-200 transition">
                              <div className="flex items-center space-x-1">
                                <span>No. Invoice</span>
                                {orderSortField === "order_number" ? (orderSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                              </div>
                            </th>

                            <th onClick={() => handleSortOrder("created_at")} className="p-3.5 cursor-pointer hover:bg-slate-200 transition">
                              <div className="flex items-center space-x-1">
                                <span>Waktu Transaksi</span>
                                {orderSortField === "created_at" ? (orderSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                              </div>
                            </th>

                            <th onClick={() => handleSortOrder("customer_name")} className="p-3.5 cursor-pointer hover:bg-slate-200 transition">
                              <div className="flex items-center space-x-1">
                                <span>Pelanggan</span>
                                {orderSortField === "customer_name" ? (orderSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                              </div>
                            </th>

                            <th className="p-3.5">Pesanan (Items)</th>

                            <th onClick={() => handleSortOrder("payment_method")} className="p-3.5 cursor-pointer hover:bg-slate-200 transition">
                              <div className="flex items-center space-x-1">
                                <span>Metode</span>
                                {orderSortField === "payment_method" ? (orderSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                              </div>
                            </th>

                            <th onClick={() => handleSortOrder("total_amount")} className="p-3.5 cursor-pointer hover:bg-slate-200 transition">
                              <div className="flex items-center space-x-1">
                                <span>Total Tagihan</span>
                                {orderSortField === "total_amount" ? (orderSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                              </div>
                            </th>

                            <th className="p-3.5 text-center">Struk</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 text-xs">
                          {paginatedOrders.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                                Tidak ada data transaksi yang cocok dengan filter.
                              </td>
                            </tr>
                          ) : (
                            paginatedOrders.map((ord) => (
                              <tr key={ord.id} className="hover:bg-slate-50 transition">
                                <td className="p-3.5 font-bold font-mono text-slate-800 whitespace-nowrap">{ord.order_number}</td>
                                <td className="p-3.5 text-slate-500 whitespace-nowrap">{formatDateTimeSafe(ord.created_at)}</td>
                                <td className="p-3.5 font-bold text-slate-800">{ord.customer_name}</td>
                                <td className="p-3.5 text-slate-600">
                                  {ord.items?.map((it) => `${it.qty}x ${it.menu_name}`).join(", ")}
                                </td>
                                <td className="p-3.5">
                                  <span className="uppercase px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border text-slate-700">
                                    {ord.payment_method}
                                  </span>
                                </td>
                                <td className="p-3.5 font-black text-slate-900 whitespace-nowrap">
                                  Rp {Number(ord.total_amount).toLocaleString("id-ID")}
                                  {Number(ord.discount_amount) > 0 && (
                                    <div className="text-[10px] font-semibold text-rose-600">
                                      (Disc: -Rp {Number(ord.discount_amount).toLocaleString("id-ID")})
                                    </div>
                                  )}
                                </td>
                                <td className="p-3.5 text-center">
                                  <button
                                    onClick={() => {
                                      setCompletedOrder({
                                        orderNumber: ord.order_number,
                                        customerName: ord.customer_name,
                                        paymentMethod: ord.payment_method,
                                        subtotal: Number(ord.subtotal) || Number(ord.total_amount),
                                        discountAmount: Number(ord.discount_amount) || 0,
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

                    {/* PAGINATION CONTROLS */}
                    {processedOrders.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600">
                        <div>
                          Menampilkan data baris{" "}
                          <span className="font-bold text-slate-900">{(orderPage - 1) * orderRowsPerPage + 1}</span> -{" "}
                          <span className="font-bold text-slate-900">{Math.min(orderPage * orderRowsPerPage, processedOrders.length)}</span>{" "}
                          dari <span className="font-bold text-slate-900">{processedOrders.length}</span> total
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setOrderPage(1)}
                            disabled={orderPage === 1}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                            title="Halaman Pertama"
                          >
                            <ChevronsLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setOrderPage((prev) => Math.max(prev - 1, 1))}
                            disabled={orderPage === 1}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                            title="Halaman Sebelumnya"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <span className="px-3 py-1 font-bold text-slate-800">
                            Halaman {orderPage} / {totalOrderPages}
                          </span>

                          <button
                            onClick={() => setOrderPage((prev) => Math.min(prev + 1, totalOrderPages))}
                            disabled={orderPage >= totalOrderPages}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                            title="Halaman Selanjutnya"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setOrderPage(totalOrderPages)}
                            disabled={orderPage >= totalOrderPages}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                            title="Halaman Terakhir"
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MODUL BELANJA BAHAN */}
              {activeTab === "purchases" && isSuperadmin && (
                <div className="space-y-6">
                  {/* Perbandingan Omset vs Pengeluaran Riil */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center space-x-4">
                      <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                        <ArrowUpCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-bold uppercase">Total Omset Masuk</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">
                          Rp {Number(cashflowComparison?.totalOmset || 0).toLocaleString("id-ID")}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-semibold">Uang kasir terbayar</div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center space-x-4">
                      <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
                        <ArrowDownCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-bold uppercase">Total Belanja Riil</div>
                        <div className="text-2xl font-black text-red-700 mt-0.5">
                          Rp {Number(cashflowComparison?.totalExpense || 0).toLocaleString("id-ID")}
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold">Total nota belanja & operasional</div>
                      </div>
                    </div>

                    <div className={`p-5 rounded-3xl shadow-md text-white flex items-center space-x-4 ${(cashflowComparison?.netCashflow || 0) >= 0 ? "bg-slate-900" : "bg-red-900"
                      }`}>
                      <div className="p-3 bg-white/10 rounded-2xl">
                        <Scale className="w-8 h-8 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-300 font-bold uppercase">Sisa Arus Kas (Net Cashflow)</div>
                        <div className="text-2xl font-black text-white mt-0.5">
                          Rp {Number(cashflowComparison?.netCashflow || 0).toLocaleString("id-ID")}
                        </div>
                        <div className="text-[11px] text-amber-300 font-semibold">
                          {(cashflowComparison?.netCashflow || 0) >= 0 ? "Surplus (Omset > Pengeluaran)" : "Defisit (Pengeluaran > Omset)"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Pencatatan Belanja */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-5 h-5 text-amber-600" />
                        <h3 className="font-extrabold text-base md:text-lg text-slate-900">Catat Belanja Bahan / Pengeluaran Baru</h3>
                      </div>
                      <span className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded-full font-bold">Khusus Superadmin</span>
                    </div>

                    <form onSubmit={handleAddPurchase} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Belanja</label>
                        <input
                          type="date"
                          required
                          className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                          value={purchaseForm.purchaseDate}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Master Bahan Baku (Opsional)</label>
                        <select
                          className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                          value={purchaseForm.ingredientId}
                          onChange={(e) => handleSelectMasterIngredient(e.target.value)}
                        >
                          <option value="">-- Ketik Manual / Non-Master --</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>{ing.name} ({ing.size} {ing.unit})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang / Pengeluaran</label>
                        <input
                          type="text"
                          required
                          placeholder="misal: Biji Kopi Arabica / Cup 16oz / Gas"
                          className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                          value={purchaseForm.itemName}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, itemName: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                        <select
                          className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                          value={purchaseForm.category}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, category: e.target.value })}
                        >
                          <option value="Bahan Baku">Bahan Baku (Kopi/Susu/Sirup)</option>
                          <option value="Packaging">Packaging (Cup, Sedotan, Seal)</option>
                          <option value="Operasional">Operasional (Gas, Galon, Listrik)</option>
                          <option value="Lain-lain">Lain-lain</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah (Qty)</label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="1"
                            className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                            value={purchaseForm.qty}
                            onChange={(e) => handlePurchaseQtyChange(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                          <input
                            type="text"
                            placeholder="kg / botol / pcs"
                            className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                            value={purchaseForm.unit}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, unit: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Harga Satuan (Rp)</label>
                        <input
                          type="number"
                          placeholder="Harga per pcs/kg"
                          className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                          value={purchaseForm.unitPrice}
                          onChange={(e) => handlePurchasePriceChange(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Total Biaya Belanja (Rp)</label>
                        <input
                          type="number"
                          required
                          placeholder="Total Nota (Rp)"
                          className="w-full p-2.5 border rounded-xl bg-amber-50/50 font-bold text-amber-900 text-xs"
                          value={purchaseForm.totalAmount}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, totalAmount: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Toko Pembelian</label>
                        <input
                          type="text"
                          placeholder="Nama Roastery / Pasar / Toko"
                          className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                          value={purchaseForm.supplier}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                        />
                      </div>

                      <div className="lg:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                        <input
                          type="text"
                          placeholder="misal: Kemasan pouch 1kg, expired 2027"
                          className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                          value={purchaseForm.notes}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <button
                          type="submit"
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 rounded-xl transition flex items-center justify-center space-x-1 text-xs"
                        >
                          <Plus className="w-4 h-4" /> <span>Simpan Catatan Belanja</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* TABEL DAFTAR RIWAYAT PENGELUARAN */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">Daftar Riwayat Pengeluaran Belanja</h3>
                        <p className="text-xs text-slate-500">Klik judul kolom tabel di bawah untuk mengurutkan (sort) data.</p>
                      </div>

                      {/* Filter Controls Bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center space-x-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
                          <input
                            type="date"
                            className="bg-transparent outline-none p-1 text-xs"
                            value={purchaseStartDate}
                            onChange={(e) => setPurchaseStartDate(e.target.value)}
                            title="Dari Tanggal"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="date"
                            className="bg-transparent outline-none p-1 text-xs"
                            value={purchaseEndDate}
                            onChange={(e) => setPurchaseEndDate(e.target.value)}
                            title="Sampai Tanggal"
                          />
                        </div>

                        <select
                          className="p-2 border rounded-xl text-xs bg-slate-50 focus:bg-white outline-none"
                          value={purchaseCategoryFilter}
                          onChange={(e) => setPurchaseCategoryFilter(e.target.value)}
                        >
                          <option value="all">Semua Kategori</option>
                          <option value="Bahan Baku">Bahan Baku</option>
                          <option value="Packaging">Packaging</option>
                          <option value="Operasional">Operasional</option>
                          <option value="Lain-lain">Lain-lain</option>
                        </select>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Cari barang..."
                            className="pl-8 pr-3 py-1.5 border rounded-xl text-xs w-36 sm:w-44 outline-none focus:ring-2 focus:ring-amber-500"
                            value={purchaseSearch}
                            onChange={(e) => setPurchaseSearch(e.target.value)}
                          />
                        </div>

                        {(purchaseSearch || purchaseStartDate || purchaseEndDate || purchaseCategoryFilter !== "all") && (
                          <button
                            onClick={resetPurchaseFilter}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition flex items-center space-x-1 text-xs font-semibold"
                            title="Reset Filter"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <div className="text-slate-600">
                        Menampilkan <span className="font-bold text-slate-900">{processedPurchases.length}</span> dari total {purchasesList.length} transaksi belanja
                        {purchaseStartDate && purchaseEndDate && (
                          <span> (Periode: {purchaseStartDate} s/d {purchaseEndDate})</span>
                        )}
                      </div>
                      <div className="font-bold text-slate-800">
                        Total Pengeluaran Filtered: <span className="font-black text-red-700 text-sm">Rp {filteredPurchasesTotal.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    {/* SORTABLE TABLE */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b text-xs select-none">
                          <tr>
                            <th
                              onClick={() => handleSortPurchase("purchase_date")}
                              className="p-3.5 cursor-pointer hover:bg-slate-200 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Tanggal</span>
                                {purchaseSortField === "purchase_date" ? (
                                  purchaseSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            </th>

                            <th
                              onClick={() => handleSortPurchase("item_name")}
                              className="p-3.5 cursor-pointer hover:bg-slate-200 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Nama Barang</span>
                                {purchaseSortField === "item_name" ? (
                                  purchaseSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            </th>

                            <th
                              onClick={() => handleSortPurchase("category")}
                              className="p-3.5 cursor-pointer hover:bg-slate-200 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Kategori</span>
                                {purchaseSortField === "category" ? (
                                  purchaseSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            </th>

                            <th
                              onClick={() => handleSortPurchase("qty")}
                              className="p-3.5 cursor-pointer hover:bg-slate-200 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Qty / Satuan</span>
                                {purchaseSortField === "qty" ? (
                                  purchaseSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            </th>

                            <th
                              onClick={() => handleSortPurchase("unit_price")}
                              className="p-3.5 cursor-pointer hover:bg-slate-200 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Harga Satuan</span>
                                {purchaseSortField === "unit_price" ? (
                                  purchaseSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            </th>

                            <th
                              onClick={() => handleSortPurchase("total_amount")}
                              className="p-3.5 cursor-pointer hover:bg-slate-200 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Total Biaya</span>
                                {purchaseSortField === "total_amount" ? (
                                  purchaseSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            </th>

                            <th
                              onClick={() => handleSortPurchase("supplier")}
                              className="p-3.5 cursor-pointer hover:bg-slate-200 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Supplier</span>
                                {purchaseSortField === "supplier" ? (
                                  purchaseSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            </th>

                            <th className="p-3.5 text-center">Aksi</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 text-xs">
                          {processedPurchases.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="p-8 text-center text-slate-400 italic">
                                Tidak ada data belanja yang sesuai dengan kriteria filter tanggal/pencarian.
                              </td>
                            </tr>
                          ) : (
                            processedPurchases.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50 transition">
                                <td className="p-3.5 text-slate-600 whitespace-nowrap font-medium">
                                  {formatDateSafe(p.purchase_date)}
                                </td>
                                <td className="p-3.5 font-bold text-slate-900">{p.item_name}</td>
                                <td className="p-3.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border text-slate-700">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="p-3.5 text-slate-600">{p.qty} {p.unit}</td>
                                <td className="p-3.5 text-slate-500">Rp {Number(p.unit_price || 0).toLocaleString("id-ID")}</td>
                                <td className="p-3.5 font-black text-red-700 whitespace-nowrap">
                                  Rp {Number(p.total_amount || 0).toLocaleString("id-ID")}
                                </td>
                                <td className="p-3.5 text-slate-600">{p.supplier || "-"}</td>
                                <td className="p-3.5 text-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingPurchase({
                                        ...p,
                                        purchaseDate: formatDateInput(p.purchase_date),
                                        itemName: p.item_name,
                                        unitPrice: p.unit_price,
                                        totalAmount: p.total_amount,
                                      });
                                      setIsEditPurchaseModalOpen(true);
                                    }}
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                    title="Edit Belanja"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePurchase(p.id, p.item_name)}
                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                    title="Hapus Belanja"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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

              {/* TAB 4: KALKULATOR HPP */}
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

              {/* TAB 5: DATABASE BAHAN BAKU (SORTABLE + PAGINATION + RIWAYAT HARGA) */}
              {activeTab === "database" && (
                <div className="space-y-6">
                  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-200 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Database Master Bahan Baku</h3>
                        <p className="text-xs text-slate-500">Harga beli supplier, satuan master, kalkulasi biaya unit, dan rekam jejak riwayat harga.</p>
                      </div>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Cari nama bahan / satuan..."
                          className="pl-9 pr-3 py-2 border rounded-xl text-xs w-56 sm:w-64 outline-none focus:ring-2 focus:ring-amber-500"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIngPage(1);
                          }}
                        />
                      </div>
                    </div>

                    {isSuperadmin && (
                      <form onSubmit={handleAddIngredient} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm bg-slate-50 p-5 rounded-2xl border">
                        <input type="text" placeholder="Nama Bahan" required className="lg:col-span-2 p-2.5 border rounded-xl bg-white text-xs" value={ingForm.name} onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })} />
                        <input type="number" placeholder="Harga Beli (Rp)" required className="p-2.5 border rounded-xl bg-white text-xs" value={ingForm.price} onChange={(e) => setIngForm({ ...ingForm, price: e.target.value })} />
                        <div className="flex space-x-2">
                          <input type="number" placeholder="Isi" required className="w-2/3 p-2.5 border rounded-xl bg-white text-xs" value={ingForm.size} onChange={(e) => setIngForm({ ...ingForm, size: e.target.value })} />
                          <select className="w-1/3 p-2.5 border rounded-xl bg-white text-xs" value={ingForm.unit} onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}>
                            <option value="gr">gr</option><option value="ml">ml</option><option value="set">set</option><option value="porsi">porsi</option>
                          </select>
                        </div>
                        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition">+ Tambah Bahan</button>
                      </form>
                    )}

                    {/* Bar Info & Pengaturan Baris */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <div className="text-slate-600">
                        Menampilkan <span className="font-bold text-slate-900">{processedIngredients.length}</span> bahan baku terdaftar
                        {searchQuery && <span> (Pencarian: "{searchQuery}")</span>}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">Tampilkan baris:</span>
                        <select
                          className="p-1.5 bg-white border border-slate-300 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500"
                          value={ingRowsPerPage}
                          onChange={(e) => {
                            setIngRowsPerPage(Number(e.target.value));
                            setIngPage(1);
                          }}
                        >
                          <option value={5}>5 baris</option>
                          <option value={10}>10 baris</option>
                          <option value={20}>20 baris</option>
                          <option value={50}>50 baris</option>
                        </select>
                      </div>
                    </div>

                    {/* SORTABLE TABLE BAHAN BAKU */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b text-xs select-none">
                          <tr>
                            <th onClick={() => handleSortIngredient("name")} className="p-3.5 cursor-pointer hover:bg-slate-200 transition">
                              <div className="flex items-center space-x-1">
                                <span>Nama Bahan</span>
                                {ingSortField === "name" ? (ingSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                              </div>
                            </th>

                            <th onClick={() => handleSortIngredient("price")} className="p-3.5 cursor-pointer hover:bg-slate-200 transition">
                              <div className="flex items-center space-x-1">
                                <span>Harga Beli</span>
                                {ingSortField === "price" ? (ingSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                              </div>
                            </th>

                            <th onClick={() => handleSortIngredient("size")} className="p-3.5 cursor-pointer hover:bg-slate-200 transition">
                              <div className="flex items-center space-x-1">
                                <span>Isi / Kemasan</span>
                                {ingSortField === "size" ? (ingSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                              </div>
                            </th>

                            <th onClick={() => handleSortIngredient("unitCost")} className="p-3.5 cursor-pointer hover:bg-slate-200 transition">
                              <div className="flex items-center space-x-1">
                                <span>Biaya / Satuan Resep</span>
                                {ingSortField === "unitCost" ? (ingSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                              </div>
                            </th>

                            <th className="p-3.5 text-center">Aksi & History</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 text-xs">
                          {paginatedIngredients.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                Tidak ada data bahan baku yang cocok.
                              </td>
                            </tr>
                          ) : (
                            paginatedIngredients.map((ing) => {
                              const unitPrice = (Number(ing.price) || 0) / (Number(ing.size) || 1);
                              return (
                                <tr key={ing.id} className="hover:bg-slate-50 transition">
                                  <td className="p-3.5 font-bold text-slate-800">{ing.name}</td>
                                  <td className="p-3.5 font-semibold text-slate-900">Rp {Number(ing.price).toLocaleString("id-ID")}</td>
                                  <td className="p-3.5 text-slate-600">{ing.size} {ing.unit}</td>
                                  <td className="p-3.5 font-bold text-amber-700 whitespace-nowrap">
                                    Rp {unitPrice.toFixed(2)} / {ing.unit}
                                  </td>
                                  <td className="p-3.5 text-center space-x-1.5">
                                    <button
                                      onClick={() => fetchIngredientHistory(ing)}
                                      className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition"
                                      title="Lihat Riwayat Perubahan Harga"
                                    >
                                      <History className="w-3.5 h-3.5 inline" />
                                    </button>
                                    {isSuperadmin && (
                                      <>
                                        <button onClick={() => { setEditingIngredient({ ...ing }); setIsEditModalOpen(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="Edit Bahan">
                                          <Edit3 className="w-3.5 h-3.5 inline" />
                                        </button>
                                        <button onClick={() => handleDeleteIngredient(ing.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Hapus Bahan">
                                          <Trash2 className="w-3.5 h-3.5 inline" />
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* PAGINATION CONTROLS BAHAN BAKU */}
                    {processedIngredients.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600">
                        <div>
                          Menampilkan bahan ke{" "}
                          <span className="font-bold text-slate-900">{(ingPage - 1) * ingRowsPerPage + 1}</span> -{" "}
                          <span className="font-bold text-slate-900">{Math.min(ingPage * ingRowsPerPage, processedIngredients.length)}</span>{" "}
                          dari <span className="font-bold text-slate-900">{processedIngredients.length}</span> total
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setIngPage(1)}
                            disabled={ingPage === 1}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                            title="Halaman Pertama"
                          >
                            <ChevronsLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setIngPage((prev) => Math.max(prev - 1, 1))}
                            disabled={ingPage === 1}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                            title="Halaman Sebelumnya"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <span className="px-3 py-1 font-bold text-slate-800">
                            Halaman {ingPage} / {totalIngPages}
                          </span>

                          <button
                            onClick={() => setIngPage((prev) => Math.min(prev + 1, totalIngPages))}
                            disabled={ingPage >= totalIngPages}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                            title="Halaman Selanjutnya"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setIngPage(totalIngPages)}
                            disabled={ingPage >= totalIngPages}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                            title="Halaman Terakhir"
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: KELOLA USER (SUPERADMIN) */}
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
                      <input type="text" placeholder="Nama Lengkap" required className="p-2.5 border rounded-xl bg-white text-xs" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
                      <input type="text" placeholder="Username" required className="p-2.5 border rounded-xl bg-white text-xs" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
                      <input type="password" placeholder="Password" required className="p-2.5 border rounded-xl bg-white text-xs" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                      <select className="p-2.5 border rounded-xl bg-white text-xs" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                        <option value="admin">admin (Kasir & Resep)</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                      <button type="submit" className="bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition">+ Tambah Staf</button>
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

      {/* MODAL RIWAYAT PERUBAHAN HARGA BAHAN BAKU */}
      {isHistoryModalOpen && activeHistoryIngredient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Riwayat Perubahan Harga</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {activeHistoryIngredient.name} ({activeHistoryIngredient.size} {activeHistoryIngredient.unit})
                  </p>
                </div>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {isLoadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                <span className="text-xs text-slate-500 font-semibold">Memuat riwayat...</span>
              </div>
            ) : priceHistoryList.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 italic">
                Belum ada rekaman histori perubahan harga untuk bahan ini.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b sticky top-0">
                    <tr>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Harga Lama</th>
                      <th className="p-3">Harga Baru</th>
                      <th className="p-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {priceHistoryList.map((h) => {
                      const diff = Number(h.new_price) - Number(h.old_price);
                      return (
                        <tr key={h.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 whitespace-nowrap text-slate-500 font-medium">
                            {formatDateTimeSafe(h.created_at)}
                          </td>
                          <td className="p-3 font-medium text-slate-400 line-through">
                            Rp {Number(h.old_price).toLocaleString("id-ID")}
                          </td>
                          <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                            Rp {Number(h.new_price).toLocaleString("id-ID")}
                            {h.old_price > 0 && diff !== 0 && (
                              <span className={`ml-1 text-[10px] font-bold ${diff > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                ({diff > 0 ? `+${diff.toLocaleString("id-ID")}` : diff.toLocaleString("id-ID")})
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="font-semibold block text-slate-800">{h.notes || "Update"}</span>
                            <span className="text-[10px] text-slate-400">Oleh: {h.admin_name || "Admin"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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
                {discountAmount > 0 ? (
                  <div className="space-y-0.5">
                    <div className="text-xs text-slate-400 line-through">Rp {cartSubtotal.toLocaleString("id-ID")}</div>
                    <div className="text-2xl font-black text-slate-900">Rp {finalCartTotal.toLocaleString("id-ID")}</div>
                    <div className="text-[11px] font-bold text-rose-600">Diskon: -Rp {discountAmount.toLocaleString("id-ID")}</div>
                  </div>
                ) : (
                  <div className="text-2xl font-black text-slate-900">Rp {finalCartTotal.toLocaleString("id-ID")}</div>
                )}
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
                    <button type="button" onClick={() => setPaidAmount(finalCartTotal.toString())} className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold">Uang Pas</button>
                    <button type="button" onClick={() => setPaidAmount("50000")} className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold">50.000</button>
                    <button type="button" onClick={() => setPaidAmount("100000")} className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold">100.000</button>
                  </div>

                  {Number(paidAmount) >= finalCartTotal && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex justify-between items-center text-xs font-bold">
                      <span>Kembalian:</span>
                      <span className="text-sm font-black">Rp {(Number(paidAmount) - finalCartTotal).toLocaleString("id-ID")}</span>
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
              <input type="text" required className="w-full p-2.5 border rounded-xl text-xs" value={editingIngredient.name} onChange={(e) => setEditingIngredient({ ...editingIngredient, name: e.target.value })} />
              <input type="number" required className="w-full p-2.5 border rounded-xl text-xs" value={editingIngredient.price} onChange={(e) => setEditingIngredient({ ...editingIngredient, price: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" required className="p-2.5 border rounded-xl text-xs" value={editingIngredient.size} onChange={(e) => setEditingIngredient({ ...editingIngredient, size: e.target.value })} />
                <select className="p-2.5 border rounded-xl bg-white text-xs" value={editingIngredient.unit} onChange={(e) => setEditingIngredient({ ...editingIngredient, unit: e.target.value })}>
                  <option value="gr">gr</option><option value="ml">ml</option><option value="set">set</option><option value="porsi">porsi</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-xs">Batal</button>
                <button type="submit" className="flex-1 bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT BELANJA */}
      {isEditPurchaseModalOpen && editingPurchase && isSuperadmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg">Edit Catatan Belanja</h3>
            <form onSubmit={handleSaveEditPurchase} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                <input type="date" required className="w-full p-2.5 border rounded-xl text-xs" value={editingPurchase.purchaseDate} onChange={(e) => setEditingPurchase({ ...editingPurchase, purchaseDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang</label>
                <input type="text" required className="w-full p-2.5 border rounded-xl text-xs" value={editingPurchase.itemName} onChange={(e) => setEditingPurchase({ ...editingPurchase, itemName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qty</label>
                  <input type="number" step="any" required className="w-full p-2.5 border rounded-xl text-xs" value={editingPurchase.qty} onChange={(e) => setEditingPurchase({ ...editingPurchase, qty: e.target.value, totalAmount: (parseFloat(e.target.value || 0) * parseFloat(editingPurchase.unitPrice || 0)).toString() })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input type="text" className="w-full p-2.5 border rounded-xl text-xs" value={editingPurchase.unit} onChange={(e) => setEditingPurchase({ ...editingPurchase, unit: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Biaya (Rp)</label>
                <input type="number" required className="w-full p-2.5 border rounded-xl font-bold text-xs" value={editingPurchase.totalAmount} onChange={(e) => setEditingPurchase({ ...editingPurchase, totalAmount: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
                <input type="text" className="w-full p-2.5 border rounded-xl text-xs" value={editingPurchase.supplier} onChange={(e) => setEditingPurchase({ ...editingPurchase, supplier: e.target.value })} />
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsEditPurchaseModalOpen(false)} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-xs">Batal</button>
                <button type="submit" className="flex-1 bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs">Simpan Perubahan</button>
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
              <input type="text" required className="w-full p-2.5 border rounded-xl text-xs" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
              <input type="text" required className="w-full p-2.5 border rounded-xl text-xs" value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} />
              <input type="password" placeholder="Password Baru (Opsional)" className="w-full p-2.5 border rounded-xl text-xs" value={editingUser.password} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} />
              <select className="w-full p-2.5 border rounded-xl bg-white text-xs" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                <option value="admin">admin (Kasir & Resep)</option>
                <option value="superadmin">superadmin</option>
              </select>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-xs">Batal</button>
                <button type="submit" className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}