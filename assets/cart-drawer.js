document.addEventListener('DOMContentLoaded', () => {
  const cartContainer = document.getElementById('CartDrawerSection');
  if (!cartContainer) return;

  const panel = cartContainer.querySelector('.cart-drawer-panel');

  // Open Drawer
  const openCart = () => {
    cartContainer.classList.remove('pointer-events-none', 'opacity-0');
    cartContainer.classList.add('opacity-100', 'pointer-events-auto');
    panel.classList.remove('translate-x-full');
    panel.classList.add('translate-x-0');
    document.body.classList.add('overflow-hidden');
  };

  // Close Drawer
  const closeCart = () => {
    cartContainer.classList.remove('opacity-100', 'pointer-events-auto');
    cartContainer.classList.add('pointer-events-none', 'opacity-0');
    panel.classList.remove('translate-x-0');
    panel.classList.add('translate-x-full');
    document.body.classList.remove('overflow-hidden');
  };

  // Refetch and Update the Cart Drawer DOM
  // openAfterRefresh: if true, open the drawer once the new HTML is in place
  const refreshCart = (openAfterRefresh = false) => {
    // If the drawer is already open, keep it open after refresh
    const shouldBeOpen = openAfterRefresh || cartContainer.classList.contains('opacity-100');

    fetch('/?sections=cart-drawer')
      .then(res => res.json())
      .then(sections => {
        const html = sections['cart-drawer'];
        if (!html) return;

        // Parse and replace content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newSection = doc.getElementById('CartDrawerSection');
        
        if (newSection) {
          cartContainer.innerHTML = newSection.innerHTML;
          
          // Re-apply open state instantly so the drawer doesn't flash closed or animate slide-in
          if (shouldBeOpen) {
            cartContainer.classList.remove('pointer-events-none', 'opacity-0');
            cartContainer.classList.add('opacity-100', 'pointer-events-auto');
            const newPanel = cartContainer.querySelector('.cart-drawer-panel');
            if (newPanel) {
              newPanel.style.transition = 'none';
              newPanel.classList.remove('translate-x-full');
              newPanel.classList.add('translate-x-0');
              newPanel.offsetHeight; // Force reflow
              newPanel.style.transition = '';
            }
            document.body.classList.add('overflow-hidden');
          } else {
            // Explicitly keep drawer hidden after DOM swap
            cartContainer.classList.add('pointer-events-none', 'opacity-0');
            cartContainer.classList.remove('opacity-100', 'pointer-events-auto');
            const newPanel = cartContainer.querySelector('.cart-drawer-panel');
            if (newPanel) {
              newPanel.classList.add('translate-x-full');
              newPanel.classList.remove('translate-x-0');
            }
            document.body.classList.remove('overflow-hidden');
          }

          // Rebind event listeners
          bindEvents();

          // Sync cart counts in headers/footers
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

  // Bind Actions inside the Drawer
  const bindEvents = () => {
    const closeBtns = cartContainer.querySelectorAll('.cart-drawer-close');
    closeBtns.forEach(btn => btn.addEventListener('click', closeCart));

    // Handle quantity clicks & delete animation
    cartContainer.addEventListener('click', (e) => {
      const target = e.target;

      // Quantity Minus Click
      const minusBtn = target.closest('.cart-qty-minus');
      if (minusBtn) {
        const itemRow = minusBtn.closest('.cart-item');
        const line = itemRow.getAttribute('data-line');
        const display = itemRow.querySelector('.cart-qty-display');
        const currentQty = parseInt(display.textContent.trim(), 10);
        updateCartQty(line, currentQty - 1);
      }

      // Quantity Plus Click
      const plusBtn = target.closest('.cart-qty-plus');
      if (plusBtn) {
        const itemRow = plusBtn.closest('.cart-item');
        const line = itemRow.getAttribute('data-line');
        const display = itemRow.querySelector('.cart-qty-display');
        const currentQty = parseInt(display.textContent.trim(), 10);
        updateCartQty(line, currentQty + 1);
      }

      // Remove / Trash Click
      const removeBtn = target.closest('.cart-item-remove');
      if (removeBtn) {
        const itemRow = removeBtn.closest('.cart-item');
        const line = itemRow.getAttribute('data-line');
        
        // Trigger slide-out animation
        itemRow.classList.add('animate-slide-out');
        
        // Wait for the slideOut keyframe to complete before sending AJAX
        setTimeout(() => {
          updateCartQty(line, 0);
        }, 250);
      }
    });

    // Close on overlay background click
    cartContainer.addEventListener('click', (e) => {
      if (e.target === cartContainer) {
        closeCart();
      }
    });
  };

  // Perform Shopify AJAX cart quantity update
  const updateCartQty = (line, qty) => {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        line: parseInt(line, 10),
        quantity: parseInt(qty, 10)
      })
    })
    .then(res => res.json())
    .then(() => {
      refreshCart();
    })
    .catch(err => {
      console.error('Error changing cart quantities:', err);
    });
  };

  // Bind cart header trigger buttons
  document.querySelectorAll('.cart-drawer-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });
  });

  // Listen for cart:open on BOTH document AND the element itself
  // (different parts of the theme may dispatch on either target)
  document.addEventListener('cart:open', openCart);
  cartContainer.addEventListener('cart:open', openCart);

  // Listen for cart:updated — refresh content and optionally open the drawer.
  // Only attach to document (the element listener was redundant and caused double-refresh).
  document.addEventListener('cart:updated', (e) => {
    const shouldOpen = e.detail && e.detail.openDrawer;
    refreshCart(shouldOpen);
  });

  // Initial event binding
  bindEvents();
});
