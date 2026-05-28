// Pengendali Halaman Dashboard
// Mengelola Grafik Dan Tabel

document.addEventListener('DOMContentLoaded', async () => {
    // Validasi Sesi Dan Logout
    const loggedInRole = localStorage.getItem('loggedInRole');
    if (!loggedInRole) {
        window.location.href = 'login.html';
        return;
    }
    window.loggedInRole = loggedInRole;

    const navLogout = document.getElementById('nav-logout');
    if (navLogout) {
        navLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                localStorage.removeItem('loggedInRole');
                window.location.href = 'login.html';
            }
        });
    }

    // Atur Tampilan Formulir Marketing
    const bottomRow = document.getElementById('bottomRowContainer');
    if (window.loggedInRole === 'Marketing') {
        if (bottomRow) bottomRow.style.display = 'block';
    } else {
        if (bottomRow) bottomRow.style.display = 'none';
    }

    // Tampilkan Tabel Dan Grafik
    let myChart = null;
    let uploadedFileBase64 = null;

    async function renderTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const products = await window.db.getProducts();

        // Urutkan Sesuai Pembaruan Terbaru
        const sortedProducts = [...products];
        sortedProducts.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

        // Gambar Baris Data Tabel
        sortedProducts.forEach((p, index) => {
            let statusDot = 'dot-progress';
            let inlineColor = '';
            
            if (p.status === 'Selesai') statusDot = 'dot-completed';
            else if (p.status === 'Gagal') statusDot = 'dot-failed';
            else if (p.status === 'Menunggu') { statusDot = ''; inlineColor = '#f59e0b'; }
            else if (p.status === 'Pengerjaan RnD') { statusDot = ''; inlineColor = '#3b82f6'; }
            else if (p.status === 'Pengerjaan Registrasi') { statusDot = ''; inlineColor = '#8b5cf6'; }

            const dotHtml = inlineColor 
                ? `<span class="dot" style="background-color: ${inlineColor};"></span>` 
                : `<span class="dot ${statusDot}"></span>`;

            const cleanDate = p.date ? (p.date.includes('T') ? p.date.split('T')[0] : p.date) : '-';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${(index + 1).toString().padStart(2, '0')}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.client)}&background=random&rounded=true&size=32" alt="avatar">
                        ${p.client}
                    </div>
                </td>
                <td>${cleanDate}</td>
                <td>${p.product}</td>
                <td>
                    ${p.document 
                        ? `<button class="action-btn" onclick="window.viewDocument(${p.id})" style="color: var(--color-progress); margin-bottom: ${p.productBrief ? '5px' : '0'}; display: block;"><i class="fas fa-file-image"></i> Awal</button>` 
                        : '<span style="color: #ccc; display: block;">-</span>'}
                    ${p.productBrief
                        ? `<button class="action-btn" onclick="window.viewBrief(${p.id})" style="color: #9333ea; display: block;"><i class="fas fa-file-image"></i> Final</button>`
                        : ''}
                </td>
                <td>
                    <div class="status-indicator">
                        ${dotHtml}
                        ${p.status}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        updateChart(products);
    }

    function updateChart(products) {
        const total = products.length;
        let waiting = 0, rnd = 0, reg = 0, completed = 0, failed = 0;

        products.forEach(p => {
            if (p.status === 'Selesai') completed++;
            else if (p.status === 'Gagal') failed++;
            else if (p.status === 'Menunggu') waiting++;
            else if (p.status === 'Pengerjaan RnD') rnd++;
            else if (p.status === 'Pengerjaan Registrasi') reg++;
        });

        const totalElement = document.getElementById('totalProducts');
        if (totalElement) totalElement.innerText = total;

        const pWait = total ? Math.round((waiting / total) * 100) : 0;
        const pRnd = total ? Math.round((rnd / total) * 100) : 0;
        const pReg = total ? Math.round((reg / total) * 100) : 0;
        const pComp = total ? Math.round((completed / total) * 100) : 0;
        const pFail = total ? Math.round((failed / total) * 100) : 0;

        const legends = document.querySelectorAll('.legend-percent');
        if (legends.length >= 5) {
            legends[0].innerHTML = `${pWait}%`;
            legends[1].innerHTML = `${pRnd}%`;
            legends[2].innerHTML = `${pReg}%`;
            legends[3].innerHTML = `${pComp}%`;
            legends[4].innerHTML = `${pFail}%`;
        }

        if (myChart) {
            myChart.data.datasets[0].data = [waiting, rnd, reg, completed, failed];
            myChart.update();
        } else {
            const chartCanvas = document.getElementById('statusChart');
            if (chartCanvas) {
                const ctx = chartCanvas.getContext('2d');
                myChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Menunggu', 'Pengerjaan RnD', 'Pengerjaan Registrasi', 'Selesai', 'Gagal/Batal'],
                        datasets: [{
                            data: [waiting, rnd, reg, completed, failed],
                            backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#4ade80', '#ef4444'],
                            borderWidth: 0,
                            cutout: '75%'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => ` ${context.label}: ${context.raw}`
                                }
                            }
                        }
                    }
                });
            }
        }
    }

    // Render Awal Tabel Produk
    await renderTable();

    // Formulir Input Dan Pratinjau
    const documentUpload = document.getElementById('documentUpload');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const hint = document.getElementById('previewHint');
    const removePreviewBtn = document.getElementById('removePreviewBtn');
    const productForm = document.getElementById('productForm');

    if (documentUpload) {
        documentUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    uploadedFileBase64 = evt.target.result;
                    previewImage.src = uploadedFileBase64;
                    previewImage.style.width = '100%';
                    previewImage.style.cursor = 'zoom-in';
                    
                    uploadPrompt.style.display = 'none';
                    previewContainer.style.display = 'block';
                    hint.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removePreviewBtn) {
        removePreviewBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            uploadedFileBase64 = null;
            documentUpload.value = '';
            previewContainer.style.display = 'none';
            hint.style.display = 'none';
            uploadPrompt.style.display = 'flex';
        });
    }

    // Geser Dan Perbesar Gambar
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    if (previewContainer) {
        previewContainer.addEventListener('mousedown', (e) => {
            isDragging = false;
            if (previewImage && previewImage.style.width === 'auto') {
                previewContainer.style.cursor = 'grabbing';
                startX = e.pageX - previewContainer.offsetLeft;
                startY = e.pageY - previewContainer.offsetTop;
                scrollLeft = previewContainer.scrollLeft;
                scrollTop = previewContainer.scrollTop;
            }
        });

        previewContainer.addEventListener('mousemove', (e) => {
            if (e.buttons !== 1) return;
            if (previewImage && previewImage.style.width === 'auto') {
                isDragging = true;
                e.preventDefault();
                const x = e.pageX - previewContainer.offsetLeft;
                const y = e.pageY - previewContainer.offsetTop;
                const walkX = (x - startX) * 1.5;
                const walkY = (y - startY) * 1.5;
                previewContainer.scrollLeft = scrollLeft - walkX;
                previewContainer.scrollTop = scrollTop - walkY;
            }
        });

        previewContainer.addEventListener('mouseup', () => {
            if (previewImage && previewImage.style.width === 'auto') {
                previewContainer.style.cursor = 'grab';
            }
        });

        previewContainer.addEventListener('mouseleave', () => {
            if (previewImage && previewImage.style.width === 'auto') {
                previewContainer.style.cursor = 'default';
            }
        });
    }

    if (previewImage) {
        previewImage.addEventListener('click', function(e) {
            if (isDragging) return;
            if (uploadedFileBase64) {
                if (fullSizeImage) {
                    fullSizeImage.src = uploadedFileBase64;
                    currentDocZoom = 100;
                    fullSizeImage.style.width = currentDocZoom + '%';
                }
                const downloadBtn = document.getElementById('downloadDocBtn');
                if (downloadBtn) {
                    downloadBtn.href = uploadedFileBase64;
                    downloadBtn.download = 'Pratinjau_Briefing_Baru.png';
                }
                if (docModal) {
                    docModal.style.display = 'block';
                }
            }
        });
    }

    // Tangani Pengiriman Data Baru
    if (productForm) {
        productForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const client = document.getElementById('clientName').value.trim();
            const product = document.getElementById('productName').value.trim();

            if (!client || !product) {
                alert("Mohon isi Nama Pemesan dan Nama Produk");
                return;
            }

            await window.db.addProduct(client, product, uploadedFileBase64);
            await renderTable();

            this.reset();
            if (previewContainer) previewContainer.style.display = 'none';
            if (hint) hint.style.display = 'none';
            if (uploadPrompt) uploadPrompt.style.display = 'flex';
            uploadedFileBase64 = null;
        });
    }

    // Pratinjau Dokumen Dan Zoom

    const docModal = document.getElementById('docModal');
    const closeDocBtn = document.querySelector('.close-doc');

    if (closeDocBtn) closeDocBtn.onclick = () => docModal.style.display = 'none';

    window.onclick = function(event) {
        if (event.target == docModal) docModal.style.display = 'none';
    };

    let currentDocZoom = 100;
    const fullSizeImage = document.getElementById('fullSizeImage');

    window.viewDocument = async function(id) {
        const products = await window.db.getProducts();
        const p = products.find(x => x.id === id);
        if (p && p.document) {
            if (fullSizeImage) {
                fullSizeImage.src = p.document;
                currentDocZoom = 100;
                fullSizeImage.style.width = currentDocZoom + '%';
            }
            const downloadBtn = document.getElementById('downloadDocBtn');
            if (downloadBtn) {
                downloadBtn.href = p.document;
                downloadBtn.download = `Dokumen_${p.product.replace(/\s+/g, '_')}.png`;
            }
            if (docModal) docModal.style.display = 'block';
        }
    };

    window.viewBrief = async function(id) {
        const products = await window.db.getProducts();
        const p = products.find(x => x.id === id);
        if (p && p.productBrief) {
            if (fullSizeImage) {
                fullSizeImage.src = p.productBrief;
                currentDocZoom = 100;
                fullSizeImage.style.width = currentDocZoom + '%';
            }
            const downloadBtn = document.getElementById('downloadDocBtn');
            if (downloadBtn) {
                downloadBtn.href = p.productBrief;
                downloadBtn.download = `ProductBrief_${p.product.replace(/\s+/g, '_')}.png`;
            }
            if (docModal) docModal.style.display = 'block';
        }
    };

    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');

    if (zoomInBtn && fullSizeImage) {
        zoomInBtn.addEventListener('click', () => {
            currentDocZoom += 25;
            fullSizeImage.style.width = currentDocZoom + '%';
        });
    }
    if (zoomOutBtn && fullSizeImage) {
        zoomOutBtn.addEventListener('click', () => {
            currentDocZoom = Math.max(25, currentDocZoom - 25);
            fullSizeImage.style.width = currentDocZoom + '%';
        });
    }
});
