// Variant Option Picker & Media Gallery Engine for Apricity Storefront
// This is used for BOTH the dedicated Product page and the Quickview Modal.
function initProductDetailEngine(container) {
  if (!container) return;

  const rawJsonEl = container.querySelector('.product-raw-json');
  if (!rawJsonEl) return;

  const productData = JSON.parse(rawJsonEl.textContent.trim());
  const variants = productData.variants;
  const options = productData.options;

  // Selected Option States
  let selectedOptions = {};
  
  // Track inputs and status displays
  const priceDisplay = container.querySelector('.product-price-display');
  const compareDisplay = container.querySelector('.product-compare-display');
  const mainImage = container.querySelector('.product-main-image');
  const qtyDisplay = container.querySelector('.product-qty-display-value');
  const minusBtn = container.querySelector('.product-qty-btn-minus');
  const plusBtn = container.querySelector('.product-qty-btn-plus');
  const addToCartBtn = container.querySelector('.product-add-to-cart');
  const quickBuyBtn = container.querySelector('.product-quick-buy');
  const stockIndicator = container.querySelector('.stock-status-indicator');
  const legend = container.querySelector('.low-stock-legend');
  
  let quantity = 1;
  let activeVariant = null;
  let maxStock = 99;

  // Media Gallery Thumbnails
  container.querySelectorAll('.thumbnail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.thumbnail-btn').forEach(b => b.classList.remove('border-black'));
      container.querySelectorAll('.thumbnail-btn').forEach(b => b.classList.add('border-transparent'));
      btn.classList.remove('border-transparent');
      btn.classList.add('border-black');

      const url = btn.getAttribute('data-image-url');
      if (url && mainImage) {
        mainImage.src = url;
      }
    });
  });

  // Accordion Panels
  container.querySelectorAll('.accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const plus = item.querySelector('.accordion-plus');
      const isHidden = body.classList.contains('hidden');

      if (isHidden) {
        body.classList.remove('hidden');
        plus.style.transform = 'rotate(45deg)';
      } else {
        body.classList.add('hidden');
        plus.style.transform = 'rotate(0deg)';
      }
    });
  });

  // Size Chart Sub-Modal
  const sizeGuideBtn = container.querySelector('.size-guide-trigger-btn');
  const sizeModal = container.querySelector('.product-size-chart-modal');
  const sizeClose = container.querySelector('.size-chart-modal-close');

  if (sizeGuideBtn && sizeModal) {
    sizeGuideBtn.addEventListener('click', () => {
      sizeModal.classList.remove('hidden');
    });
    sizeClose.addEventListener('click', () => {
      sizeModal.classList.add('hidden');
    });
    sizeModal.addEventListener('click', (e) => {
      if (e.target === sizeModal) {
        sizeModal.classList.add('hidden');
      }
    });
  }

  // Find variant matching active selections
  const getSelectedVariant = () => {
    if (variants.length === 1) return variants[0];
    return variants.find(v => {
      return options.every((opt, idx) => {
        const value = selectedOptions[opt];
        return v.options[idx] === value;
      });
    });
  };

  // Update Stock Indicator Text
  const updateStockDisplay = (qty, available) => {
    if (!stockIndicator) return;
    
    if (!available || qty <= 0) {
      stockIndicator.textContent = 'Out of Stock';
      stockIndicator.className = 'stock-status-indicator text-[10px] font-semibold tracking-wide uppercase flex items-center gap-1.5 text-red-500';
      if (legend) legend.classList.add('hidden');
      return;
    }

    if (qty === 1) {
      stockIndicator.textContent = 'Only 1 left';
      stockIndicator.className = 'stock-status-indicator text-[10px] font-semibold tracking-wide uppercase flex items-center gap-1.5 text-red-500';
      if (legend) legend.classList.remove('hidden');
    } else if (qty <= 3) {
      stockIndicator.textContent = `Only ${qty} left`;
      stockIndicator.className = 'stock-status-indicator text-[10px] font-semibold tracking-wide uppercase flex items-center gap-1.5 text-red-500';
      if (legend) legend.classList.remove('hidden');
    } else if (qty <= 10) {
      stockIndicator.textContent = `${qty} remaining`;
      stockIndicator.className = 'stock-status-indicator text-[10px] font-semibold tracking-wide uppercase flex items-center gap-1.5 text-amber-500';
      if (legend) legend.classList.remove('hidden');
    } else {
      stockIndicator.textContent = 'In Stock';
      stockIndicator.className = 'stock-status-indicator text-[10px] font-semibold tracking-wide uppercase flex items-center gap-1.5 text-emerald-600';
      if (legend) legend.classList.add('hidden');
    }
  };

  // Check Option Combinations availability
  const checkOptionsMatrix = () => {
    // Check sizes availability based on selected color
    const sizeContainer = container.querySelector('.option-size-container');
    if (sizeContainer) {
      const colorOptionIdx = options.findIndex(o => /colou?r/i.test(o));
      const sizeOptionIdx = options.findIndex(o => /size/i.test(o));
      const activeColor = selectedOptions[options[colorOptionIdx]];

      sizeContainer.querySelectorAll('.size-option-btn').forEach(btn => {
        const sizeVal = btn.getAttribute('data-value');
        const matched = variants.find(v => v.options[colorOptionIdx] === activeColor && v.options[sizeOptionIdx] === sizeVal);
        const inStock = matched && matched.available;

        btn.disabled = !inStock;
        
        // Remove old states
        btn.classList.remove('bg-white', 'text-zinc-800', 'border-zinc-200', 'hover:border-zinc-400');
        btn.classList.remove('bg-zinc-900', 'text-white', 'border-zinc-900', 'shadow-lg', 'scale-[1.03]');
        btn.classList.remove('bg-white', 'text-zinc-300', 'border-zinc-100', 'cursor-not-allowed');

        // Remove old sold out lines
        const slash = btn.querySelector('.pointer-events-none');
        if (slash) slash.remove();

        const activeSize = selectedOptions[options[sizeOptionIdx]];

        if (activeSize === sizeVal) {
          btn.classList.add('bg-zinc-900', 'text-white', 'border-zinc-900', 'shadow-lg', 'scale-[1.03]');
        } else if (inStock) {
          btn.classList.add('bg-white', 'text-zinc-800', 'border-zinc-200', 'hover:border-zinc-400');
        } else {
          btn.classList.add('bg-white', 'text-zinc-300', 'border-zinc-100', 'cursor-not-allowed');
          btn.innerHTML += `<span class="pointer-events-none absolute inset-0 flex items-center justify-center pointer-events-none"><span class="block w-[60%] h-px bg-zinc-200 rotate-45"></span></span>`;
        }
      });
    }
  };

  // Sync state with selected options
  const updateSelections = () => {
    activeVariant = getSelectedVariant();
    
    if (activeVariant) {
      // Reset "Go to Cart" back to "Add to Cart" when variant changes
      if (typeof resetAddToCartBtn === 'function') resetAddToCartBtn();
      maxStock = activeVariant.inventory_quantity || 99;
      
      // Update Price
      if (priceDisplay) priceDisplay.innerHTML = activeVariant.price;
      if (compareDisplay) {
        if (activeVariant.compare_at_price) {
          compareDisplay.innerHTML = activeVariant.compare_at_price;
          compareDisplay.classList.remove('hidden');
        } else {
          compareDisplay.classList.add('hidden');
        }
      }

      // Update Featured Image
      if (activeVariant.featured_image && mainImage) {
        mainImage.src = activeVariant.featured_image;
        
        // Match thumbnail borders
        container.querySelectorAll('.thumbnail-btn').forEach(btn => {
          const url = btn.getAttribute('data-image-url');
          if (url === activeVariant.featured_image) {
            btn.classList.add('border-black');
            btn.classList.remove('border-transparent');
          } else {
            btn.classList.add('border-transparent');
            btn.classList.remove('border-black');
          }
        });
      }

      // Reset Quantity
      quantity = 1;
      if (qtyDisplay) qtyDisplay.textContent = '1';
      if (minusBtn) minusBtn.disabled = true;
      if (plusBtn) plusBtn.disabled = quantity >= maxStock;

      // Update Stock Status
      updateStockDisplay(activeVariant.inventory_quantity, activeVariant.available);

      // Buttons active/disabled
      const available = activeVariant.available;
      if (addToCartBtn) {
        addToCartBtn.disabled = !available;
        addToCartBtn.querySelector('.btn-text').textContent = available ? 'Add to Cart' : 'Out of Stock';
        if (available) {
          addToCartBtn.classList.remove('bg-zinc-100', 'text-zinc-400', 'cursor-not-allowed');
          addToCartBtn.classList.add('bg-zinc-900', 'text-white', 'hover:bg-zinc-700');
        } else {
          addToCartBtn.classList.remove('bg-zinc-900', 'text-white', 'hover:bg-zinc-700');
          addToCartBtn.classList.add('bg-zinc-100', 'text-zinc-400', 'cursor-not-allowed');
        }
      }
      if (quickBuyBtn) {
        quickBuyBtn.disabled = !available;
        if (available) {
          quickBuyBtn.classList.remove('bg-zinc-100', 'text-zinc-400', 'cursor-not-allowed', 'border-transparent');
          quickBuyBtn.classList.add('bg-white', 'text-zinc-900', 'border-zinc-300', 'hover:border-zinc-900');
        } else {
          quickBuyBtn.classList.remove('bg-white', 'text-zinc-900', 'border-zinc-300', 'hover:border-zinc-900');
          quickBuyBtn.classList.add('bg-zinc-100', 'text-zinc-400', 'cursor-not-allowed', 'border-transparent');
        }
      }
    }
  };

  // Initialize Selections
  options.forEach((opt, idx) => {
    // Try to find selected option container
    const containerClass = /colou?r/i.test(opt) ? '.option-color-container' : '.option-size-container';
    const optContainer = container.querySelector(containerClass);
    
    if (optContainer) {
      const activeBtn = optContainer.querySelector('.color-option-btn[class*="bg-zinc-900"], .size-option-btn[class*="bg-zinc-900"]');
      if (activeBtn) {
        selectedOptions[opt] = activeBtn.getAttribute('data-value');
      } else {
        const firstBtn = optContainer.querySelector('.color-option-btn, .size-option-btn');
        if (firstBtn) {
          selectedOptions[opt] = firstBtn.getAttribute('data-value');
        }
      }
    }
  });

  updateSelections();
  checkOptionsMatrix();

  // Color selection click listener
  container.querySelectorAll('.color-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.option-color-container');
      const idx = parseInt(parent.getAttribute('data-option-index'), 10);
      const opt = options[idx];
      
      parent.querySelectorAll('.color-option-btn').forEach(b => {
        b.classList.remove('bg-zinc-900', 'text-white', 'border-zinc-900', 'shadow-md');
        b.classList.add('bg-white', 'text-zinc-700', 'border-zinc-200');
      });
      btn.classList.add('bg-zinc-900', 'text-white', 'border-zinc-900', 'shadow-md');
      btn.classList.remove('bg-white', 'text-zinc-700', 'border-zinc-200');

      // Update color title
      const label = parent.querySelector('.active-color-label');
      if (label) label.textContent = btn.getAttribute('data-value');

      selectedOptions[opt] = btn.getAttribute('data-value');
      
      checkOptionsMatrix();
      
      // If active size is now disabled on this color, select the first available size
      const sizeOpt = options.find(o => /size/i.test(o));
      if (sizeOpt) {
        const activeSize = selectedOptions[sizeOpt];
        const sizeContainer = container.querySelector('.option-size-container');
        const activeSizeBtn = sizeContainer.querySelector(`.size-option-btn[data-value="${activeSize}"]`);
        
        if (activeSizeBtn && activeSizeBtn.disabled) {
          const firstAvailableBtn = sizeContainer.querySelector('.size-option-btn:not([disabled])');
          if (firstAvailableBtn) {
            firstAvailableBtn.click();
          }
        }
      }

      updateSelections();
    });
  });

  // Size selection click listener
  container.querySelectorAll('.size-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.option-size-container');
      const idx = parseInt(parent.getAttribute('data-option-index'), 10);
      const opt = options[idx];

      parent.querySelectorAll('.size-option-btn').forEach(b => {
        b.classList.remove('bg-zinc-900', 'text-white', 'border-zinc-900', 'shadow-lg', 'scale-[1.03]');
        if (!b.disabled) {
          b.classList.add('bg-white', 'text-zinc-800', 'border-zinc-200', 'hover:border-zinc-400');
        }
      });
      btn.classList.add('bg-zinc-900', 'text-white', 'border-zinc-900', 'shadow-lg', 'scale-[1.03]');
      btn.classList.remove('bg-white', 'text-zinc-800', 'border-zinc-200', 'hover:border-zinc-400');

      selectedOptions[opt] = btn.getAttribute('data-value');
      updateSelections();
    });
  });

  // Quantity adjusters
  if (minusBtn && plusBtn && qtyDisplay) {
    minusBtn.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        qtyDisplay.textContent = quantity;
        minusBtn.disabled = quantity <= 1;
        plusBtn.disabled = quantity >= maxStock;
      }
    });

    plusBtn.addEventListener('click', () => {
      if (quantity < maxStock) {
        quantity++;
        qtyDisplay.textContent = quantity;
        minusBtn.disabled = quantity <= 1;
        plusBtn.disabled = quantity >= maxStock;
      }
    });
  }

  // Handle Add to Cart AJAX
  let addedToCart = false;

  const resetAddToCartBtn = () => {
    if (!addToCartBtn) return;
    addedToCart = false;
    addToCartBtn.disabled = false;
    addToCartBtn.querySelector('.btn-text').textContent = 'Add to Cart';
    addToCartBtn.classList.remove('bg-emerald-600');
    addToCartBtn.classList.add('bg-zinc-900', 'hover:bg-zinc-700');
    // Restore bag icon
    const svg = addToCartBtn.querySelector('svg');
    if (svg) {
      svg.innerHTML = '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>';
    }
  };

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      // If already added, go to cart
      if (addedToCart) {
        window.location.href = '/cart';
        return;
      }

      if (!activeVariant) return;

      const variantId = activeVariant.id;
      addToCartBtn.disabled = true;
      addToCartBtn.querySelector('.btn-text').textContent = 'Adding...';

      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity
        })
      })
      .then(res => res.json())
      .then(item => {
        addedToCart = true;
        addToCartBtn.disabled = false;
        addToCartBtn.querySelector('.btn-text').textContent = 'Go to Cart';
        addToCartBtn.classList.remove('bg-zinc-900', 'hover:bg-zinc-700');
        addToCartBtn.classList.add('bg-emerald-600');

        // Swap icon to arrow-right
        const svg = addToCartBtn.querySelector('svg');
        if (svg) {
          svg.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>';
        }

        // Dispatch update cart
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: { item: item } }));
        
        // Open the Cart Drawer
        const cartDrawer = document.getElementById('CartDrawerSection');
        if (cartDrawer) {
          cartDrawer.dispatchEvent(new CustomEvent('cart:open'));
        }
      })
      .catch(err => {
        console.error('Failed to add to cart:', err);
        addToCartBtn.disabled = false;
        addToCartBtn.querySelector('.btn-text').textContent = 'Add to Cart';
      });
    });
  }

  // Handle Quick Buy
  if (quickBuyBtn) {
    quickBuyBtn.addEventListener('click', () => {
      if (!activeVariant) return;
      
      const variantId = activeVariant.id;
      // Extract numeric ID if it is a Shopify GID string
      const numericId = variantId.includes('/') ? variantId.split('/').pop() : variantId;
      window.location.href = `/cart/${numericId}:${quantity}`;
    });
  }
}

// Quickview Modal dynamic fetch controller
document.addEventListener('DOMContentLoaded', () => {
  const modalContainer = document.getElementById('ProductQuickviewModal');
  if (!modalContainer) return;

  const wrapper = modalContainer.querySelector('.modal-content-wrapper');

  const openModal = (handle) => {
    // Show spinner first
    wrapper.innerHTML = `<div class="h-64 w-full flex items-center justify-center text-zinc-400 font-mono-street text-xs uppercase tracking-widest"><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading details...</div>`;
    
    modalContainer.classList.remove('hidden');
    // Force browser reflow
    modalContainer.offsetHeight;
    modalContainer.classList.remove('opacity-0');
    modalContainer.classList.add('opacity-100');
    wrapper.classList.remove('scale-95');
    wrapper.classList.add('scale-100');
    document.body.classList.add('overflow-hidden');

    // Fetch Liquid quickview template
    fetch(`/products/${handle}?view=quickview`)
      .then(res => {
        if (!res.ok) throw new Error('Product quickview load failed');
        return res.text();
      })
      .then(html => {
        wrapper.innerHTML = html;
        
        // Re-inject close click triggers inside the loaded snippet
        const innerClose = wrapper.querySelector('[onClick="onClose"]');
        if (innerClose) {
          // Replace inline onclick helper with our modal close trigger
          innerClose.removeAttribute('onClick');
          innerClose.addEventListener('click', closeModal);
        }

        // Initialize variant swatches picker & gallery inside the modal container
        initProductDetailEngine(wrapper);
      })
      .catch(err => {
        console.error('AJAX product quickview failed: ', err);
        wrapper.innerHTML = `<div class="h-64 w-full flex flex-col items-center justify-center text-zinc-400 font-mono-street text-xs gap-4 p-8 uppercase tracking-widest"><span>Error loading product details.</span><button type="button" class="px-6 py-2 border border-zinc-300 hover:border-zinc-950 font-bold uppercase tracking-widest transition" id="ModalRetryBtn">Close</button></div>`;
        const retry = wrapper.querySelector('#ModalRetryBtn');
        if (retry) retry.addEventListener('click', closeModal);
      });
  };

  const closeModal = () => {
    modalContainer.classList.remove('opacity-100');
    modalContainer.classList.add('opacity-0');
    wrapper.classList.remove('scale-100');
    wrapper.classList.add('scale-95');
    document.body.classList.remove('overflow-hidden');
    setTimeout(() => {
      modalContainer.classList.add('hidden');
    }, 300);
  };

  // Dismiss listeners
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
      closeModal();
    }
  });

  function openCartDrawerTriggerClose() {
    const cart = document.getElementById('CartDrawerSection');
    if (cart && cart.classList.contains('opacity-100')) {
      const close = cart.querySelector('.cart-drawer-close');
      if (close) close.click();
    }
  }

  // Intercept grid card click to open quickview instead of PDP
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;

    // Do nothing if clicking quick add buttons or size popups
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.mobile-size-popup')) {
      return;
    }

    // If inside the Shopify Theme Editor (Customizer), let the editor handle clicks
    if (window.Shopify && window.Shopify.designMode) {
      return;
    }

    e.preventDefault();
    
    // Extract handle from the data-url attribute
    const url = card.getAttribute('data-url');
    if (url) {
      const handle = url.split('/').pop().split('?')[0];
      if (handle) {
        openCartDrawerTriggerClose(); // Close cart before modal opens
        openModal(handle);
      } else {
        window.location.href = url;
      }
    }
  });
});
