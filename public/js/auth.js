document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        const tabs = document.querySelector('.tabs');
        tabs.setAttribute('data-active', 'login');
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        loadAreas();
        const tabs = document.querySelector('.tabs');
        tabs.setAttribute('data-active', 'register');
    });

    async function loadAreas() {
        const select = document.getElementById('reg-area');
        select.innerHTML = '<option value="">Loading...</option>'; // ✅ FIXED

        try {
            const res = await fetch('/api/areas');
            const data = await res.json();
            select.innerHTML = '<option value="">Select Area</option>' + data.map(area =>
                `<option value="${area.area_id}">${area.area_name}</option>` // ✅ FIXED
            ).join('');
        } catch (err) {
            select.innerHTML = '<option value="">Error loading areas</option>';
        }
    }

    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            console.log("Login Response:", data); // ✅ DEBUG

            if (!res.ok) {
                alert(data.error || 'Login failed. Please check your credentials.');
                return;
            }

            if (data.role === 'corporator') {
                localStorage.setItem('role', 'corporator');
                localStorage.setItem('loggedInCorporator', JSON.stringify({
                    corporator_id: data.corporator_id,
                    full_name: data.full_name,
                    area_id: data.area_id
                }));
                console.log("Redirecting to corporator dashboard...");
                setTimeout(() => {
                    window.location.href = 'corporator-dashboard.html';
                }, 100);
                console.log("Succesful");
            } else {
                localStorage.setItem('role', 'user');
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('username', data.username);
                localStorage.setItem('area_id', data.area_id);
                console.log("Redirecting to user dashboard...");
                setTimeout(() => {
                    window.location.href = 'user-dashboard.html';
                }, 100);
                console.log("Succesful");
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Unexpected error occurred.');
        }
    });

    document.getElementById('register-btn').addEventListener('click', async () => {
        const body = {
            username: document.getElementById('reg-username').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value,
            full_name: document.getElementById('reg-fullname').value,
            area_id: document.getElementById('reg-area').value
        };

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (res.ok) {
                alert('Registration successful! Please login.');
                loginTab.click(); // ✅ Switch to login tab
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            alert('Unexpected error occurred during registration.');
        }
    });
});
