// Estado de la aplicación (sin autenticación)
let currentView = 'products';
let editingProductId = null;
let orderItems = [];

// Datos en memoria
let products = [
    { id: 1, nombre: 'Manzanas Orgánicas', descripcion: 'Manzanas frescas cultivadas sin pesticidas', precio: 3.50 },
    { id: 2, nombre: 'Tomates Cherry', descripcion: 'Tomates cherry orgánicos de invernadero', precio: 4.20 },
    { id: 3, nombre: 'Lechuga Hidropónica', descripcion: 'Lechuga fresca cultivada hidropónicamente', precio: 2.80 },
    { id: 4, nombre: 'Zanahorias Orgánicas', descripcion: 'Zanahorias cultivadas sin químicos', precio: 2.50 },
    { id: 5, nombre: 'Espinacas Frescas', descripcion: 'Espinacas orgánicas recién cosechadas', precio: 3.00 }
];

let clients = [
    { id: 1, nombre: 'Juan', apellido: 'Pérez', telefono: '555-0101' },
    { id: 2, nombre: 'María', apellido: 'González', telefono: '555-0102' },
    { id: 3, nombre: 'Carlos', apellido: 'Rodríguez', telefono: '555-0103' },
    { id: 4, nombre: 'Ana', apellido: 'Martínez', telefono: '555-0104' }
];

let orders = [
    {
        id: 1,
        clienteId: 1,
        clienteNombre: 'Juan Pérez',
        total: 15.40,
        fechaPedido: '2025-10-20T10:30:00',
        detalles: [
            { productoId: 1, productoNombre: 'Manzanas Orgánicas', cantidad: 2, precioUnitario: 3.50, total: 7.00 },
            { productoId: 2, productoNombre: 'Tomates Cherry', cantidad: 2, precioUnitario: 4.20, total: 8.40 }
        ]
    },
    {
        id: 2,
        clienteId: 2,
        clienteNombre: 'María González',
        total: 11.30,
        fechaPedido: '2025-10-21T14:15:00',
        detalles: [
            { productoId: 3, productoNombre: 'Lechuga Hidropónica', cantidad: 1, precioUnitario: 2.80, total: 2.80 },
            { productoId: 4, productoNombre: 'Zanahorias Orgánicas', cantidad: 2, precioUnitario: 2.50, total: 5.00 },
            { productoId: 5, productoNombre: 'Espinacas Frescas', cantidad: 1, precioUnitario: 3.00, total: 3.00 }
        ]
    },
    {
        id: 3,
        clienteId: 3,
        clienteNombre: 'Carlos Rodríguez',
        total: 18.60,
        fechaPedido: '2025-10-22T09:45:00',
        detalles: [
            { productoId: 1, productoNombre: 'Manzanas Orgánicas', cantidad: 3, precioUnitario: 3.50, total: 10.50 },
            { productoId: 2, productoNombre: 'Tomates Cherry', cantidad: 1, precioUnitario: 4.20, total: 4.20 },
            { productoId: 5, productoNombre: 'Espinacas Frescas', cantidad: 1, precioUnitario: 3.00, total: 3.00 }
        ]
    }
];

let vendors = [
    { id: 1, nombre: 'Admin Principal', email: 'admin@ecomarket.com', role: 'admin' },
    { id: 2, nombre: 'Pedro Sánchez', email: 'pedro@ecomarket.com', role: 'vendedor' },
    { id: 3, nombre: 'Laura Torres', email: 'laura@ecomarket.com', role: 'vendedor' }
];

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadProducts();
});

// Event Listeners
function setupEventListeners() {
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

// Switch View
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');

    // Close mobile menu
    document.getElementById('sidebar').classList.remove('show');

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
            loadVendors();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// ============ PRODUCTS ============
function loadProducts() {
    const container = document.getElementById('products-list');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay productos registrados</div>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-header">
                <div class="product-name">${product.nombre}</div>
                <div class="product-price">$${parseFloat(product.precio).toFixed(2)}</div>
            </div>
            <div class="product-description">${product.descripcion || ''}</div>
            <div class="product-actions">
                <button class="btn btn-sm btn-outline" onclick="editProduct(${product.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">🗑️ Eliminar</button>
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

function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        nombre: document.getElementById('product-name').value,
        descripcion: document.getElementById('product-description').value,
        precio: parseFloat(document.getElementById('product-price').value)
    };

    if (editingProductId) {
        const index = products.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            products[index] = { ...productData, id: editingProductId };
        }
        alert('Producto actualizado exitosamente');
    } else {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ ...productData, id: newId });
        alert('Producto creado exitosamente');
    }

    hideProductForm();
    loadProducts();
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        document.getElementById('product-name').value = product.nombre;
        document.getElementById('product-description').value = product.descripcion || '';
        document.getElementById('product-price').value = product.precio;
        document.getElementById('product-form-title').textContent = 'Editar Producto';
        document.getElementById('product-form-container').classList.remove('hidden');
        editingProductId = id;
    }
}

function deleteProduct(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        products = products.filter(p => p.id !== id);
        alert('Producto eliminado exitosamente');
        loadProducts();
    }
}

// ============ CLIENTS ============
function loadClients() {
    const container = document.getElementById('clients-list');
    
    if (clients.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay clientes registrados</div>';
        return;
    }

    container.innerHTML = clients.map(client => `
        <div class="client-card">
            <div class="client-icon">👤</div>
            <div class="client-info">
                <h3>${client.nombre} ${client.apellido}</h3>
                <p>${client.telefono || 'Sin teléfono'}</p>
                <div class="client-id">ID: ${client.id}</div>
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

function handleClientSubmit(e) {
    e.preventDefault();
    
    const clientData = {
        nombre: document.getElementById('client-name').value,
        apellido: document.getElementById('client-lastname').value,
        telefono: document.getElementById('client-phone').value
    };

    const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    clients.push({ ...clientData, id: newId });

    alert('Cliente registrado exitosamente');
    hideClientForm();
    loadClients();
}

// ============ ORDERS ============
function loadOrders() {
    const container = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay pedidos registrados</div>';
        return;
    }

    container.innerHTML = orders.map(order => {
        const details = order.detalles || [];
        const detailsHtml = details.length > 0 ? `
            <div class="order-items">
                <p>Productos:</p>
                <ul>
                    ${details.map(d => `
                        <li>• ${d.productoNombre || 'Desconocido'} (x${d.cantidad}) - $${parseFloat(d.total).toFixed(2)}</li>
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
                            <div class="order-title">Pedido #${order.id}</div>
                            <div class="order-client">Cliente: ${order.clienteNombre || ''}</div>
                            <div class="order-date">Fecha: ${new Date(order.fechaPedido).toLocaleString('es-ES')}</div>
                        </div>
                        <div class="order-total">$${parseFloat(order.total).toFixed(2)}</div>
                    </div>
                    ${detailsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function showOrderForm() {
    document.getElementById('order-form-container').classList.remove('hidden');
    orderItems = [];
    loadClientsForOrder();
    loadProductsForOrder();
    updateOrderItemsDisplay();
}

function hideOrderForm() {
    document.getElementById('order-form-container').classList.add('hidden');
    document.getElementById('order-form').reset();
    orderItems = [];
}

function loadClientsForOrder() {
    const select = document.getElementById('order-client');
    select.innerHTML = '<option value="">Seleccionar cliente</option>' +
        clients.map(c => `<option value="${c.id}">${c.nombre} ${c.apellido}</option>`).join('');
}

function loadProductsForOrder() {
    const select = document.getElementById('order-product');
    select.innerHTML = '<option value="">Seleccionar producto</option>' +
        products.map(p => `<option value="${p.id}" data-price="${p.precio}">${p.nombre} - $${parseFloat(p.precio).toFixed(2)}</option>`).join('');
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

function handleOrderSubmit(e) {
    e.preventDefault();

    const clientId = parseInt(document.getElementById('order-client').value);
    
    if (!clientId || orderItems.length === 0) {
        alert('Selecciona un cliente y agrega al menos un producto');
        return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    
    orders.push({
        id: newId,
        clienteId: clientId,
        clienteNombre: `${client.nombre} ${client.apellido}`,
        total: total,
        fechaPedido: new Date().toISOString(),
        detalles: orderItems.map(item => ({
            productoId: item.productId,
            productoNombre: item.name,
            cantidad: item.quantity,
            precioUnitario: item.price,
            total: item.price * item.quantity
        }))
    });

    alert('Pedido registrado exitosamente');
    hideOrderForm();
    loadOrders();
}

// ============ VENDORS ============
function loadVendors() {
    const container = document.getElementById('vendors-list');
    
    if (vendors.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay vendedores registrados</div>';
        return;
    }

    container.innerHTML = vendors.map(vendor => `
        <div class="vendor-card">
            <div class="vendor-icon">👤</div>
            <div class="vendor-info">
                <h3>${vendor.nombre}</h3>
                <div class="vendor-email">${vendor.email}</div>
                <span class="vendor-role ${vendor.role}">${vendor.role === 'admin' ? 'Administrador' : 'Vendedor'}</span>
                <div>
                    <button class="btn btn-sm btn-danger" onclick="deleteVendor(${vendor.id}, '${vendor.nombre}')">🗑️ Eliminar</button>
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

function handleVendorSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('vendor-name').value;
    const email = document.getElementById('vendor-email').value;
    const role = document.getElementById('vendor-role').value;

    const newId = vendors.length > 0 ? Math.max(...vendors.map(v => v.id)) + 1 : 1;
    
    vendors.push({
        id: newId,
        nombre: name,
        email: email,
        role: role
    });

    alert('Vendedor creado exitosamente');
    hideVendorForm();
    loadVendors();
}

function deleteVendor(id, name) {
    if (confirm(`¿Estás seguro de eliminar a ${name}?`)) {
        vendors = vendors.filter(v => v.id !== id);
        alert('Vendedor eliminado exitosamente');
        loadVendors();
    }
}

// ============ REPORTS ============
function loadReports() {
    loadStats();
    loadTopProducts();
    loadRecentOrders();
}

function loadStats() {
    const productCount = products.length;
    const clientCount = clients.length;
    const orderCount = orders.length;
    const revenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    document.getElementById('stat-products').textContent = productCount;
    document.getElementById('stat-clients').textContent = clientCount;
    document.getElementById('stat-orders').textContent = orderCount;
    document.getElementById('stat-revenue').textContent = '$' + revenue.toFixed(2);
}

function loadTopProducts() {
    const productMap = {};
    
    orders.forEach(order => {
        (order.detalles || []).forEach(item => {
            const id = item.productoId;
            if (!productMap[id]) {
                productMap[id] = {
                    name: item.productoNombre || 'Desconocido',
                    quantity: 0
                };
            }
            productMap[id].quantity += item.cantidad;
        });
    });

    const topProducts = Object.values(productMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    // Bar Chart
    const ctx1 = document.getElementById('products-chart');
    if (ctx1 && topProducts.length > 0) {
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
    if (ctx2 && topProducts.length > 0) {
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

function loadRecentOrders() {
    const container = document.getElementById('recent-orders');
    const recentOrders = orders.slice(-5).reverse();
    
    if (recentOrders.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay pedidos recientes</div>';
        return;
    }

    container.innerHTML = recentOrders.map(order => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 8px;">
            <div>
                <p style="font-size: 14px;">Pedido #${order.id} - ${order.clienteNombre || ''}</p>
                <p style="font-size: 12px; color: #6b7280;">${new Date(order.fechaPedido).toLocaleString('es-ES')}</p>
            </div>
            <span style="color: #16a34a; font-weight: 600;">$${parseFloat(order.total).toFixed(2)}</span>
        </div>
    `).join('');
}
