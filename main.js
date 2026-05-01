/* =============================================================
   CIRQEN SPA — main.js
   Black & Silver | Full Single-Page Experience
   ============================================================= */

'use strict';

// ── Utilities ─────────────────────────────────────────────────
const qs = (s, root = document) => root.querySelector(s);
const qsa = (s, root = document) => [...root.querySelectorAll(s)];

function debounce(fn, ms = 80) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function lerp(a, b, t) { return a + (b - a) * t; }

// ── State ──────────────────────────────────────────────────────
const state = {
  scrollY: 0,
  lastScrollY: 0,
  sections: [],
  activeSection: '',
};

// ═══════════════════════════════════════════════════════════════
// SCROLL PROGRESS BAR
// ═══════════════════════════════════════════════════════════════
const progressBar = qs('#scroll-progress');

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  progressBar.style.width = pct + '%';
}

// ═══════════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════════
const navbar = qs('#navbar');
const navMenu = qs('#navMenu');
const menuToggle = qs('#menuToggle');

function updateNavbar() {
  if (window.scrollY > 80) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
  });
}

// Close menu on link click
qsa('.nav-link, .btn-cta', navMenu).forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    menuToggle.classList.remove('active');
  });
});

// ═══════════════════════════════════════════════════════════════
// SMOOTH SCROLL — all anchor links
// ═══════════════════════════════════════════════════════════════
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href === '#') return;
  const target = qs(href);
  if (!target) return;
  e.preventDefault();
  const navH = navbar.offsetHeight + 8;
  const top = target.getBoundingClientRect().top + window.scrollY - navH;
  window.scrollTo({ top, behavior: 'smooth' });
});

// ═══════════════════════════════════════════════════════════════
// SECTION DOTS + ACTIVE NAV LINKS
// ═══════════════════════════════════════════════════════════════
function buildSectionDots() {
  const dotsNav = qs('#section-dots');
  const sections = qsa('section[data-section]');
  state.sections = sections;

  sections.forEach(sec => {
    const dot = document.createElement('div');
    dot.className = 'section-dot';
    dot.setAttribute('data-label', sec.dataset.section);
    dot.setAttribute('aria-label', sec.dataset.section);
    dot.addEventListener('click', () => {
      const navH = navbar.offsetHeight + 8;
      const top = sec.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
    dotsNav.appendChild(dot);
  });
}

function updateActiveDot() {
  const dots = qsa('.section-dot');
  const navLinks = qsa('.nav-link');
  const scrollMid = window.scrollY + window.innerHeight * 0.35;

  state.sections.forEach((sec, i) => {
    const top = sec.offsetTop;
    const bottom = top + sec.offsetHeight;
    const isActive = scrollMid >= top && scrollMid < bottom;

    dots[i]?.classList.toggle('active', isActive);

    // Sync nav-link
    const id = sec.id;
    const link = qs(`.nav-link[href="#${id}"]`);
    navLinks.forEach(l => l.classList.remove('active'));
    if (isActive && link) link.classList.add('active');

    if (isActive) state.activeSection = id;
  });
}

// ═══════════════════════════════════════════════════════════════
// SCROLL REVEAL (AOS)
// ═══════════════════════════════════════════════════════════════
function setupAOS() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  qsa('[data-aos]').forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════════
// STAGGERED CARD REVEALS
// ═══════════════════════════════════════════════════════════════
function setupStaggerReveal() {
  const TARGETS = [
    '.pillar-card',
    '.platform-feature',
    '.impact-card',
    '.serves-card',
    '.solution-card',
    '.stat-card',
    '.contact-item',
  ];

  // Initial hidden state
  qsa(TARGETS.join(',')).forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = `
      opacity   0.65s cubic-bezier(0.16,1,0.3,1),
      transform 0.65s cubic-bezier(0.16,1,0.3,1)
    `;
  });

  // Observe parent containers for stagger
  const CONTAINERS = [
    '.pillars-grid',
    '.platform-grid',
    '.impact-grid',
    '.serves-grid',
    '.solution-stack',
    '.stats-display',
    '.contact-details',
  ];

  const staggerObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const children = qsa(TARGETS.join(','), entry.target);
      children.forEach((child, i) => {
        setTimeout(() => {
          child.style.opacity = '1';
          child.style.transform = 'translateY(0)';
        }, i * 80);
      });
      staggerObs.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  qsa(CONTAINERS.join(',')).forEach(el => staggerObs.observe(el));
}

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER REVEAL
// ═══════════════════════════════════════════════════════════════
function setupHeaderReveal() {
  const HEADERS = [
    '.section-header',
    '.pillar-detail-hero',
    '.section-overview',
    '.vision-callout',
    '.cta-strip',
    '.subsection-label',
    '.section-sep',
  ];

  qsa(HEADERS.join(',')).forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `
      opacity   0.9s cubic-bezier(0.16,1,0.3,1),
      transform 0.9s cubic-bezier(0.16,1,0.3,1)
    `;
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  qsa(HEADERS.join(',')).forEach(el => obs.observe(el));
}

// ═══════════════════════════════════════════════════════════════
// STAT COUNTERS
// ═══════════════════════════════════════════════════════════════
function animateCounter(el, target) {
  const isFloat = String(target).includes('.');
  const decimals = isFloat ? String(target).split('.')[1].length : 0;
  const duration = 2000;
  const startTime = performance.now();
  const startVal = 0;

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = lerp(startVal, target, eased);
    el.textContent = isFloat
      ? current.toFixed(decimals)
      : Math.round(current).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function setupCounters() {
  const COUNTER_ELS = [
    '.stat-value[data-target]',
    '.metric-value',
    '.stat-number',
  ];

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const target = parseFloat(entry.target.getAttribute('data-target'));
      if (!isNaN(target)) animateCounter(entry.target, target);
      counterObs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  qsa('.stat-value[data-target]').forEach(el => counterObs.observe(el));
}

// ═══════════════════════════════════════════════════════════════
// HERO PARALLAX (mouse move)
// ═══════════════════════════════════════════════════════════════
function setupHeroParallax() {
  const hero = qs('.hero');
  const content = qs('.hero-content');
  if (!hero || !content || window.innerWidth <= 1024) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  document.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    if (e.clientY > rect.bottom) return;
    targetX = (e.clientX / window.innerWidth - 0.5) * 14;
    targetY = (e.clientY / window.innerHeight - 0.5) * 8;
  });

  function animateParallax() {
    currentX = lerp(currentX, targetX, 0.06);
    currentY = lerp(currentY, targetY, 0.06);
    content.style.transform = `translate(${currentX}px, ${currentY}px)`;
    requestAnimationFrame(animateParallax);
  }

  animateParallax();
}

// ═══════════════════════════════════════════════════════════════
// FLOATING GRID PARALLAX on scroll
// ═══════════════════════════════════════════════════════════════
function setupGridParallax() {
  const grid = qs('.grid-overlay');
  if (!grid) return;

  window.addEventListener('scroll', () => {
    const offset = window.scrollY * 0.15;
    grid.style.transform = `translate(${offset % 72}px, ${offset % 72}px)`;
  }, { passive: true });
}

// ═══════════════════════════════════════════════════════════════
// PILLAR SEPARATOR CHROME SHINE on scroll
// ═══════════════════════════════════════════════════════════════
function setupSeparatorShine() {
  const seps = qsa('.pillar-separator');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.background =
          'linear-gradient(90deg, transparent, rgba(200,200,200,0.25) 30%, rgba(200,200,200,0.25) 70%, transparent)';
        entry.target.style.transition = 'background 0.8s ease';
      }
    });
  }, { threshold: 1 });

  seps.forEach(sep => obs.observe(sep));
}

// ═══════════════════════════════════════════════════════════════
// CONTACT FORM
// ═══════════════════════════════════════════════════════════════
function setupContactForm() {
  const form = qs('#contactForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = qs('button[type="submit"]', form);
    const orig = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    await new Promise(r => setTimeout(r, 1200));

    btn.textContent = '✓ Message Sent';
    btn.style.background = 'linear-gradient(135deg, #2a2a2a, #1a1a1a)';
    btn.style.borderColor = 'var(--chrome)';

    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
      btn.style.background = '';
      btn.style.borderColor = '';
      form.reset();
    }, 3000);
  });
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD MOCKUP ANIMATION
// ═══════════════════════════════════════════════════════════════
function setupMockupAnimation() {
  const mockup = qs('.dashboard-mockup');
  if (!mockup) return;

  const obs = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    mockup.style.opacity = '0';
    mockup.style.transform = 'translateY(30px) perspective(800px) rotateX(4deg)';
    mockup.style.transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)';

    setTimeout(() => {
      mockup.style.opacity = '1';
      mockup.style.transform = 'translateY(0) perspective(800px) rotateX(0deg)';
    }, 100);

    // Animate metric numbers in mockup
    const nums = qsa('.metric-number', mockup);
    const targets = [1247, 23];
    nums.forEach((el, i) => {
      if (targets[i] !== undefined) {
        el.textContent = '0';
        setTimeout(() => {
          let start = 0;
          const end = targets[i];
          const dur = 1400;
          const t0 = performance.now();
          function tick(now) {
            const p = Math.min((now - t0) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(e * end).toLocaleString();
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }, 400 + i * 120);
      }
    });

    // Sidebar item cycling
    const items = qsa('.sidebar-item', mockup);
    let current = 0;
    setInterval(() => {
      items[current].classList.remove('active');
      current = (current + 1) % items.length;
      items[current].classList.add('active');
    }, 2200);

    obs.unobserve(mockup);
  }, { threshold: 0.3 });

  obs.observe(mockup);
}

// ═══════════════════════════════════════════════════════════════
// SOLUTION CARD expand hint
// ═══════════════════════════════════════════════════════════════
function setupSolutionCards() {
  qsa('.solution-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = 'inset 2px 0 0 var(--chrome), var(--shadow-md)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '';
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// LOGO ICON rotation on hover (in-flight)
// ═══════════════════════════════════════════════════════════════
function setupLogoAnimation() {
  const logos = qsa('.logo');
  logos.forEach(logo => {
    const icon = qs('.logo-icon', logo);
    if (!icon) return;
    let rotating = false;
    logo.addEventListener('mouseenter', () => {
      if (rotating) return;
      rotating = true;
      icon.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
      icon.style.transform = 'rotate(180deg)';
      setTimeout(() => { rotating = false; }, 600);
    });
    logo.addEventListener('mouseleave', () => {
      icon.style.transform = 'rotate(0deg)';
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// IMAGE CARD — STAGGER REVEAL ON SCROLL
// ═══════════════════════════════════════════════════════════════
function setupImageReveal() {
  const cards = qsa('.img-card');
  if (!cards.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);

      // Find siblings in the same grid for stagger
      const parent = entry.target.parentElement;
      const siblings = qsa('.img-card', parent);
      const idx = siblings.indexOf(entry.target);

      setTimeout(() => {
        entry.target.classList.add('img-revealed');
      }, idx * 90);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  cards.forEach(card => obs.observe(card));
}

// ═══════════════════════════════════════════════════════════════
// VIDEO CARD — 3D MOUSE TILT
// ═══════════════════════════════════════════════════════════════
function setupVideoTilt() {
  const tilts = qsa('.video-tilt-wrap');
  tilts.forEach(wrap => {
    const embed = qs('.video-embed', wrap);
    if (!embed) return;

    wrap.addEventListener('mousemove', e => {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotY = dx * 6;
      const rotX = -dy * 3;
      embed.style.transform = `perspective(900px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
      embed.style.boxShadow = `
        ${-dx * 20}px ${dy * 10}px 60px rgba(0,0,0,0.7),
        0 0 40px rgba(200,200,200,0.04)
      `;
    });

    wrap.addEventListener('mouseleave', () => {
      embed.style.transform = 'perspective(900px) rotateY(-4deg) rotateX(2deg)';
      embed.style.boxShadow = '';
    });
  });
}


// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// CUSTOM CURSOR
// ═══════════════════════════════════════════════════════════════
function setupCursor() {
  if (window.matchMedia('(pointer:coarse)').matches) return; // skip on touch

  const dot = qs('#cursor-dot');
  const ring = qs('#cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  let ringScale = 1;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  function animateCursor() {
    // Dot snaps instantly
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;

    // Ring lags (lerp)
    rx = lerp(rx, mx, 0.12);
    ry = lerp(ry, my, 0.12);
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${ringScale})`;

    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Magnetic hover on interactive elements
  const magnetics = qsa('a, button, .pillar-card, .serves-card, .platform-feature');
  magnetics.forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.classList.add('cursor-hover');
      ringScale = 1.8;
    });
    el.addEventListener('mouseleave', () => {
      ring.classList.remove('cursor-hover');
      ringScale = 1;
    });
  });

  // Click burst
  document.addEventListener('mousedown', () => { dot.classList.add('cursor-click'); ring.classList.add('cursor-click'); });
  document.addEventListener('mouseup', () => { dot.classList.remove('cursor-click'); ring.classList.remove('cursor-click'); });
}

// ═══════════════════════════════════════════════════════════════
// GSAP SCROLL ANIMATIONS
// ═══════════════════════════════════════════════════════════════
function setupGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // ── Hero parallax layers ──────────────────────────────────────
  const heroSpheres = qsa('.gradient-sphere');
  heroSpheres.forEach((sphere, i) => {
    gsap.to(sphere, {
      y: (i % 2 === 0 ? -120 : 80),
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });
  });

  // Hero content slow float up on scroll
  gsap.to('.hero-content', {
    y: -60,
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'center top',
      end: 'bottom top',
      scrub: true,
    }
  });

  // ── Pillar cards stagger on scroll ───────────────────────────
  qsa('.pillar-card').forEach((card, i) => {
    gsap.fromTo(card,
      { y: 60, opacity: 0, rotateX: 6 },
      {
        y: 0, opacity: 1, rotateX: 0,
        duration: 0.9,
        delay: i * 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // ── Section headers slide-up with clip ───────────────────────
  qsa('.section-title').forEach(el => {
    gsap.fromTo(el,
      { y: 40, clipPath: 'inset(100% 0 0 0)' },
      {
        y: 0, clipPath: 'inset(0% 0 0 0)',
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // ── Section tags pop ─────────────────────────────────────────
  qsa('.section-tag, .pillar-tag').forEach(el => {
    gsap.fromTo(el,
      { scale: 0.8, opacity: 0 },
      {
        scale: 1, opacity: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // ── Solution cards slide in from left ────────────────────────
  qsa('.solution-card').forEach((card, i) => {
    gsap.fromTo(card,
      { x: -50, opacity: 0 },
      {
        x: 0, opacity: 1,
        duration: 0.8,
        delay: i * 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // ── Serves cards fan in ──────────────────────────────────────
  qsa('.serves-card').forEach((card, i) => {
    gsap.fromTo(card,
      { y: 50, scale: 0.9, opacity: 0 },
      {
        y: 0, scale: 1, opacity: 1,
        duration: 0.7,
        delay: i * 0.08,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: card.closest('.serves-grid') || card,
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // ── Impact / stat cards count reveal ────────────────────────
  qsa('.impact-card, .stat-card').forEach((card, i) => {
    gsap.fromTo(card,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.85,
        delay: i * 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // ── Platform features slide in alternating ───────────────────
  qsa('.platform-feature').forEach((feat, i) => {
    gsap.fromTo(feat,
      { x: i % 2 === 0 ? -40 : 40, opacity: 0 },
      {
        x: 0, opacity: 1,
        duration: 0.75,
        delay: i * 0.07,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: feat,
          start: 'top 90%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // ── Img cards cinematic reveal ───────────────────────────────
  qsa('.img-card').forEach((card, i) => {
    gsap.fromTo(card,
      { scale: 0.92, opacity: 0, y: 30 },
      {
        scale: 1, opacity: 1, y: 0,
        duration: 0.9,
        delay: i * 0.06,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 92%',
          toggleActions: 'play none none none',
        }
      }
    );
    // Subtle image parallax inside card
    const img = card.querySelector('img');
    if (img) {
      gsap.to(img, {
        y: 24,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      });
    }
  });

  // ── Scroll-driven skew (whole page tilt feel) ────────────────
  let lastY = 0;
  let skewY = 0;
  ScrollTrigger.create({
    onUpdate(self) {
      const v = self.getVelocity();
      const target = Math.max(-4, Math.min(4, v / 300));
      skewY = lerp(skewY, target, 0.12);
      gsap.set('body', { skewY: skewY * 0.25 });
    }
  });

  // ── About section slide-in ───────────────────────────────────
  gsap.fromTo('.about-text',
    { x: -60, opacity: 0 },
    {
      x: 0, opacity: 1,
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.about-text',
        start: 'top 80%',
        toggleActions: 'play none none none',
      }
    }
  );

  // ── CTA strip scale reveal ───────────────────────────────────
  qsa('.cta-strip').forEach(el => {
    gsap.fromTo(el,
      { scale: 0.96, opacity: 0 },
      {
        scale: 1, opacity: 1,
        duration: 0.8,
        ease: 'back.out(1.2)',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // ── Footer brand fade-up ─────────────────────────────────────
  gsap.fromTo('.footer-brand',
    { y: 30, opacity: 0 },
    {
      y: 0, opacity: 1,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.footer',
        start: 'top 90%',
        toggleActions: 'play none none none',
      }
    }
  );

  // ── Section overview indent line draw ───────────────────────
  qsa('.section-overview').forEach(el => {
    gsap.fromTo(el,
      { x: 30, opacity: 0 },
      {
        x: 0, opacity: 1,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // ── Pillar detail title lines stagger ────────────────────────
  qsa('.pillar-detail-title').forEach(heading => {
    gsap.fromTo(heading,
      { y: 50, opacity: 0, clipPath: 'inset(100% 0 0 0)' },
      {
        y: 0, opacity: 1, clipPath: 'inset(0% 0 0 0)',
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: heading,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  // ── Contact form slide-in ────────────────────────────────────
  gsap.fromTo('.contact-form',
    { x: 60, opacity: 0 },
    {
      x: 0, opacity: 1,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.contact-form',
        start: 'top 82%',
        toggleActions: 'play none none none',
      }
    }
  );

  gsap.fromTo('.contact-info',
    { x: -60, opacity: 0 },
    {
      x: 0, opacity: 1,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.contact-info',
        start: 'top 82%',
        toggleActions: 'play none none none',
      }
    }
  );
}

// ═══════════════════════════════════════════════════════════════
// SCROLL VELOCITY SKEW (CSS fallback if no GSAP)
// ═══════════════════════════════════════════════════════════════
function setupScrollSkew() {
  if (typeof gsap !== 'undefined') return; // GSAP handles it
  let lastY = window.scrollY;
  let skewTarget = 0;
  let skewCurrent = 0;

  function tick() {
    const currentY = window.scrollY;
    const delta = currentY - lastY;
    lastY = currentY;
    skewTarget = Math.max(-3, Math.min(3, delta * 0.06));
    skewCurrent = lerp(skewCurrent, skewTarget, 0.1);
    document.body.style.setProperty('--scroll-skew', skewCurrent + 'deg');
    requestAnimationFrame(tick);
  }
  tick();
}

// ═══════════════════════════════════════════════════════════════
// MAGNETIC BUTTONS
// ═══════════════════════════════════════════════════════════════
function setupMagneticButtons() {
  if (window.matchMedia('(pointer:coarse)').matches) return;

  qsa('.btn, .btn-cta, .pillar-link').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.28;
      const dy = (e.clientY - cy) * 0.28;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// MARQUEE
// ═══════════════════════════════════════════════════════════════
function setupMarquee() {
  const track = qs('.marquee-track');
  if (!track) return;
  // Clone for seamless loop
  const clone = track.cloneNode(true);
  track.parentElement.appendChild(clone);
}

// ═══════════════════════════════════════════════════════════════
// GLOWING CARD FOLLOW
// ═══════════════════════════════════════════════════════════════
function setupCardGlow() {
  if (window.matchMedia('(pointer:coarse)').matches) return;

  qsa('.pillar-card, .platform-feature, .impact-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--glow-x', x + 'px');
      card.style.setProperty('--glow-y', y + 'px');
    });
  });
}

// ═══════════════════════════════════════════════════════════════
function onScroll() {
  state.lastScrollY = state.scrollY;
  state.scrollY = window.scrollY;
  updateProgress();
  updateNavbar();
  updateActiveDot();
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  buildSectionDots();
  setupAOS();
  setupStaggerReveal();
  setupHeaderReveal();
  setupCounters();
  setupHeroParallax();
  setupGridParallax();
  setupSeparatorShine();
  setupContactForm();
  setupMockupAnimation();
  setupSolutionCards();
  setupLogoAnimation();
  setupImageReveal();
  setupVideoTilt();
  setupCursor();
  setupScrollSkew();
  setupMagneticButtons();
  setupMarquee();
  setupCardGlow();

  // GSAP needs to wait for scripts to load
  const gsapInit = () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      setupGSAP();
    } else {
      setTimeout(gsapInit, 80);
    }
  };
  gsapInit();

  // Auto copyright year
  const yearEl = qs('#copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Trigger visible AOS elements immediately
  setTimeout(() => {
    qsa('[data-aos]').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('aos-animate');
      }
    });
  }, 80);

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // init

  console.log('%cCIRQEN SPA', 'font-family:monospace;font-size:18px;color:#c8c8c8;background:#0a0a0a;padding:8px 16px;');
});
