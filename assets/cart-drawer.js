document.addEventListener('DOMContentLoaded', () => {
  const cartContainer = document.getElementById('CartDrawerSection');
  if (!cartContainer) return;

  // Open Drawer
  const openCart = () => {
    const panel = cartContainer.querySelector('.cart-drawer-panel');
    cartContainer.classList.remove('pointer-events-none', 'opacity-0');
    cartContainer.classList.add('opacity-100', 'pointer-events-auto');
    if (panel) {
      panel.classList.remove('translate-x-full');
      panel.classList.add('translate-x-0');
    }
    document.body.classList.add('overflow-hidden');
  };

  // Close Drawer
  const closeCart = () => {
    const panel = cartContainer.querySelector('.cart-drawer-panel');
    cartContainer.classList.remove('opacity-100', 'pointer-events-auto');
    cartContainer.classList.add('pointer-events-none', 'opacity-0');
    if (panel) {
      panel.classList.remove('translate-x-0');
      panel.classList.add('translate-x-full');
    }
    document.body.classList.remove('overflow-hidden');
  };

  // Refetch and re-render the Cart Drawer DOM
  const refreshCart = (openAfterRefresh = false) => {
    const shouldBeOpen = openAfterRefresh || cartContainer.classList.contains('opacity-100');

    fetch('/?sections=cart-drawer')
      .then(res => res.json())
      .then(sections => {
        const html = sections['cart-drawer'];
        if (!html) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newSection = doc.getElementById('CartDrawerSection');

        if (newSection) {
          cartContainer.innerHTML = newSection.innerHTML;

          if (shouldBeOpen) {
            cartContainer.classList.remove('pointer-events-none', 'opacity-0');
            cartContainer.classList.add('opacity-100', 'pointer-events-auto');
            const newPanel = cartContainer.querySelector('.cart-drawer-panel');
            if (newPanel) {
              newPanel.style.transition = 'none';
              newPanel.classList.remove('translate-x-full');
              newPanel.classList.add('translate-x-0');
              newPanel.offsetHeight;
              newPanel.style.transition = '';
            }
            document.body.classList.add('overflow-hidden');
          } else {
            cartContainer.classList.add('pointer-events-none', 'opacity-0');
            cartContainer.classList.remove('opacity-100', 'pointer-events-auto');
            const newPanel = cartContainer.querySelector('.cart-drawer-panel');
            if (newPanel) {
              newPanel.classList.add('translate-x-full');
              newPanel.classList.remove('translate-x-0');
            }
            document.body.classList.remove('overflow-hidden');
          }

          // Sync cart counts in navbar
          const newQty = doc.querySelector('.cart-total-qty');
          if (newQty) {
            const count = newQty.textContent.trim();
            document.querySelectorAll('.cart-count').forEach(el => {
              el.textContent = count;
            });
          }
        }
      })
      .catch(err => {
        console.error('Failed to reload cart drawer: ', err);
      });
  };

  // Perform Shopify AJAX cart quantity update
  const updateCartQty = (line, qty) => {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line: parseInt(line, 10),
        quantity: parseInt(qty, 10)
      })
    })
    .then(res => res.json())
    .then(() => refreshCart())
    .catch(err => console.error('Error changing cart quantities:', err));
  };

  // Single delegated click listener — attached ONCE, never re-bound
  cartContainer.addEventListener('click', (e) => {
    // Close on overlay click
    if (e.target === cartContainer) {
      closeCart();
      return;
    }

    // Close buttons
    if (e.target.closest('.cart-drawer-close')) {
      closeCart();
      return;
    }

    // Quantity Minus
    const minusBtn = e.target.closest('.cart-qty-minus');
    if (minusBtn && !minusBtn.disabled) {
      const itemRow = minusBtn.closest('.cart-item');
      const line = itemRow.getAttribute('data-line');
      const display = itemRow.querySelector('.cart-qty-display');
      const currentQty = parseInt(display.textContent.trim(), 10);
      const newQty = currentQty - 1;
      display.textContent = Math.max(0, newQty);
      document.querySelectorAll('.cart-count').forEach(el => {
        const c = parseInt(el.textContent.trim(), 10) || 0;
        if (c > 0) el.textContent = c - 1;
      });
      const totalQtyEl = cartContainer.querySelector('.cart-total-qty');
      if (totalQtyEl) {
        const c = parseInt(totalQtyEl.textContent.trim(), 10) || 0;
        if (c > 0) totalQtyEl.textContent = c - 1;
      }
      updateCartQty(line, newQty);
      return;
    }

    // Quantity Plus
    const plusBtn = e.target.closest('.cart-qty-plus');
    if (plusBtn && !plusBtn.disabled) {
      const itemRow = plusBtn.closest('.cart-item');
      const line = itemRow.getAttribute('data-line');
      const display = itemRow.querySelector('.cart-qty-display');
      const currentQty = parseInt(display.textContent.trim(), 10);
      const newQty = currentQty + 1;
      display.textContent = newQty;
      document.querySelectorAll('.cart-count').forEach(el => {
        const c = parseInt(el.textContent.trim(), 10) || 0;
        el.textContent = c + 1;
      });
      const totalQtyEl = cartContainer.querySelector('.cart-total-qty');
      if (totalQtyEl) {
        const c = parseInt(totalQtyEl.textContent.trim(), 10) || 0;
        totalQtyEl.textContent = c + 1;
      }
      updateCartQty(line, newQty);
      return;
    }

    // Remove item
    const removeBtn = e.target.closest('.cart-item-remove');
    if (removeBtn) {
      const itemRow = removeBtn.closest('.cart-item');
      const line = itemRow.getAttribute('data-line');

      // Optimistically decrement counts immediately
      document.querySelectorAll('.cart-count').forEach(el => {
        const c = parseInt(el.textContent.trim(), 10) || 0;
        if (c > 0) el.textContent = c - 1;
      });
      const totalQtyEl = cartContainer.querySelector('.cart-total-qty');
      if (totalQtyEl) {
        const c = parseInt(totalQtyEl.textContent.trim(), 10) || 0;
        if (c > 0) totalQtyEl.textContent = c - 1;
      }

      itemRow.classList.add('animate-slide-out');
      updateCartQty(line, 0);
      return;
    }
  });

  // Cart trigger buttons in header
  document.querySelectorAll('.cart-drawer-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });
  });

  document.addEventListener('cart:open', openCart);
  cartContainer.addEventListener('cart:open', openCart);

  document.addEventListener('cart:updated', (e) => {
    const shouldOpen = e.detail && e.detail.openDrawer;
    refreshCart(shouldOpen);
  });
});
