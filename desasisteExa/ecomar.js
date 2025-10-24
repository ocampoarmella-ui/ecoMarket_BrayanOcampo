// Configuración de Supabase
const SUPABASE_URL = 'https://yqguocgcrycdhmyzpohm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZ3VvY2djcnljZGhteXpwb2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMTUyNDEsImV4cCI6MjA3MzY5MTI0MX0.LecKhUPegIviHlnM4bYNKdO5lh4DaU-XD5-LoH1zIkU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado de la aplicación
let currentUser = null;
let currentRole = null;
let currentView = 'products';
let editingProductId = null;
let orderItems = [];

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    await checkSession();
    setupEventListeners();
});

// Verificar sesión
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
        const { data: vendorData } = await supabase
            .from('VENDEDOR_EM')
            .select('*')
            .eq('USER_ID', session.user.id)
            .single();

        if (vendorData) {
            currentUser = session.user;
            currentRole = vendorData.ROLE;
            showMainScreen();
        } else {
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
}

// Event Listeners
function setupEventListeners() {
    // Login Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tab}-form`).classList.add('active');
        });
    });

    // Login Form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // Mobile Menu Toggle
    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('show');
    });

    // Products
    document.getElementById('add-product-btn').addEventListener('click', showProductForm);
    document.getElementById('cancel-product-btn').addEventListener('click', hideProductForm);
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);

    // Clients
    document.getElementById('add-client-btn').addEventListener('click', showClientForm);
    document.getElementById('cancel-client-btn').addEventListener('click', hideClientForm);
    document.getElementById('client-form').addEventListener('submit', handleClientSubmit);

    // Orders
    document.getElementById('add-order-btn').addEventListener('click', showOrderForm);
    document.getElementById('cancel-order-btn').addEventListener('click', hideOrderForm);
    document.getElementById('order-form').addEventListener('submit', handleOrderSubmit);
    document.getElementById('order-product').addEventListener('change', addProductToOrder);

    // Vendors
    document.getElementById('add-vendor-btn').addEventListener('click', showVendorForm);
    document.getElementById('cancel-vendor-btn').addEventListener('click', hideVendorForm);
    document.getElementById('vendor-form').addEventListener('submit', handleVendorSubmit);
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;

        if (data.user) {
            const { data: vendorData, error: vendorError } = await supabase
                .from('VENDEDOR_EM')
                .select('*')
                .eq('USER_ID', data.user.id)
                .single();

            if (vendorError) {
                errorDiv.textContent = 'Usuario no encontrado en el sistema';
                errorDiv.classList.add('show');
                await supabase.auth.signOut();
            } else {
                currentUser = data.user;
                currentRole = vendorData.ROLE;
                showMainScreen();
            }
        }
    } catch (err) {
        errorDiv.textContent = err.message || 'Error al iniciar sesión';
        errorDiv.classList.add('show');
    }
}

// Register
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');

    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) throw error;

        if (data.user) {
            const { error: vendorError } = await supabase
                .from('VENDEDOR_EM')
                .insert([{
                    USER_ID: data.user.id,
                    NOMBRE: name,
                    EMAIL: email,
                    ROLE: 'vendedor'
                }]);

            if (vendorError) throw vendorError;

            alert('Registro exitoso. Por favor inicia sesión.');
            document.querySelector('[data-tab="login"]').click();
            document.getElementById('register-form').reset();
        }
    } catch (err) {
        errorDiv.textContent = err.message || 'Error al registrarse';
        errorDiv.classList.add('show');
    }
}

// Logout
async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    currentRole = null;
    showLoginScreen();
}

// Show/Hide Screens
function showLoginScreen() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
}

function showMainScreen() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('user-role-text').textContent = 
        currentRole === 'admin' ? 'Panel Administrador' : 'Panel Vendedor';
    
    // Show/Hide admin elements
    if (currentRole === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = '';
        });
    } else {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }

    loadProducts();
}

// Switch View
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');

    // Load data based on view
    switch(view) {
        case 'products':
            loadProducts();
            break;
        case 'clients':
            loadClients();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'vendors':
            if (currentRole === 'admin') loadVendors();
            break;
        case 'reports':
            if (currentRole === 'admin') loadReports();
            break;
    }
}

// ============ PRODUCTS ============
async function loadProducts() {
    const { data, error } = await supabase
        .from('PRODUCTO_EM')
        .select('*')
        .order('ID', { ascending: true });

    const container = document.getElementById('products-list');
    
    if (error) {
        container.innerHTML = '<div class="empty-state">Error al cargar productos</div>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay productos registrados</div>';
        return;
    }

    container.innerHTML = data.map(product => `
        <div class="product-card">
            <div class="product-header">
                <div class="product-name">${product.NOMBRE}</div>
                <div class="product-price">$${parseFloat(product.PRECIO).toFixed(2)}</div>
            </div>
            <div class="product-description">${product.DESCRIPCION || ''}</div>
            <div class="product-actions">
                <button class="btn btn-sm btn-outline" onclick="editProduct(${product.ID})">✏️ Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.ID})">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}

function showProductForm() {
    document.getElementById('product-form-container').classList.remove('hidden');
    document.getElementById('product-form-title').textContent = 'Nuevo Producto';
    editingProductId = null;
}

function hideProductForm() {
    document.getElementById('product-form-container').classList.add('hidden');
    document.getElementById('product-form').reset();
    editingProductId = null;
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        NOMBRE: document.getElementById('product-name').value,
        DESCRIPCION: document.getElementById('product-description').value,
        PRECIO: parseFloat(document.getElementById('product-price').value)
    };

    if (editingProductId) {
        const { error } = await supabase
            .from('PRODUCTO_EM')
            .update(productData)
            .eq('ID', editingProductId);

        if (error) {
            alert('Error al actualizar producto: ' + error.message);
        } else {
            alert('Producto actualizado exitosamente');
            hideProductForm();
            loadProducts();
        }
    } else {
        const { error } = await supabase
            .from('PRODUCTO_EM')
            .insert([productData]);

        if (error) {
            alert('Error al crear producto: ' + error.message);
        } else {
            alert('Producto creado exitosamente');
            hideProductForm();
            loadProducts();
        }
    }
}

async function editProduct(id) {
    const { data } = await supabase
        .from('PRODUCTO_EM')
        .select('*')
        .eq('ID', id)
        .single();

    if (data) {
        document.getElementById('product-name').value = data.NOMBRE;
        document.getElementById('product-description').value = data.DESCRIPCION || '';
        document.getElementById('product-price').value = data.PRECIO;
        document.getElementById('product-form-title').textContent = 'Editar Producto';
        document.getElementById('product-form-container').classList.remove('hidden');
        editingProductId = id;
    }
}

async function deleteProduct(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        const { error } = await supabase
            .from('PRODUCTO_EM')
            .delete()
            .eq('ID', id);

        if (error) {
            alert('Error al eliminar producto: ' + error.message);
        } else {
            alert('Producto eliminado exitosamente');
            loadProducts();
        }
    }
}

// ============ CLIENTS ============
async function loadClients() {
    const { data, error } = await supabase
        .from('CLIENTE_EM')
        .select('*')
        .order('ID', { ascending: false });

    const container = document.getElementById('clients-list');
    
    if (error) {
        container.innerHTML = '<div class="empty-state">Error al cargar clientes</div>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay clientes registrados</div>';
        return;
    }

    container.innerHTML = data.map(client => `
        <div class="client-card">
            <div class="client-icon">👤</div>
            <div class="client-info">
                <h3>${client.NOMBRE} ${client.APELLIDO}</h3>
                <p>${client.TELEFONO || 'Sin teléfono'}</p>
                <div class="client-id">ID: ${client.ID}</div>
            </div>
        </div>
    `).join('');
}

function showClientForm() {
    document.getElementById('client-form-container').classList.remove('hidden');
}

function hideClientForm() {
    document.getElementById('client-form-container').classList.add('hidden');
    document.getElementById('client-form').reset();
}

async function handleClientSubmit(e) {
    e.preventDefault();
    
    const clientData = {
        NOMBRE: document.getElementById('client-name').value,
        APELLIDO: document.getElementById('client-lastname').value,
        TELEFONO: document.getElementById('client-phone').value
    };

    const { error } = await supabase
        .from('CLIENTE_EM')
        .insert([clientData]);

    if (error) {
        alert('Error al registrar cliente: ' + error.message);
    } else {
        alert('Cliente registrado exitosamente');
        hideClientForm();
        loadClients();
    }
}

// ============ ORDERS ============
async function loadOrders() {
    const { data, error } = await supabase
        .from('PEDIDO_EM')
        .select(`
            *,
            CLIENTE_EM (NOMBRE, APELLIDO),
            DETALLE_PEDIDO_EM (
                *,
                PRODUCTO_EM (NOMBRE)
            )
        `)
        .order('ID', { ascending: false });

    const container = document.getElementById('orders-list');
    
    if (error) {
        container.innerHTML = '<div class="empty-state">Error al cargar pedidos</div>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay pedidos registrados</div>';
        return;
    }

    container.innerHTML = data.map(order => {
        const details = order.DETALLE_PEDIDO_EM || [];
        const detailsHtml = details.length > 0 ? `
            <div class="order-items">
                <p>Productos:</p>
                <ul>
                    ${details.map(d => `
                        <li>• ${d.PRODUCTO_EM?.NOMBRE || 'Desconocido'} (x${d.CANTIDAD}) - $${parseFloat(d.TOTAL).toFixed(2)}</li>
                    `).join('')}
                </ul>
            </div>
        ` : '';

        return `
            <div class="order-card">
                <div class="order-icon">🛒</div>
                <div class="order-content">
                    <div class="order-header">
                        <div>
                            <div class="order-title">Pedido #${order.ID}</div>
                            <div class="order-client">Cliente: ${order.CLIENTE_EM?.NOMBRE || ''} ${order.CLIENTE_EM?.APELLIDO || ''}</div>
                            <div class="order-date">Fecha: ${new Date(order.FECHAPEDIDO).toLocaleString('es-ES')}</div>
                        </div>
                        <div class="order-total">$${parseFloat(order.TOTAL).toFixed(2)}</div>
                    </div>
                    ${detailsHtml}
                </div>
            </div>
        `;
    }).join('');
}

async function showOrderForm() {
    document.getElementById('order-form-container').classList.remove('hidden');
    orderItems = [];
    await loadClientsForOrder();
    await loadProductsForOrder();
    updateOrderItemsDisplay();
}

function hideOrderForm() {
    document.getElementById('order-form-container').classList.add('hidden');
    document.getElementById('order-form').reset();
    orderItems = [];
}

async function loadClientsForOrder() {
    const { data } = await supabase
        .from('CLIENTE_EM')
        .select('*')
        .order('NOMBRE', { ascending: true });

    const select = document.getElementById('order-client');
    select.innerHTML = '<option value="">Seleccionar cliente</option>' +
        (data || []).map(c => `<option value="${c.ID}">${c.NOMBRE} ${c.APELLIDO}</option>`).join('');
}

async function loadProductsForOrder() {
    const { data } = await supabase
        .from('PRODUCTO_EM')
        .select('*')
        .order('NOMBRE', { ascending: true });

    const select = document.getElementById('order-product');
    select.innerHTML = '<option value="">Seleccionar producto</option>' +
        (data || []).map(p => `<option value="${p.ID}" data-price="${p.PRECIO}">${p.NOMBRE} - $${parseFloat(p.PRECIO).toFixed(2)}</option>`).join('');
}

function addProductToOrder() {
    const select = document.getElementById('order-product');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const productId = parseInt(selectedOption.value);
        const productName = selectedOption.text.split(' - ')[0];
        const price = parseFloat(selectedOption.dataset.price);

        orderItems.push({
            productId,
            name: productName,
            quantity: 1,
            price
        });

        updateOrderItemsDisplay();
        select.value = '';
    }
}

function updateOrderItemsDisplay() {
    const container = document.getElementById('order-items');
    
    if (orderItems.length === 0) {
        container.innerHTML = '';
        return;
    }

    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    container.innerHTML = orderItems.map((item, index) => `
        <div class="order-item">
            <span class="order-item-name">${item.name}</span>
            <input type="number" min="1" value="${item.quantity}" 
                   class="order-item-qty" onchange="updateOrderItemQuantity(${index}, this.value)">
            <span class="order-item-total">$${(item.price * item.quantity).toFixed(2)}</span>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeOrderItem(${index})">🗑️</button>
        </div>
    `).join('') + `
        <div class="order-total-row">
            Total: $${total.toFixed(2)}
        </div>
    `;
}

function updateOrderItemQuantity(index, quantity) {
    orderItems[index].quantity = parseInt(quantity) || 1;
    updateOrderItemsDisplay();
}

function removeOrderItem(index) {
    orderItems.splice(index, 1);
    updateOrderItemsDisplay();
}

async function handleOrderSubmit(e) {
    e.preventDefault();

    const clientId = document.getElementById('order-client').value;
    
    if (!clientId || orderItems.length === 0) {
        alert('Selecciona un cliente y agrega al menos un producto');
        return;
    }

    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const { data: orderData, error: orderError } = await supabase
        .from('PEDIDO_EM')
        .insert([{
            CLIENTE_ID: parseInt(clientId),
            TOTAL: total,
            FECHAPEDIDO: new Date().toISOString()
        }])
        .select()
        .single();

    if (orderError) {
        alert('Error al crear pedido: ' + orderError.message);
        return;
    }

    // Create order details
    const details = orderItems.map(item => ({
        PEDIDO_ID: orderData.ID,
        PRODUCTO_ID: item.productId,
        CANTIDAD: item.quantity,
        PRECIO_UNITARIO: item.price,
        TOTAL: item.price * item.quantity
    }));

    const { error: detailsError } = await supabase
        .from('DETALLE_PEDIDO_EM')
        .insert(details);

    if (detailsError) {
        alert('Error al crear detalles del pedido: ' + detailsError.message);
        return;
    }

    alert('Pedido registrado exitosamente');
    hideOrderForm();
    loadOrders();
}

// ============ VENDORS ============
async function loadVendors() {
    const { data, error } = await supabase
        .from('VENDEDOR_EM')
        .select('*')
        .order('ID', { ascending: false });

    const container = document.getElementById('vendors-list');
    
    if (error) {
        container.innerHTML = '<div class="empty-state">Error al cargar vendedores</div>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay vendedores registrados</div>';
        return;
    }

    container.innerHTML = data.map(vendor => `
        <div class="vendor-card">
            <div class="vendor-icon">👤</div>
            <div class="vendor-info">
                <h3>${vendor.NOMBRE}</h3>
                <div class="vendor-email">${vendor.EMAIL}</div>
                <span class="vendor-role ${vendor.ROLE}">${vendor.ROLE === 'admin' ? 'Administrador' : 'Vendedor'}</span>
                <div>
                    <button class="btn btn-sm btn-danger" onclick="deleteVendor(${vendor.ID}, '${vendor.NOMBRE}')">🗑️ Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showVendorForm() {
    document.getElementById('vendor-form-container').classList.remove('hidden');
}

function hideVendorForm() {
    document.getElementById('vendor-form-container').classList.add('hidden');
    document.getElementById('vendor-form').reset();
}

async function handleVendorSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('vendor-name').value;
    const email = document.getElementById('vendor-email').value;
    const password = document.getElementById('vendor-password').value;
    const role = document.getElementById('vendor-role').value;

    try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) throw authError;

        if (authData.user) {
            // Create vendor entry
            const { error: vendorError } = await supabase
                .from('VENDEDOR_EM')
                .insert([{
                    USER_ID: authData.user.id,
                    NOMBRE: name,
                    EMAIL: email,
                    ROLE: role
                }]);

            if (vendorError) throw vendorError;

            alert('Vendedor creado exitosamente');
            hideVendorForm();
            loadVendors();
        }
    } catch (err) {
        alert('Error al crear vendedor: ' + err.message);
    }
}

async function deleteVendor(id, name) {
    if (confirm(`¿Estás seguro de eliminar a ${name}?`)) {
        const { error } = await supabase
            .from('VENDEDOR_EM')
            .delete()
            .eq('ID', id);

        if (error) {
            alert('Error al eliminar vendedor: ' + error.message);
        } else {
            alert('Vendedor eliminado exitosamente');
            loadVendors();
        }
    }
}

// ============ REPORTS ============
async function loadReports() {
    await loadStats();
    await loadTopProducts();
    await loadRecentOrders();
}

async function loadStats() {
    // Count products
    const { count: productCount } = await supabase
        .from('PRODUCTO_EM')
        .select('*', { count: 'exact', head: true });

    // Count clients
    const { count: clientCount } = await supabase
        .from('CLIENTE_EM')
        .select('*', { count: 'exact', head: true });

    // Count orders and calculate revenue
    const { data: orders } = await supabase
        .from('PEDIDO_EM')
        .select('TOTAL');

    const orderCount = orders?.length || 0;
    const revenue = orders?.reduce((sum, order) => sum + parseFloat(order.TOTAL), 0) || 0;

    document.getElementById('stat-products').textContent = productCount || 0;
    document.getElementById('stat-clients').textContent = clientCount || 0;
    document.getElementById('stat-orders').textContent = orderCount;
    document.getElementById('stat-revenue').textContent = '$' + revenue.toFixed(2);
}

async function loadTopProducts() {
    const { data } = await supabase
        .from('DETALLE_PEDIDO_EM')
        .select(`
            PRODUCTO_ID,
            CANTIDAD,
            PRODUCTO_EM (NOMBRE)
        `);

    if (!data || data.length === 0) return;

    const productMap = {};
    data.forEach(item => {
        const id = item.PRODUCTO_ID;
        if (!productMap[id]) {
            productMap[id] = {
                name: item.PRODUCTO_EM?.NOMBRE || 'Desconocido',
                quantity: 0
            };
        }
        productMap[id].quantity += item.CANTIDAD;
    });

    const topProducts = Object.values(productMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    // Bar Chart
    const ctx1 = document.getElementById('products-chart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: topProducts.map(p => p.name),
                datasets: [{
                    label: 'Cantidad Vendida',
                    data: topProducts.map(p => p.quantity),
                    backgroundColor: '#16a34a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }

    // Pie Chart
    const ctx2 = document.getElementById('sales-chart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: topProducts.map(p => p.name),
                datasets: [{
                    data: topProducts.map(p => p.quantity),
                    backgroundColor: [
                        '#16a34a',
                        '#22c55e',
                        '#4ade80',
                        '#86efac',
                        '#bbf7d0'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }
}

async function loadRecentOrders() {
    const { data } = await supabase
        .from('PEDIDO_EM')
        .select(`
            *,
            CLIENTE_EM (NOMBRE, APELLIDO)
        `)
        .order('FECHAPEDIDO', { ascending: false })
        .limit(5);

    const container = document.getElementById('recent-orders');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay pedidos recientes</div>';
        return;
    }

    container.innerHTML = data.map(order => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 8px;">
            <div>
                <p style="font-size: 14px;">Pedido #${order.ID} - ${order.CLIENTE_EM?.NOMBRE || ''} ${order.CLIENTE_EM?.APELLIDO || ''}</p>
                <p style="font-size: 12px; color: #6b7280;">${new Date(order.FECHAPEDIDO).toLocaleString('es-ES')}</p>
            </div>
            <span style="color: #16a34a; font-weight: 600;">$${parseFloat(order.TOTAL).toFixed(2)}</span>
        </div>
    `).join('');
}
