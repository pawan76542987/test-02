// Main Application Client Scripts - Responsive Navigation & Interactivity
document.addEventListener('DOMContentLoaded', () => {
  // 1. Toast Notifications Auto-Hide
  const toasts = document.querySelectorAll('.toast');
  toasts.forEach((toast) => {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 5000);

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
      });
    }
  });

  // 2. Mobile Sidebar & Backdrop Drawer System
  const mobileToggle = document.getElementById('mobileNavToggle');
  const sidebar = document.getElementById('appSidebar') || document.querySelector('.app-sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const sidebarClose = document.getElementById('sidebarCloseBtn');

  const openSidebar = () => {
    if (sidebar) sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scrolling on mobile
  };

  const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (mobileToggle) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar && sidebar.classList.contains('mobile-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Close mobile drawer when clicking any nav link on mobile
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  });

  // ESC key handler to close sidebar drawer and active modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.keyCode === 27) {
      if (sidebar && sidebar.classList.contains('mobile-open')) {
        closeSidebar();
      }
      document.querySelectorAll('.modal-backdrop.active').forEach((modal) => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
  });

  // Reset body overflow on window resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      closeSidebar();
    }
  });

  // 3. Password Visibility Toggle
  const togglePasswordBtns = document.querySelectorAll('.password-toggle-btn');
  togglePasswordBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input && input.type) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>`;
        } else {
          input.type = 'password';
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>`;
        }
      }
    });
  });

  // 4. Modal Triggers & Responsive Modal Close
  const modalTriggers = document.querySelectorAll('[data-modal-target]');
  const modalCloseBtns = document.querySelectorAll('[data-modal-close]');

  modalTriggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal-target');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  modalCloseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach((modalBackdrop) => {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // 5. Return Unit Breakdown Synchronizer
  const returnForm = document.getElementById('returnForm');
  if (returnForm) {
    const totalInput = document.getElementById('totalUnits');
    const okInput = document.getElementById('okUnits');
    const damagedInput = document.getElementById('damagedUnits');
    const lostInput = document.getElementById('lostUnits');
    const conditionSelect = document.getElementById('conditionSelect');

    const updateBreakdown = () => {
      const total = parseInt(totalInput?.value || 0, 10);
      const condition = conditionSelect?.value;

      if (condition === 'ok') {
        if (okInput) okInput.value = total;
        if (damagedInput) damagedInput.value = 0;
        if (lostInput) lostInput.value = 0;
      } else if (condition === 'damaged') {
        if (okInput) okInput.value = 0;
        if (damagedInput) damagedInput.value = total;
        if (lostInput) lostInput.value = 0;
      } else if (condition === 'lost') {
        if (okInput) okInput.value = 0;
        if (damagedInput) damagedInput.value = 0;
        if (lostInput) lostInput.value = total;
      }
    };

    if (conditionSelect) {
      conditionSelect.addEventListener('change', updateBreakdown);
    }
  }

  // 6. Global Demo Fill Helper
  window.fillDemoCredentials = (email, password) => {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const loginForm = document.getElementById('loginForm');
    if (emailInput && passwordInput) {
      emailInput.value = email;
      passwordInput.value = password;
      if (loginForm) {
        loginForm.submit();
      }
    }
  };
});
