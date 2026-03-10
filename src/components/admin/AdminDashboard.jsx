import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';

const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');
    const [imageName, setImageName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState('');
    const [editingId, setEditingId] = useState(null);

    // Store Settings State
    const [isStoreOpen, setIsStoreOpen] = useState(true);
    const [closedMessage, setClosedMessage] = useState('');
    const [promotionalBanner, setPromotionalBanner] = useState('🚚 Free Delivery for orders above ₹499+ 🎉');
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [maintenanceEndTime, setMaintenanceEndTime] = useState('');
    const [settingsLoading, setSettingsLoading] = useState(true);

    // Customers State
    const [customersList, setCustomersList] = useState([]);
    const [customersLoading, setCustomersLoading] = useState(true);

    // Categories State
    const [categoriesList, setCategoriesList] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Orders State
    const [ordersList, setOrdersList] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    // Analytics & Search State
    const [productSearch, setProductSearch] = useState('');
    const [orderSearch, setOrderSearch] = useState('');

    // Dashboard UI State
    const [activeTab, setActiveTab] = useState('analytics');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Pending Updates State (for Confirmation Flow)
    const [pendingUpdates, setPendingUpdates] = useState({}); // { orderId: { status, paymentStatus } }

    // Ref to hold the onSnapshot unsubscribe function (prevents duplicate listeners)
    const ordersUnsubRef = useRef(null);
    const customersUnsubRef = useRef(null);
    const categoriesUnsubRef = useRef(null);

    // Visual-only refreshing state for the ↻ button spin animation
    const [isRefreshing, setIsRefreshing] = useState({});

    const triggerRefresh = (key, fetchFn) => {
        setIsRefreshing(prev => ({ ...prev, [key]: true }));
        fetchFn();
        setTimeout(() => setIsRefreshing(prev => ({ ...prev, [key]: false })), 1000);
    };

    const WHATSAPP_NUMBER = "919010452333"; // Re-using store number for notifications

    // Role-Based Access Control (RBAC)
    const isDeveloper = auth.currentUser?.email === 'ssaiprasanth333@gmail.com';

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsMenuOpen(false);
    };

    const fetchProducts = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const productsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsList);
        } catch (error) {
            console.error("Error fetching products:", error);
            alert("Failed to load products. Make sure your Firebase Firestore is setup.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const docRef = doc(db, "settings", "store");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setIsStoreOpen(docSnap.data().isOpen !== false);
                setClosedMessage(docSnap.data().closedMessage || '');
                if (docSnap.data().promotionalBanner) {
                    setPromotionalBanner(docSnap.data().promotionalBanner);
                }
                setIsMaintenanceMode(docSnap.data().isMaintenanceMode || false);
                setMaintenanceEndTime(docSnap.data().maintenanceEndTime || '');
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setSettingsLoading(false);
        }
    };

    const fetchCategories = () => {
        if (categoriesUnsubRef.current) categoriesUnsubRef.current();
        const unsub = onSnapshot(collection(db, "categories"), (snap) => {
            setCategoriesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => console.error("categories error:", err));
        categoriesUnsubRef.current = unsub;
        return unsub;
    };

    const fetchCustomers = () => {
        if (customersUnsubRef.current) customersUnsubRef.current();
        const unsub = onSnapshot(collection(db, "customers"), (snap) => {
            const customers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            customers.sort((a, b) => {
                if (!a.lastOrderDate) return 1;
                if (!b.lastOrderDate) return -1;
                return b.lastOrderDate.toMillis() - a.lastOrderDate.toMillis();
            });
            setCustomersList(customers);
            setCustomersLoading(false);
        }, err => { console.error("customers error:", err); setCustomersLoading(false); });
        customersUnsubRef.current = unsub;
        return unsub;
    };

    const fetchOrders = () => {
        // Cancel any existing listener before creating a new one
        if (ordersUnsubRef.current) {
            ordersUnsubRef.current();
        }
        // Only show loader if we don't have data yet (first load only)
        if (ordersList.length === 0) setOrdersLoading(true);

        const q = query(collection(db, "orders"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const orders = querySnapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            orders.sort((a, b) => {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            });
            setOrdersList(orders);
            setOrdersLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            setOrdersLoading(false);
        });
        ordersUnsubRef.current = unsubscribe;
        return unsubscribe;
    };

    const handleUpdateOrderStatus = (orderId, newStatus) => {
        setPendingUpdates(prev => ({
            ...prev,
            [orderId]: { ...prev[orderId], status: newStatus }
        }));
    };

    const handleUpdatePaymentStatus = (orderId, newPaymentStatus) => {
        setPendingUpdates(prev => ({
            ...prev,
            [orderId]: { ...prev[orderId], paymentStatus: newPaymentStatus }
        }));
    };

    const handleConfirmUpdate = async (order) => {
        const update = pendingUpdates[order.id];
        if (!update) return;

        try {
            const finalUpdate = {};
            let statusChanged = false;
            let paymentChanged = false;

            if (update.status && update.status !== order.status) {
                finalUpdate.status = update.status;
                statusChanged = true;
            }
            if (update.paymentStatus && update.paymentStatus !== order.paymentStatus) {
                finalUpdate.paymentStatus = update.paymentStatus;
                paymentChanged = true;
            }
            if (update.utrNumber !== undefined && update.utrNumber.trim() !== (order.utrNumber || '')) {
                finalUpdate.utrNumber = update.utrNumber.trim();
            }

            if (Object.keys(finalUpdate).length === 0) return;

            await updateDoc(doc(db, "orders", order.id), finalUpdate);

            // Determine new values (fall back to current if not changed)
            const newStatus = finalUpdate.status || order.status;
            const newPayment = finalUpdate.paymentStatus || order.paymentStatus;

            let messageText = "";
            if (newStatus === "Rejected") {
                const reason = update.rejectionReason?.trim();
                const reasonText = reason ? `\nReason: ${reason}` : "";
                messageText = `Hello *${order.customerName}*!\nYour order *#${order.orderID || order.id.substring(0, 8)}* has been *Rejected*. ${reasonText}\nPlease contact support for more details.`;
            } else {
                messageText = `Hello *${order.customerName}*!\nYour order *#${order.orderID || order.id.substring(0, 8)}* has been updated:\nDelivery: *${newStatus}*\nPayment: *${newPayment}*\nThank you for shopping with Bhimaya Foods!`;
            }

            const encodedMessage = encodeURIComponent(messageText);
            window.open(`https://wa.me/91${order.customerPhone}?text=${encodedMessage}`, "_blank");

            // Clear pending update (onSnapshot will auto-refresh orders)
            setPendingUpdates(prev => {
                const newState = { ...prev };
                delete newState[order.id];
                return newState;
            });
            alert("Update confirmed! WhatsApp notification opened.");
        } catch (error) {
            console.error("Error confirming update:", error);
            alert("Failed to confirm update.");
        }
    };

    const exportOrdersToCSV = () => {
        const headers = ["Order Date", "Order ID", "Total Amount", "Status", "Items", "Customer Address"];
        const rows = ordersList.map(order => [
            order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A',
            order.id,
            order.totalAmount,
            order.status,
            order.items?.map(i => `${i.name} (x${i.quantity})`).join(" | ") || "",
            order.customerAddress || ""
        ]);
        const csvContent = headers.join(",") + "\n"
            + rows.map(e => e.map(item => {
                // Ensure the item is a string and handle null/undefined
                let cellData = item ? String(item) : "";

                // Replace any existing double quotes with two double quotes (CSV escaping)
                cellData = cellData.replace(/"/g, '""');

                // If it contains a newline, carriage return, or comma, wrap in quotes
                if (cellData.includes('\n') || cellData.includes('\r') || cellData.includes(',')) {
                    return `"${cellData}"`;
                }
                return `"${cellData}"`; // Always wrap in quotes to be safe
            }).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Bhimaya_Orders_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        fetchProducts();
        fetchSettings();
        fetchCategories();
        fetchCustomers();
        fetchOrders();
        return () => {
            if (ordersUnsubRef.current) ordersUnsubRef.current();
            if (customersUnsubRef.current) customersUnsubRef.current();
            if (categoriesUnsubRef.current) categoriesUnsubRef.current();
        };
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        try {
            await addDoc(collection(db, "categories"), { name: newCategoryName.trim() });
            setNewCategoryName('');
            fetchCategories();
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category.");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            await deleteDoc(doc(db, "categories", id));
            fetchCategories();
        }
    };

    const handlePurgeCustomers = async () => {
        if (!isDeveloper) return;

        const confirmation1 = window.confirm("🚨 CRITICAL WARNING 🚨\n\nYou are about to DELETE ALL CUSTOMER DATA from the database.\n\nThis action CANNOT BE UNDONE. Are you absolutely sure?");

        if (confirmation1) {
            const confirmation2 = window.prompt("To proceed, please type exactly:\n\nPURGE MY CUSTOMERS\n\nin the box below:");

            if (confirmation2 === "PURGE MY CUSTOMERS") {
                try {
                    // Fetch all existing customers and delete them one by one
                    for (const customer of customersList) {
                        await deleteDoc(doc(db, "customers", customer.id));
                    }

                    alert("✅ CUSTOMER DATABASE PURGED SUCCESSFULLY!");
                    fetchCustomers(); // Refresh the local state immediately
                } catch (error) {
                    console.error("Error purging customers:", error);
                    alert("❌ Failed to purge customer database. Check console logs.");
                }
            } else {
                alert("Operation cancelled. Incorrect confirmation phrase.");
            }
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            await setDoc(doc(db, "settings", "store"), {
                isOpen: isStoreOpen,
                closedMessage: closedMessage,
                promotionalBanner: promotionalBanner
            }, { merge: true });
            alert("Settings saved!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        }
    };

    const handleToggleMaintenanceMode = async () => {
        const newMode = !isMaintenanceMode;
        try {
            await setDoc(doc(db, "settings", "store"), {
                isMaintenanceMode: newMode,
                maintenanceEndTime: newMode ? maintenanceEndTime : ''
            }, { merge: true });
            setIsMaintenanceMode(newMode);
            if (!newMode) setMaintenanceEndTime(''); // clear on off
            alert(`Maintenance Mode is now ${newMode ? 'ON (Site Offline)' : 'OFF (Site Online)'}`);
        } catch (error) {
            console.error("Error setting maintenance mode:", error);
            alert("Failed to toggle maintenance mode.");
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Ensure the file is an image
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Limit file size to ~2MB to prevent bloated Firestore documents
            if (file.size > 2 * 1024 * 1024) {
                alert('Image is too large. Please select an image under 2MB.');
                return;
            }

            setImageName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result); // Base64 Data URL
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setName('');
        setPrice('');
        setImage('');
        setImageName('');
        setDescription('');
        setCategory('');
        setQuantity('');
        setEditingId(null);
    };

    const handleEdit = (product) => {
        setName(product.name);
        setPrice(product.price);
        setImage(product.image);
        setImageName(product.image ? 'Existing Image' : '');
        setDescription(product.description || '');
        setCategory(product.category || '');
        setQuantity(product.quantity || '');
        setEditingId(product.id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            await deleteDoc(doc(db, "products", id));
            fetchProducts();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const productData = {
            name,
            price: parseFloat(price),
            image,
            description,
            category,
            quantity
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, "products", editingId), productData);
            } else {
                await addDoc(collection(db, "products"), productData);
            }
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Failed to save product.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow-sm sticky top-0 z-40 relative">
                    <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

                    {/* Hamburger Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-gray-800 hover:text-gray-600 focus:outline-none"
                    >
                        {isMenuOpen ? (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" stroke="#2b2b2b" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>

                    {/* Universal Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white border rounded shadow-xl flex flex-col items-start py-2 z-50">
                            <button onClick={() => handleTabChange('analytics')} className={`w-full text-left px-5 py-3 text-sm ${activeTab === 'analytics' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>📊 Overview & Analytics</button>
                            <button onClick={() => handleTabChange('store-settings')} className={`w-full text-left px-5 py-3 text-sm ${activeTab === 'store-settings' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>Store Status & Global Settings</button>
                            <button onClick={() => handleTabChange('categories')} className={`w-full text-left px-5 py-3 text-sm ${activeTab === 'categories' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>Manage Categories</button>
                            <button onClick={() => handleTabChange('products')} className={`w-full text-left px-5 py-3 text-sm ${activeTab === 'products' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>Products & Inventory</button>
                            <button onClick={() => handleTabChange('orders')} className={`w-full text-left px-5 py-3 text-sm ${activeTab === 'orders' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>Customer Orders</button>
                            <button onClick={() => handleTabChange('customers')} className={`w-full text-left px-5 py-3 text-sm ${activeTab === 'customers' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>👤 Customer Database</button>
                            {isDeveloper && (
                                <button onClick={() => handleTabChange('developer-tools')} className={`w-full text-left px-5 py-3 text-sm ${activeTab === 'developer-tools' ? 'bg-purple-50 text-purple-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>🛠️ Developer Tools</button>
                            )}
                            <div className="border-t w-full my-1"></div>
                            <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 font-bold">Logout</button>
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    {/* Analytics Section */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Store Overview & Analytics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                                <div className="bg-white p-6 rounded shadow-sm border-t-4 border-green-500">
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Revenue (Delivered)</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-2">
                                        ₹{ordersList.filter(o => o.status === 'Delivered').reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded shadow-sm border-t-4 border-blue-500">
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Orders</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-2">{ordersList.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded shadow-sm border-t-4 border-orange-500">
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Pending / Process</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-2">
                                        {ordersList.filter(o => o.status !== 'Delivered' && o.status !== 'Rejected').length}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded shadow-sm border-t-4 border-teal-500">
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Delivered Orders</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-2">
                                        {ordersList.filter(o => o.status === 'Delivered').length}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded shadow-sm border-t-4 border-red-500">
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Rejected Orders</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-2">
                                        {ordersList.filter(o => o.status === 'Rejected').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Section */}
                    {activeTab === 'store-settings' && (
                        <div className="bg-white p-6 rounded shadow-md h-fit animate-fadeIn">
                            <h2 className="text-xl font-semibold mb-4">Store Status & Global Settings</h2>
                            {settingsLoading ? (
                                <p>Loading settings...</p>
                            ) : (
                                <form onSubmit={handleSaveSettings} className="space-y-4">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <input
                                            type="checkbox"
                                            id="storeOpen"
                                            checked={isStoreOpen}
                                            onChange={(e) => setIsStoreOpen(e.target.checked)}
                                            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                        />
                                        <label htmlFor="storeOpen" className="font-bold text-gray-700">Store is currently accepting orders</label>
                                    </div>

                                    {!isStoreOpen && (
                                        <div className="mt-4 border-t pt-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2">Store Closed Announcement</label>
                                            <textarea
                                                value={closedMessage}
                                                onChange={(e) => setClosedMessage(e.target.value)}
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none h-20"
                                                placeholder="e.g. Store will be closed until 15th March due to maintenance."
                                            />
                                            <p className="text-xs text-gray-500 mt-1">This message will be displayed as a red banner on the public website.</p>
                                        </div>
                                    )}

                                    <div className="mt-4 border-t pt-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Promotional Banner Message</label>
                                        <input
                                            type="text"
                                            value={promotionalBanner}
                                            onChange={(e) => setPromotionalBanner(e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder="e.g. 🚚 Free Delivery for orders above ₹499+ 🎉"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">This message scrolls across the top ribbon of your website.</p>
                                    </div>

                                    <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition px-6 mt-4 w-full md:w-auto">
                                        Save Settings
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Category Management Section */}
                    {activeTab === 'categories' && (
                        <div className="bg-white p-6 rounded shadow-md h-fit animate-fadeIn">
                            <h2 className="text-xl font-semibold mb-4 flex justify-between items-center">
                                Manage Categories
                                <button
                                    onClick={() => triggerRefresh('categories', fetchCategories)}
                                    className="text-orange-600 hover:text-orange-800 transition"
                                    title="Refresh Categories"
                                >
                                    <svg className={`w-5 h-5 transition-transform duration-700 ${isRefreshing.categories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                            </h2>
                            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    required
                                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="New Category Name"
                                />
                                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
                                    Add
                                </button>
                            </form>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {categoriesList.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No categories added yet.</p>
                                ) : (
                                    categoriesList.map(cat => (
                                        <div key={cat.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                                            <span className="font-medium text-gray-700">{cat.name}</span>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Products Section */}
                    {activeTab === 'products' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
                            {/* Form Section */}
                            <div className="bg-white p-6 rounded shadow-md col-span-1 h-fit">
                                <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Product Name</label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Spicy Cashews" />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Price (₹)</label>
                                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. 250" />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Product Image (Local File)</label>
                                        <div className="border border-gray-300 rounded p-4 text-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                            />
                                            {image && (
                                                <div className="mt-4">
                                                    <p className="text-xs text-green-600 mb-2 font-medium">Image selected: {imageName}</p>
                                                    <img src={image} alt="Preview" className="h-24 mx-auto object-contain border rounded shadow-sm" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            required
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                        >
                                            <option value="" disabled>Select a category</option>
                                            {categoriesList.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Quantity/Weight</label>
                                        <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. 1kg or 250g" />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                                        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none h-24" placeholder="Product details..." />
                                    </div>

                                    <div className="flex gap-2">
                                        <button type="submit" className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">
                                            {editingId ? 'Update' : 'Save'}
                                        </button>
                                        {editingId && (
                                            <button type="button" onClick={resetForm} className="bg-gray-400 text-white p-2 rounded hover:bg-gray-500 transition">
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Products List Section */}
                            <div className="bg-white p-6 rounded shadow-md col-span-2">
                                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                                    <h2 className="text-xl font-semibold">Current Products</h2>
                                    <input
                                        type="text"
                                        placeholder="Search by name or category..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="p-2 border rounded text-sm w-full md:w-64 focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                {loading ? (
                                    <p>Loading products...</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-100 border-b">
                                                    <th className="p-3">Image</th>
                                                    <th className="p-3">Name</th>
                                                    <th className="p-3">Price</th>
                                                    <th className="p-3">Qty</th>
                                                    <th className="p-3">Category</th>
                                                    <th className="p-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="p-4 text-center text-gray-500">No products found.</td>
                                                    </tr>
                                                ) : (
                                                    products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase())).map(product => {
                                                        const isLowStock = product.quantity?.toLowerCase().includes('out of stock') || product.quantity === '0' || product.quantity?.toLowerCase().includes('low');
                                                        return (
                                                            <tr key={product.id} className={`border-b hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                                                                <td className="p-3">
                                                                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                                                                </td>
                                                                <td className="p-3 font-medium">{product.name}</td>
                                                                <td className="p-3">₹{product.price}</td>
                                                                <td className="p-3">
                                                                    {product.quantity}
                                                                    {isLowStock && <span className="block text-xs text-red-600 font-bold whitespace-nowrap">Low/Out of Stock</span>}
                                                                </td>
                                                                <td className="p-3 text-sm text-gray-600">{product.category}</td>
                                                                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                                                                    <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700">Edit</button>
                                                                    <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Orders Management Section */}
                    {activeTab === 'orders' && (
                        <div className="bg-white p-6 rounded shadow-md animate-fadeIn">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                                <h2 className="text-xl font-semibold flex items-center gap-3">
                                    Customer Orders
                                    <button
                                        onClick={() => triggerRefresh('orders', fetchOrders)}
                                        className="text-orange-600 hover:text-orange-800 transition"
                                        title="Refresh Orders"
                                    >
                                        <svg className={`w-5 h-5 transition-transform duration-700 ${isRefreshing.orders ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </button>
                                </h2>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <input
                                        type="text"
                                        placeholder="Search order ID or status..."
                                        value={orderSearch}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                        className="p-2 border rounded text-sm flex-1 md:w-64 focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                    <button onClick={exportOrdersToCSV} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition whitespace-nowrap font-bold">
                                        Export CSV
                                    </button>
                                </div>
                            </div>
                            {ordersLoading ? (
                                <p>Loading orders...</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 border-b">
                                                <th className="p-3">Order Date</th>
                                                <th className="p-3">Items</th>
                                                <th className="p-3">Total</th>
                                                <th className="p-3">Delivery Status</th>
                                                <th className="p-3">Payment Status</th>
                                                <th className="p-3 text-right">Update</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const q = orderSearch.toLowerCase();
                                                const filteredOrders = ordersList.filter(o =>
                                                    (o.orderID || '').toLowerCase().includes(q) ||
                                                    (o.customerName || '').toLowerCase().includes(q) ||
                                                    (o.customerPhone || '').toLowerCase().includes(q) ||
                                                    (o.status || '').toLowerCase().includes(q) ||
                                                    (o.paymentStatus || '').toLowerCase().includes(q) ||
                                                    (o.utrNumber || '').toLowerCase().includes(q)
                                                );

                                                if (filteredOrders.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan="6" className="p-4 text-center text-gray-500">No orders found.</td>
                                                        </tr>
                                                    );
                                                }

                                                return filteredOrders.map(order => (
                                                    <tr key={order.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-3 text-sm text-gray-600">
                                                            {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                                            <br />
                                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100 uppercase tracking-tighter shadow-sm">
                                                                {order.orderID || 'Legacy'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-sm">
                                                            <div className="font-semibold text-gray-800">{order.customerName || 'Anonymous'}</div>
                                                            <div className="text-gray-500 text-xs mb-1">{order.customerPhone || 'No Phone'}</div>
                                                            {order.customerAddress && (
                                                                <div className="text-gray-500 text-xs border-l-2 border-orange-200 pl-2 max-w-[200px] italic whitespace-pre-wrap break-words">
                                                                    {order.customerAddress}
                                                                </div>
                                                            )}
                                                            {order.utrNumber && (
                                                                <div className="text-xs mt-1 bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded inline-block">
                                                                    Transaction/UTR ID: {order.utrNumber}
                                                                </div>
                                                            )}
                                                            <ul className="mt-2 text-xs text-gray-600 border-t pt-2">
                                                                {order.items?.map((item, idx) => (
                                                                    <li key={idx} className="list-disc list-inside">{item.name} (x{item.quantity})</li>
                                                                ))}
                                                            </ul>
                                                        </td>
                                                        <td className="p-3 font-semibold text-primary">₹{order.totalAmount}</td>
                                                        <td className="p-3 text-sm font-bold flex flex-col gap-2">
                                                            <div>
                                                                <span className={`px-2 py-1 border rounded text-xs ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    order.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                        order.status === 'Shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                            order.status === 'Packed' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                                order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                    }`}>
                                                                    {order.status === 'Packed' ? '📦' : order.status === 'Rejected' ? '❌' : '🚚'} {order.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-sm font-bold">
                                                            <div>
                                                                <span className={`px-2 py-1 border rounded text-xs ${(order.paymentStatus || 'Pending') === 'Successful' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    (order.paymentStatus || 'Pending') === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                    }`}>
                                                                    💰 {order.paymentStatus || 'Pending'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex flex-col gap-1 items-end">
                                                                <select
                                                                    value={pendingUpdates[order.id]?.status || order.status}
                                                                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                                    className={`p-1 border rounded text-xs outline-none ${pendingUpdates[order.id]?.status && pendingUpdates[order.id]?.status !== order.status ? 'border-orange-500 bg-orange-50' : 'bg-gray-50'}`}
                                                                >
                                                                    <option value="Pending">🚚 Pending</option>
                                                                    <option value="Processing">🚚 Processing</option>
                                                                    <option value="Packed">📦 Packed</option>
                                                                    <option value="Shipped">🚚 Shipped</option>
                                                                    <option value="Delivered">✅ Delivered</option>
                                                                    <option value="Rejected">❌ Rejected</option>
                                                                </select>
                                                                {(pendingUpdates[order.id]?.status === 'Rejected' || (order.status === 'Rejected' && !pendingUpdates[order.id]?.status)) && (
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Reason for rejection..."
                                                                        value={pendingUpdates[order.id]?.rejectionReason || ""}
                                                                        onChange={(e) => setPendingUpdates(prev => ({
                                                                            ...prev,
                                                                            [order.id]: { ...prev[order.id], rejectionReason: e.target.value }
                                                                        }))}
                                                                        className="mt-1 p-1 border rounded text-[10px] w-full outline-none focus:ring-1 focus:ring-red-400"
                                                                    />
                                                                )}
                                                                <select
                                                                    value={pendingUpdates[order.id]?.paymentStatus || order.paymentStatus || 'Pending'}
                                                                    onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                                                                    className={`p-1 border rounded text-xs outline-none ${pendingUpdates[order.id]?.paymentStatus && pendingUpdates[order.id]?.paymentStatus !== order.paymentStatus ? 'border-orange-500 bg-orange-50' : 'bg-gray-50'}`}
                                                                >
                                                                    <option value="Pending">💰 Pending</option>
                                                                    <option value="Successful">✅ Successful</option>
                                                                    <option value="Failed">❌ Failed</option>
                                                                </select>
                                                                {((pendingUpdates[order.id]?.paymentStatus || order.paymentStatus) === 'Successful') && (
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Transaction/UTR ID (optional)"
                                                                        value={pendingUpdates[order.id]?.utrNumber !== undefined ? pendingUpdates[order.id].utrNumber : (order.utrNumber || '')}
                                                                        onChange={(e) => setPendingUpdates(prev => ({
                                                                            ...prev,
                                                                            [order.id]: { ...prev[order.id], utrNumber: e.target.value }
                                                                        }))}
                                                                        className="mt-1 w-full p-1 border rounded text-xs outline-none bg-blue-50 border-blue-200 placeholder-blue-300"
                                                                    />
                                                                )}
                                                                {pendingUpdates[order.id] && (
                                                                    <button
                                                                        onClick={() => handleConfirmUpdate(order)}
                                                                        className="mt-1 bg-green-600 text-white px-3 py-1 rounded text-[10px] font-bold hover:bg-green-700 shadow-sm animate-pulse flex items-center gap-1"
                                                                    >
                                                                        Confirm ✅
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Customers Database Section */}
                    {activeTab === 'customers' && (
                        <div className="bg-white p-6 rounded shadow-md animate-fadeIn">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    Customer Database
                                    <button
                                        onClick={() => triggerRefresh('customers', fetchCustomers)}
                                        className="text-orange-600 hover:text-orange-800 transition"
                                        title="Refresh Customers"
                                    >
                                        <svg className={`w-5 h-5 transition-transform duration-700 ${isRefreshing.customers ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </button>
                                </div>
                                <span className="bg-blue-100 text-blue-800 text-xs py-1 px-3 rounded-full font-bold">
                                    {customersList.length} Total Customers
                                </span>
                            </h2>

                            {customersLoading ? (
                                <p className="text-center text-gray-500 py-8">Loading customers...</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 border-b">
                                                <th className="p-3 font-semibold text-gray-700">Name</th>
                                                <th className="p-3 font-semibold text-gray-700">Phone</th>
                                                <th className="p-3 font-semibold text-gray-700">Address</th>
                                                <th className="p-3 font-semibold text-gray-700 items-center gap-1 cursor-pointer hover:bg-gray-200">
                                                    Orders <span className="text-xs">▼</span>
                                                </th>
                                                <th className="p-3 font-semibold text-gray-700">First Order</th>
                                                <th className="p-3 font-semibold text-gray-700">Last Order</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customersList.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="p-8 text-center bg-gray-50 rounded">
                                                        <p className="text-gray-500 mb-2 font-medium">No customers yet!</p>
                                                        <p className="text-sm text-gray-400">Customers will appear here when they place an order via the new checkout form.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                customersList.map(customer => (
                                                    <tr key={customer.id} className="border-b hover:bg-gray-50 transition">
                                                        <td className="p-3 font-semibold text-gray-800">
                                                            {customer.name}
                                                        </td>
                                                        <td className="p-3 text-gray-600">
                                                            <a href={`https://wa.me/91${customer.phone}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                                                                {customer.phone}
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                                                            </a>
                                                        </td>
                                                        <td className="p-3 text-sm text-gray-600 max-w-[200px] whitespace-pre-wrap break-words">
                                                            {customer.address || 'N/A'}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className="bg-orange-100 text-orange-800 font-bold px-2 py-1 rounded-full text-xs">
                                                                {customer.totalOrders}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-sm text-gray-500">
                                                            {customer.firstOrderDate ? new Date(customer.firstOrderDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className="p-3 text-sm text-gray-500">
                                                            {customer.lastOrderDate ? new Date(customer.lastOrderDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Developer Tools Section (Role Restricted) */}
                    {activeTab === 'developer-tools' && isDeveloper && (
                        <div className="bg-white p-6 rounded shadow-md animate-fadeIn border-t-4 border-purple-600">
                            <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
                                <span className="mr-2">🛠️</span> Developer Console
                            </h2>

                            <div className="space-y-8">
                                {/* System logs */}
                                <div className="border border-gray-200 rounded p-4 bg-gray-50">
                                    <h3 className="text-lg font-semibold mb-2">System Logs & Database Health</h3>
                                    <p className="text-sm text-gray-600 mb-4">Raw real-time data dump for verification of Firestore collections.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-64 overflow-auto shadow-inner">
                                            <p className="mb-2 text-white opacity-60 font-bold border-b border-gray-700 pb-1">// Products Collection</p>
                                            <pre>{JSON.stringify(products, null, 2)}</pre>
                                        </div>
                                        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-64 overflow-auto shadow-inner">
                                            <p className="mb-2 text-white opacity-60 font-bold border-b border-gray-700 pb-1">// Categories Collection</p>
                                            <pre>{JSON.stringify(categoriesList, null, 2)}</pre>
                                        </div>
                                        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-64 overflow-auto shadow-inner">
                                            <p className="mb-2 text-white opacity-60 font-bold border-b border-gray-700 pb-1">// Orders Collection</p>
                                            <pre>{JSON.stringify(ordersList, null, 2)}</pre>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="border border-red-300 rounded p-4 bg-red-50">
                                    <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
                                    <p className="text-sm text-red-600 mb-4 font-medium">Irreversible actions for development and testing environments.</p>
                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('CRITICAL WARNING: This will delete ALL products! Are you absolutely sure?')) {
                                                    try {
                                                        const confirmText = window.prompt('Type "DELETE" to confirm purge.');
                                                        if (confirmText === 'DELETE') {
                                                            let count = 0;
                                                            for (const p of products) {
                                                                await deleteDoc(doc(db, "products", p.id));
                                                                count++;
                                                            }
                                                            alert(`Successfully purged ${count} products.`);
                                                            fetchProducts();
                                                        }
                                                    } catch (err) {
                                                        alert("Error purging products: " + err.message);
                                                    }
                                                }
                                            }}
                                            className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition"
                                        >
                                            Purge All Products
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Delete all test orders?')) {
                                                    try {
                                                        let count = 0;
                                                        for (const o of ordersList) {
                                                            await deleteDoc(doc(db, "orders", o.id));
                                                            count++;
                                                        }
                                                        alert(`Successfully purged ${count} orders.`);
                                                        fetchOrders();
                                                    } catch (err) {
                                                        alert("Error purging orders: " + err.message);
                                                    }
                                                }
                                            }}
                                            className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition"
                                        >
                                            Purge All Orders
                                        </button>
                                        <button
                                            onClick={handlePurgeCustomers}
                                            className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-black transition"
                                        >
                                            Purge All Customers
                                        </button>
                                    </div>
                                </div>

                                {/* Maintenance Mode Switch */}
                                <div className="border border-orange-300 rounded p-4 bg-orange-50">
                                    <h3 className="text-lg font-semibold text-orange-800 mb-2 flex items-center gap-2">
                                        <span className="text-2xl">🚧</span> Maintenance Mode (Developer Only)
                                    </h3>
                                    <p className="text-sm text-orange-700 mb-4 font-medium">
                                        When active, all visitors (except you and the owner) will be blocked and redirected to a "We'll be back soon" maintenance page.
                                    </p>

                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-orange-900 mb-1">Estimated Completion Time (Optional)</label>
                                        <input
                                            type="datetime-local"
                                            value={maintenanceEndTime}
                                            onChange={(e) => setMaintenanceEndTime(e.target.value)}
                                            disabled={isMaintenanceMode}
                                            className="w-full md:w-auto p-2 border border-orange-300 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                        <p className="text-xs text-orange-600 mt-1">Set this <b>before</b> turning on the switch. Leave blank for no specific time.</p>
                                    </div>

                                    <div className="flex items-center space-x-3 pt-2 border-t border-orange-200">
                                        <button
                                            onClick={handleToggleMaintenanceMode}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${isMaintenanceMode ? 'bg-orange-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`${isMaintenanceMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                        </button>
                                        <span className={`font-bold ${isMaintenanceMode ? 'text-orange-700' : 'text-gray-500'}`}>
                                            {isMaintenanceMode ? "Status: OFFLINE (Maintenance Mode Active)" : "Status: ONLINE (Public Access Active)"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default AdminDashboard;
