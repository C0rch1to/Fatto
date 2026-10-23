/**
 * FATTO - Al Forno -
 * Interactive Engine: Fire particle canvas, 3D card tilt, real-time menu list filter/search,
 * and direct integration with Pedix portal.
 */

// ==========================================
// 1. Central Menu Database Reference
// ==========================================
var MENU_ITEMS = window.MENU_ITEMS || [];
var PEDIX_URL = window.PEDIX_URL || 'https://pedix.app/fatto-al-forno';

// ==========================================
// 2. Fire Particle Canvas Simulation
// ==========================================
function initFireParticles() {
  const canvas = document.getElementById('fire-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = [
    'rgba(230, 36, 41, ',   // Red
    'rgba(255, 106, 19, ',  // Amber
    'rgba(255, 170, 41, ',  // Gold
    'rgba(255, 220, 100, '  // Warm white
  ];

  class Ember {
    constructor() {
      this.reset();
      this.y = Math.random() * height;
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + 10 + Math.random() * 20;
      this.radius = Math.random() * 2.2 + 0.8;
      this.speedY = Math.random() * 1.5 + 0.6;
      this.speedX = (Math.random() - 0.5) * 0.8;
      this.opacity = Math.random() * 0.7 + 0.3;
      this.fadeSpeed = Math.random() * 0.006 + 0.003;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.03 + 0.01;
    }

    update() {
      this.y -= this.speedY;
      this.wobble += this.wobbleSpeed;
      this.x += this.speedX + Math.sin(this.wobble) * 0.5;
      this.opacity -= this.fadeSpeed;

      if (this.opacity <= 0 || this.y < -10) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.opacity + ')';
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color + '0.8)';
      ctx.fill();
    }
  }

  const count = window.innerWidth < 768 ? 35 : 65;
  for (let i = 0; i < count; i++) {
    particles.push(new Ember());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let p of particles) {
      p.update();
      p.draw();
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// ==========================================
// 3. 3D Tilt Effect for Hero Card
// ==========================================
function init3DTilt() {
  const card = document.querySelector('.hero-card-3d');
  if (!card) return;

  const container = document.querySelector('.hero-visual');
  if (!container) return;

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  container.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  });
}

// ==========================================
// 4. Menu List View Rendering and Search Engine
// ==========================================
let activeCategory = 'todas';
let searchQuery = '';

// Helper: Normalize text removing accents/tildes for accent-immune searching (e.g. brócoli = brocoli)
function removeAccents(str) {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function updateCategoryCounts(items) {
  const counts = {
    todas: items.length,
    empanadas: items.filter(i => i.category === 'empanadas').length,
    pizzas: items.filter(i => i.category === 'pizzas').length,
    tartas: items.filter(i => i.category === 'tartas').length,
    salsas: items.filter(i => i.category === 'salsas').length
  };

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const cat = btn.getAttribute('data-cat');
    const badge = btn.querySelector('.tab-count');
    if (badge && counts[cat] !== undefined) {
      badge.textContent = counts[cat];
    }
  });
}

function renderMenu() {
  const listContainer = document.getElementById('menu-list-container');
  if (!listContainer) return;

  const allItems = window.MENU_ITEMS || [];
  updateCategoryCounts(allItems);

  const normalizedQuery = removeAccents(searchQuery);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  const filtered = allItems.filter(item => {
    const matchesCat = activeCategory === 'todas' || item.category === activeCategory;
    if (!matchesCat) return false;
    if (terms.length === 0) return true;

    // Searchable string containing name, description, category and badges (all without accents)
    const searchableText = removeAccents(
      `${item.name} ${item.desc} ${item.category} ${item.categoryName || ''} ${(item.badges || []).join(' ')}`
    );

    // Matches if all query terms are present in the item
    return terms.every(term => searchableText.includes(term));
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-results">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>No encontramos opciones para "${escapeHtml(searchQuery)}"</h3>
        <p>Probá buscando por ingrediente como "carne", "queso", "bondiola", o seleccioná otra categoría.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(item => {
    const badgesHtml = item.badges.map(b => {
      let label = b.toUpperCase();
      let cls = 'badge-' + b;
      if (b === 'gourmet') label = '★ Gourmet';
      if (b === 'favorito') label = '🔥 Favorito';
      if (b === 'veggie') label = '🌱 Vegetariana';
      if (b === 'picante') label = '🌶️ Picante';
      if (b === 'dulce') label = '🍯 Dulce';
      if (b === 'integral') label = '🌾 100% Integral';
      return `<span class="badge ${cls}">${label}</span>`;
    }).join('');

    return `
      <div class="menu-list-item" data-id="${item.id}">
        <div class="list-item-icon-col">
          <span class="list-category-icon">${item.icon}</span>
        </div>

        <div class="list-item-content">
          <div class="list-item-header">
            <h4 class="list-item-name">${item.name}</h4>
            <div class="item-badges">${badgesHtml}</div>
          </div>
          <p class="list-item-desc">${item.desc}</p>
        </div>

        <div class="list-item-action">
          <a href="${PEDIX_URL}" target="_blank" rel="noopener noreferrer" class="btn-pedix-item" title="Pedir ${item.name} en Pedix">
            <span>Pedir en Pedix</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function initMenuControls() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.getAttribute('data-cat');
      renderMenu();
    });
  });

  const searchInput = document.getElementById('menu-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderMenu();
    });
  }
}

// Quick filter helper for specialty category cards
function filterByCat(catName) {
  activeCategory = catName;
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(t => {
    if (t.getAttribute('data-cat') === catName) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });
  renderMenu();
  const menuSection = document.getElementById('menu-completo');
  if (menuSection && typeof menuSection.scrollIntoView === 'function') {
    menuSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// ==========================================
// 5. Navbar & Mobile Drawer
// ==========================================
function initNavbarAndScroll() {
  const header = document.querySelector('.header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // Mobile navigation
  const menuToggle = document.getElementById('menu-toggle-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
  const closeMobileNav = document.getElementById('close-mobile-nav');

  function openDrawer() {
    mobileNav?.classList.add('open');
    mobileBackdrop?.classList.add('open');
    menuToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    mobileNav?.classList.remove('open');
    mobileBackdrop?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  menuToggle?.addEventListener('click', openDrawer);
  closeMobileNav?.addEventListener('click', closeDrawer);
  mobileBackdrop?.addEventListener('click', closeDrawer);

  document.querySelectorAll('.mobile-nav-links a').forEach(a => {
    a.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('open')) {
      closeDrawer();
    }
  });
}

// ==========================================
// 6. Floating Back to Top Button
// ==========================================
function initScrollToTop() {
  const btnScrollTop = document.getElementById('btn-scroll-top');
  if (!btnScrollTop) return;

  const handleScroll = () => {
    if (window.scrollY > 280) {
      btnScrollTop.classList.add('visible');
    } else {
      btnScrollTop.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check in case page is already scrolled

  btnScrollTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ==========================================
// ==========================================
// 7. Categories Carousel (Mobile / Pantalla Angosta)
// ==========================================
function initCategoriesCarousel() {
  const showcase = document.querySelector('.categories-showcase');
  if (!showcase) return;

  const empanadasCard = showcase.querySelector('.category-card[data-cat="empanadas"]');
  const cards = showcase.querySelectorAll('.category-card');

  function centerCard(targetCard, smooth = false) {
    if (!targetCard) return;
    const isCarousel = showcase.scrollWidth > showcase.clientWidth + 10;
    if (!isCarousel) return;

    const containerWidth = showcase.clientWidth;
    const cardWidth = targetCard.offsetWidth;
    const cardLeft = targetCard.offsetLeft;
    const targetScroll = cardLeft - (containerWidth - cardWidth) / 2;

    showcase.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: smooth ? 'smooth' : 'instant'
    });
  }

  function ensureEmpanadasCentered() {
    centerCard(empanadasCard, false);
  }

  // Centrar empanadas al cargar la página
  ensureEmpanadasCentered();
  requestAnimationFrame(ensureEmpanadasCentered);
  setTimeout(ensureEmpanadasCentered, 60);
  setTimeout(ensureEmpanadasCentered, 250);
  window.addEventListener('load', ensureEmpanadasCentered);

  // Re-centrar si cambia el tamaño de ventana entrando en modo carrusel
  let resizeTimer;
  let wasCarousel = showcase.scrollWidth > showcase.clientWidth + 10;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const isNowCarousel = showcase.scrollWidth > showcase.clientWidth + 10;
      if (isNowCarousel && !wasCarousel) {
        centerCard(empanadasCard, true);
      }
      wasCarousel = isNowCarousel;
    }, 150);
  });

  // IntersectionObserver para destacar la card activa/centrada (Modern Web Guidance)
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('is-snapped', entry.isIntersecting);
      });
    }, {
      root: showcase,
      rootMargin: '0px -35% 0px -35%',
      threshold: 0.1
    });

    cards.forEach(card => observer.observe(card));
  } else {
    empanadasCard?.classList.add('is-snapped');
  }
}

// Init on DOM Content Loaded
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Limpiar cualquier residuo previo de gestor en localStorage
  try {
    localStorage.removeItem('fatto_hidden_items');
  } catch (e) {}

  initFireParticles();
  init3DTilt();
  renderMenu();
  initMenuControls();
  initNavbarAndScroll();
  initScrollToTop();
  initCategoriesCarousel();
});
