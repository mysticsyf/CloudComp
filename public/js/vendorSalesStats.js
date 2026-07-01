const VENDOR_ID = 1;

let lineChart     = null;
let doughnutChart = null;
let currentRange  = 7;

const CHART_COLORS = [
    '#f25a1d', '#3b82f6', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

// ── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Range tab clicks
    document.getElementById('rangeTabs').addEventListener('click', e => {
        const btn = e.target.closest('.range-btn');
        if (!btn) return;

        document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRange = parseInt(btn.dataset.range);
        loadStats(currentRange);
    });

    // Initial load
    loadStats(currentRange);
});

// ── Data Fetching ─────────────────────────────────────────────
async function loadStats(range) {
    try {
        const res = await fetch(`/api/vendor/stats/${VENDOR_ID}?range=${range}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        renderAll(data);
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

// ── Render Everything ─────────────────────────────────────────
function renderAll(data) {
    renderKPIs(data.summary);
    renderLineChart(data.revenueByDay);
    renderDoughnutChart(data.productSales);
    renderTable(data.productSales, data.summary.totalRevenue);
}

// ── KPI Cards ─────────────────────────────────────────────────
function renderKPIs(summary) {
    const revenue = Number(summary.totalRevenue || 0);
    const orders  = Number(summary.totalOrders  || 0);
    const aov     = orders > 0 ? revenue / orders : 0;
    const rating  = parseFloat(summary.averageRating || 0).toFixed(1);

    document.getElementById('kpi-revenue').textContent = `RM ${revenue.toFixed(2)}`;
    document.getElementById('kpi-orders').textContent  = orders;
    document.getElementById('kpi-aov').textContent     = `RM ${aov.toFixed(2)}`;
    document.getElementById('kpi-rating').innerHTML    = `${rating} <span class="star">★</span>`;
}

// ── Line Chart: Revenue Over Time ─────────────────────────────
function renderLineChart(revenueByDay) {
    const labels = revenueByDay.map(row => {
        const d = new Date(row.day);
        return d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
    });
    const values = revenueByDay.map(row => Number(row.revenue));

    if (lineChart) lineChart.destroy();

    const ctx = document.getElementById('revenueLineChart').getContext('2d');
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Revenue (RM)',
                data: values,
                borderColor: '#f25a1d',
                backgroundColor: 'rgba(242, 90, 29, 0.08)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#f25a1d',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a1f36',
                    padding: 12,
                    callbacks: {
                        label: ctx => ` RM ${Number(ctx.parsed.y).toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#e3e8ee', borderDash: [4, 4] },
                    border: { display: false },
                    ticks: {
                        callback: val => `RM ${val}`
                    }
                },
                x: {
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
}

// ── Doughnut Chart: Sales by Product ─────────────────────────
function renderDoughnutChart(productSales) {
    const top = productSales.slice(0, 7);  // max 7 slices
    const labels = top.map(p => p.name);
    const values = top.map(p => Number(p.units));
    const totalUnits = values.reduce((a, b) => a + b, 0);

    if (doughnutChart) doughnutChart.destroy();

    const ctx = document.getElementById('productDoughnutChart').getContext('2d');
    doughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: CHART_COLORS.slice(0, top.length),
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const pct = totalUnits > 0
                                ? ((ctx.parsed / totalUnits) * 100).toFixed(1)
                                : 0;
                            return ` ${ctx.label}: ${ctx.parsed} units (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // Custom legend
    const legend = document.getElementById('doughnutLegend');
    legend.innerHTML = '';
    top.forEach((product, i) => {
        const pct = totalUnits > 0 ? ((Number(product.units) / totalUnits) * 100).toFixed(1) : 0;
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <span class="legend-dot" style="background:${CHART_COLORS[i]}"></span>
            <span>${product.name}</span>
            <span class="legend-pct">${pct}%</span>
        `;
        legend.appendChild(item);
    });
}

// ── Product Breakdown Table ───────────────────────────────────
function renderTable(productSales, totalRevenue) {
    const tbody = document.getElementById('productTableBody');
    const total = Number(totalRevenue || 0);

    if (!productSales.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No sales data for this period.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    productSales.forEach((product, i) => {
        const revenue = Number(product.revenue || 0);
        const units   = Number(product.units   || 0);
        const rating  = parseFloat(product.avg_rating || 0);
        const share   = total > 0 ? ((revenue / total) * 100).toFixed(1) : 0;
        const stars   = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="rank-badge ${rankClass}">${i + 1}</span></td>
            <td><strong>${product.name}</strong></td>
            <td>${units.toLocaleString()}</td>
            <td>RM ${revenue.toFixed(2)}</td>
            <td>
                <span class="rating-stars-sm">${stars}</span>
                <span style="font-size:0.78rem;color:#8792a2;margin-left:4px">
                    ${rating > 0 ? rating.toFixed(1) : '—'}
                </span>
            </td>
            <td>
                <div class="share-bar-wrap">
                    <div class="share-bar-bg">
                        <div class="share-bar-fill" style="width:${share}%"></div>
                    </div>
                    <span class="share-pct">${share}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}