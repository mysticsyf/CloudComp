// ============================================================
//  Vendor Product Detail Page
//  Reads product ID from URL:  /vendor/product/:id
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // --- Pull product ID from the URL path ---
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    if (!productId || isNaN(productId)) {
        showError('Invalid product ID in URL.');
        return;
    }

    await loadProduct(productId);
    await loadReviews(productId);

    // Wire up action buttons
    document.getElementById('heroEditBtn').addEventListener('click', () => {
        window.location.href = `/vendor/product/${productId}/edit`;
    });

    document.getElementById('heroDeleteBtn').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const res = await fetch(`/api/vendor/product/${productId}`, { method: 'DELETE' });
            if (res.ok) {
                window.location.href = '/products';
            } else {
                alert('Failed to delete product. Please try again.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Could not connect to server.');
        }
    });
});

// ── Load product ─────────────────────────────────────────────

async function loadProduct(productId) {
    try {
        // TODO: Make sure this endpoint exists in your backend (routes/productactions.js or similar)
        // It should return: { id, name, price, stock, rating, description, category, image_url, images[] }
        const res = await fetch(`/api/vendor/product/${productId}`);

        if (!res.ok) {
            showError(`Product not found (${res.status}).`);
            return;
        }

        const product = await res.json();
        renderProduct(product);

    } catch (err) {
        console.error('Failed to load product:', err);
        showError('Could not connect to the server.');
    }
}

function renderProduct(product) {
    document.getElementById('detailLoading').style.display = 'none';
    document.getElementById('productHero').style.display = 'grid';

    // Main image — use first image in array or fallback to image_url
    const images = product.images?.length ? product.images : (product.image_url ? [product.image_url] : []);
    const mainImg = document.getElementById('mainImage');

    if (images.length) {
        mainImg.src = images[0];
        mainImg.alt = product.name;
    } else {
        mainImg.src = '';
        mainImg.alt = 'No image';
        mainImg.style.background = '#e5e7eb';
    }

    // Thumbnail strip
    if (images.length > 1) {
        const strip = document.getElementById('thumbStrip');
        images.forEach((src, i) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Image ${i + 1}`;
            if (i === 0) img.classList.add('active');
            img.addEventListener('click', () => {
                mainImg.src = src;
                strip.querySelectorAll('img').forEach(t => t.classList.remove('active'));
                img.classList.add('active');
            });
            strip.appendChild(img);
        });
    }

    // Text content
    document.getElementById('productCategory').textContent = product.category || 'Uncategorized';
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productPrice').textContent = `RM ${Number(product.price).toFixed(2)}`;
    document.getElementById('productStock').textContent = `${product.stock} units`;
    document.getElementById('productDescription').textContent = product.description || 'No description provided.';

    // Rating row
    const ratingVal = parseFloat(product.rating) || 0;
    document.getElementById('productRating').textContent = ratingVal.toFixed(1) + ' ★';
    document.getElementById('productReviewCount').textContent = `(${product.review_count ?? 0} reviews)`;
    document.getElementById('productSold').textContent = `${product.sold ?? 0} sold`;
}

// ── Load reviews ──────────────────────────────────────────────

async function loadReviews(productId) {
    try {
        // TODO: Make sure this endpoint exists in your backend (routes/reviews.js)
        // It should return an array: [{ username, avatar, rating, comment, created_at, images[] }]
        const res = await fetch(`/api/reviews/${productId}`);

        if (!res.ok) {
            // Non-fatal — just hide the reviews section
            return;
        }

        const reviews = await res.json();
        renderReviews(reviews);

    } catch (err) {
        console.error('Failed to load reviews:', err);
    }
}

function renderReviews(reviews) {
    document.getElementById('reviewsSection').style.display = 'flex';

    if (!reviews.length) {
        document.getElementById('noReviews').style.display = 'block';
        return;
    }

    // Compute aggregate stats
    const total = reviews.length;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

    document.getElementById('avgRating').textContent = avg.toFixed(1);
    document.getElementById('avgStars').textContent = starsString(avg);
    document.getElementById('totalReviews').textContent = `${total} review${total !== 1 ? 's' : ''}`;

    // Rating breakdown (5 → 1)
    const breakdown = document.getElementById('ratingBreakdown');
    for (let star = 5; star >= 1; star--) {
        const count = reviews.filter(r => Math.round(r.rating) === star).length;
        const pct   = total ? (count / total) * 100 : 0;

        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `
            <span class="breakdown-label">${star} ★</span>
            <div class="breakdown-bar-bg">
                <div class="breakdown-bar-fill" style="width: ${pct}%"></div>
            </div>
            <span class="breakdown-count">${count}</span>
        `;
        breakdown.appendChild(row);
    }

    // Review cards
    const list = document.getElementById('reviewsList');
    reviews.forEach(review => {
        const card = document.createElement('div');
        card.className = 'review-card';

        const initials = (review.username || 'U').slice(0, 2).toUpperCase();
        const date = new Date(review.created_at).toLocaleDateString('en-MY', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Review images (optional)
        const imagesHtml = review.images?.length
            ? `<div class="review-images">
                ${review.images.map(src => `<img src="${src}" alt="Review image">`).join('')}
               </div>`
            : '';

        card.innerHTML = `
            <div class="review-avatar">
                ${review.avatar
                    ? `<img src="${review.avatar}" alt="${review.username}">`
                    : initials
                }
            </div>
            <div class="review-body">
                <div class="review-top-row">
                    <span class="review-username">${review.username}</span>
                    <span class="review-stars">${starsString(review.rating)}</span>
                    <span class="review-date">${date}</span>
                </div>
                <p class="review-text">${review.comment || ''}</p>
                ${imagesHtml}
            </div>
        `;
        list.appendChild(card);
    });
}

// ── Helpers ───────────────────────────────────────────────────

function starsString(rating) {
    const full  = Math.round(rating);
    const empty = 5 - full;
    return '★'.repeat(full) + '☆'.repeat(empty);
}

function showError(msg) {
    document.getElementById('detailLoading').style.display = 'none';
    const el = document.getElementById('detailError');
    el.textContent = '⚠ ' + msg;
    el.style.display = 'block';
}// ============================================================
//  Vendor Product Detail Page
//  Reads product ID from URL:  /vendor/product/:id
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // --- Pull product ID from the URL path ---
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    if (!productId || isNaN(productId)) {
        showError('Invalid product ID in URL.');
        return;
    }

    await loadProduct(productId);
    await loadReviews(productId);

    // Wire up action buttons
    document.getElementById('heroEditBtn').addEventListener('click', () => {
        window.location.href = `/vendor/product/${productId}/edit`;
    });

    document.getElementById('heroDeleteBtn').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const res = await fetch(`/api/vendor/product/${productId}`, { method: 'DELETE' });
            if (res.ok) {
                window.location.href = '/products';
            } else {
                alert('Failed to delete product. Please try again.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Could not connect to server.');
        }
    });
});

// ── Load product ─────────────────────────────────────────────

async function loadProduct(productId) {
    try {
        // TODO: Make sure this endpoint exists in your backend (routes/productactions.js or similar)
        // It should return: { id, name, price, stock, rating, description, category, image_url, images[] }
        const res = await fetch(`/api/vendor/product/${productId}`);

        if (!res.ok) {
            showError(`Product not found (${res.status}).`);
            return;
        }

        const product = await res.json();
        renderProduct(product);

    } catch (err) {
        console.error('Failed to load product:', err);
        showError('Could not connect to the server.');
    }
}

function renderProduct(product) {
    document.getElementById('detailLoading').style.display = 'none';
    document.getElementById('productHero').style.display = 'grid';

    // Main image — use first image in array or fallback to image_url
    const images = product.images?.length ? product.images : (product.image_url ? [product.image_url] : []);
    const mainImg = document.getElementById('mainImage');

    if (images.length) {
        mainImg.src = images[0];
        mainImg.alt = product.name;
    } else {
        mainImg.src = '';
        mainImg.alt = 'No image';
        mainImg.style.background = '#e5e7eb';
    }

    // Thumbnail strip
    if (images.length > 1) {
        const strip = document.getElementById('thumbStrip');
        images.forEach((src, i) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Image ${i + 1}`;
            if (i === 0) img.classList.add('active');
            img.addEventListener('click', () => {
                mainImg.src = src;
                strip.querySelectorAll('img').forEach(t => t.classList.remove('active'));
                img.classList.add('active');
            });
            strip.appendChild(img);
        });
    }

    // Text content
    document.getElementById('productCategory').textContent = product.category || 'Uncategorized';
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productPrice').textContent = `RM ${Number(product.price).toFixed(2)}`;
    document.getElementById('productStock').textContent = `${product.stock} units`;
    document.getElementById('productDescription').textContent = product.description || 'No description provided.';

    // Rating row
    const ratingVal = parseFloat(product.rating) || 0;
    document.getElementById('productRating').textContent = ratingVal.toFixed(1) + ' ★';
    document.getElementById('productReviewCount').textContent = `(${product.review_count ?? 0} reviews)`;
    document.getElementById('productSold').textContent = `${product.sold ?? 0} sold`;
}

// ── Load reviews ──────────────────────────────────────────────

async function loadReviews(productId) {
    try {
        // TODO: Make sure this endpoint exists in your backend (routes/reviews.js)
        // It should return an array: [{ username, avatar, rating, comment, created_at, images[] }]
        const res = await fetch(`/api/reviews/${productId}`);

        if (!res.ok) {
            // Non-fatal — just hide the reviews section
            return;
        }

        const reviews = await res.json();
        renderReviews(reviews);

    } catch (err) {
        console.error('Failed to load reviews:', err);
    }
}

function renderReviews(reviews) {
    document.getElementById('reviewsSection').style.display = 'flex';

    if (!reviews.length) {
        document.getElementById('noReviews').style.display = 'block';
        return;
    }

    // Compute aggregate stats
    const total = reviews.length;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

    document.getElementById('avgRating').textContent = avg.toFixed(1);
    document.getElementById('avgStars').textContent = starsString(avg);
    document.getElementById('totalReviews').textContent = `${total} review${total !== 1 ? 's' : ''}`;

    // Rating breakdown (5 → 1)
    const breakdown = document.getElementById('ratingBreakdown');
    for (let star = 5; star >= 1; star--) {
        const count = reviews.filter(r => Math.round(r.rating) === star).length;
        const pct   = total ? (count / total) * 100 : 0;

        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `
            <span class="breakdown-label">${star} ★</span>
            <div class="breakdown-bar-bg">
                <div class="breakdown-bar-fill" style="width: ${pct}%"></div>
            </div>
            <span class="breakdown-count">${count}</span>
        `;
        breakdown.appendChild(row);
    }

    // Review cards
    const list = document.getElementById('reviewsList');
    reviews.forEach(review => {
        const card = document.createElement('div');
        card.className = 'review-card';

        const initials = (review.username || 'U').slice(0, 2).toUpperCase();
        const date = new Date(review.created_at).toLocaleDateString('en-MY', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Review images (optional)
        const imagesHtml = review.images?.length
            ? `<div class="review-images">
                ${review.images.map(src => `<img src="${src}" alt="Review image">`).join('')}
               </div>`
            : '';

        card.innerHTML = `
            <div class="review-avatar">
                ${review.avatar
                    ? `<img src="${review.avatar}" alt="${review.username}">`
                    : initials
                }
            </div>
            <div class="review-body">
                <div class="review-top-row">
                    <span class="review-username">${review.username}</span>
                    <span class="review-stars">${starsString(review.rating)}</span>
                    <span class="review-date">${date}</span>
                </div>
                <p class="review-text">${review.comment || ''}</p>
                ${imagesHtml}
            </div>
        `;
        list.appendChild(card);
    });
}

// ── Helpers ───────────────────────────────────────────────────

function starsString(rating) {
    const full  = Math.round(rating);
    const empty = 5 - full;
    return '★'.repeat(full) + '☆'.repeat(empty);
}

function showError(msg) {
    document.getElementById('detailLoading').style.display = 'none';
    const el = document.getElementById('detailError');
    el.textContent = '⚠ ' + msg;
    el.style.display = 'block';
}