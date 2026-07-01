document.addEventListener("DOMContentLoaded", async () => {
    const vendorId = 1; // Replace with actual logged-in vendor ID

    try {
        const response = await fetch(`/api/vendor/orders/${vendorId}`);
        if (!response.ok) throw new Error('Server Error');

        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        console.error('Failed to load orders:', error);
        document.getElementById('ordersList').innerHTML = '<p>Failed to load orders.</p>';
    }

    // Search and Filter Listeners
    document.getElementById('orderSearchInput').addEventListener('input', filterOrders);
    document.getElementById('orderFilterSelect').addEventListener('change', filterOrders);
});

let allOrders = [];

function renderOrders(orders) {
    allOrders = orders;
    displayOrders(orders);
}

function displayOrders(orders) {
    const list = document.getElementById('ordersList');
    list.innerHTML = '';

    if (orders.length === 0) {
        list.innerHTML = '<p>No orders found.</p>';
        return;
    }

    orders.forEach(order => {
        // Convert the "Item x1 | Item x2" string into HTML with line breaks
        const itemsHtml = order.items.split('|').map(item => `<div>${item}</div>`).join('');
        
        // Format Order ID to look like "T01", "T02"
        const formattedId = `T${String(order.order_id).padStart(2, '0')}`;

        const row = document.createElement('div');
        row.className = 'order-row';
        row.innerHTML = `
            <div class="order-id-col">${formattedId}</div>
            
            <div class="order-customer-col">${order.customer_name}</div>
            
            <div class="order-items-col">${itemsHtml}</div>
            
            <div>
                <span class="order-status-badge">${order.status}</span>
            </div>
            
            <div class="order-actions-col">
            <button class="btn-action btn-view" onclick="window.location.href='/tracking/${order.order_id}'">VIEW</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function filterOrders() {
    const query = document.getElementById('orderSearchInput').value.toLowerCase();
    const filter = document.getElementById('orderFilterSelect').value.toLowerCase();

    let filtered = allOrders.filter(o => {
        const orderIdStr = `t${String(o.order_id).padStart(2, '0')}`;
        const nameMatch = o.customer_name.toLowerCase().includes(query);
        const idMatch = orderIdStr.includes(query) || String(o.order_id).includes(query);
        return nameMatch || idMatch;
    });

    if (filter) {
        filtered = filtered.filter(o => o.status.toLowerCase() === filter);
    }

    displayOrders(filtered);
}