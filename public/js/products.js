document.addEventListener("DOMContentLoaded", async () => {
    const vendorId = 1; // Replace with actual logged-in vendor ID

    try {
        const response = await fetch(`/api/vendor/products/${vendorId}`);

        if (!response.ok) {
            showError('Server error: ' + response.status);
            return;
        }

        const products = await response.json();
        renderProducts(products);

    } catch (error) {
        console.error('Failed to load products:', error);
        showError('Could not connect to the database. Please check your server.');
    }

    // --- Search & Filter ---
    document.getElementById('productSearchInput').addEventListener('input', filterProducts);
    document.getElementById('productFilterSelect').addEventListener('change', filterProducts);
});

let allProducts = [];

function renderProducts(products) {
    allProducts = products;
    displayProducts(products);
}

function displayProducts(products) {
    const list = document.getElementById('productsList');
    list.innerHTML = '';

    if (products.length === 0) {
        list.innerHTML = '<p class="no-products">No products found.</p>';
        return;
    }

    products.forEach(product => {
        const row = document.createElement('div');
        row.className = 'product-row';
        row.innerHTML = `
            <div class="product-img">
                ${product.image_url
                    ? `<img src="${product.image_url}" alt="${product.name}" />`
                    : 'IMG'
                }
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${Number(product.price).toFixed(2)}</div>
            <div class="product-stock">${product.stock} pcs</div>
            <div class="product-rating">${product.rating ?? '—'} <span class="star">★</span></div>
            <div class="product-actions">
                <button class="btn-action btn-view" onclick="viewProduct(${product.id})">VIEW</button>
                <button class="btn-action btn-edit" onclick="editProduct(${product.id})">EDIT</button>
                <button class="btn-action btn-del" onclick="deleteProduct(${product.id})">DEL</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function filterProducts() {
    const query = document.getElementById('productSearchInput').value.toLowerCase();
    const filter = document.getElementById('productFilterSelect').value;

    let filtered = allProducts.filter(p => p.name.toLowerCase().includes(query));

    if (filter === 'in-stock')     filtered = filtered.filter(p => p.stock > 10);
    if (filter === 'out-of-stock') filtered = filtered.filter(p => p.stock === 0);
    if (filter === 'low-stock')    filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);

    displayProducts(filtered);
}

function showError(msg) {
    document.getElementById('productsList').innerHTML =
        `<p class="no-products" style="color:#e53e3e;">⚠ ${msg}</p>`;
}

function viewProduct(id) {
    window.location.href = `/vendor/product/${id}`;
}

function editProduct(id) {
    window.location.href = `/vendor/product/${id}/edit`;
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    fetch(`/api/vendor/product/${id}`, { method: 'DELETE' })
        .then(res => {
            if (res.ok) {
                allProducts = allProducts.filter(p => p.id !== id);
                displayProducts(allProducts);
            } else {
                alert('Failed to delete product.');
            }
        })
        .catch(err => console.error('Delete error:', err));
}

document.addEventListener('click', e => {
    if (e.target.closest('#addProductBtn')) {
        window.location.href = '/vendor/product/new';
    }
});
