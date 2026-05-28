// Logika Autentikasi Pengguna

document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.getElementById('togglePassword');
    const loginForm = document.getElementById('loginForm');
    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const errorMsg = document.getElementById('loginError');

    // Ubah Visibilitas Kata Sandi
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            if (loginPasswordInput.type === 'password') {
                loginPasswordInput.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                loginPasswordInput.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    }

    // Tangani Pengiriman Form Login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    localStorage.setItem('loggedInRole', data.role);
                    errorMsg.style.display = 'none';
                    window.location.href = 'dashboard.html'; // Alihkan Ke Halaman Dashboard
                } else {
                    errorMsg.textContent = data.message || 'Username atau Password salah!';
                    errorMsg.style.display = 'block';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMsg.textContent = 'Gagal terhubung ke server autentikasi!';
                errorMsg.style.display = 'block';
            }
        });
    }
});
