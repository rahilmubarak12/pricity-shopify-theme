document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('.typewriter-target');
  if (el) {
    const text = el.getAttribute('data-text') || "APRICITY OFFICIALS";
    const speed = parseInt(el.getAttribute('data-speed'), 10) || 75;
    const delay = parseInt(el.getAttribute('data-delay'), 10) || 300;
    
    let index = 0;
    // Set initial cursor
    el.innerHTML = '<span class="typewriter-cursor animate-pulse">|</span>';
    
    setTimeout(() => {
      const timer = setInterval(() => {
        index++;
        if (index <= text.length) {
          const typed = text.slice(0, index);
          const cursor = index < text.length ? '<span class="typewriter-cursor animate-pulse">|</span>' : '';
          el.innerHTML = typed + cursor;
        } else {
          clearInterval(timer);
        }
      }, speed);
    }, delay);
  }
});
