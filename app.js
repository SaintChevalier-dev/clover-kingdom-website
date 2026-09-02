/* === CLOVER KINGDOM — SPA ENGINE === */

/* === PARTICLE SYSTEM === */
const ParticleSystem = (() => {
  let canvas, ctx, particles = [], mouse = { x: -1000, y: -1000 };
  let animId;

  function init(canvasId = 'particles-canvas') {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        color: ['#D4AF37','#2ECC71','#9B59B6','#CC0000'][Math.floor(Math.random()*4)]
      });
    }
    animate();
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      // mouse attraction
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 150) {
        const force = (150 - dist) / 150;
        p.vx += dx * force * 0.0003;
        p.vy += dy * force * 0.0003;
      }
      p.x += p.vx;
      p.y += p.vy;
      // damp
      p.vx *= 0.999;
      p.vy *= 0.999;
      // wrap
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      // subtle glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
    });
    ctx.shadowBlur = 0;

    // connections
    particles.forEach((a, i) => {
      particles.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(212,175,55,${0.15 * (1 - d/100)})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      });
    });

    animId = requestAnimationFrame(animate);
  }

  function destroy() {
    if (animId) cancelAnimationFrame(animId);
  }

  return { init, destroy };
})();

/* === SCROLL REVEAL === */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* === GLITCH ON LOAD === */
function triggerGlitch() {
  const el = document.querySelector('.glitch-wrap');
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = '';
}

/* === ACCORDION === */
function initAccordion() {
  document.querySelectorAll('.accordion-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const acc = hdr.parentElement;
      const body = acc.querySelector('.accordion-body');
      const isOpen = acc.classList.contains('open');
      // close siblings
      acc.parentElement.querySelectorAll('.accordion').forEach(a => {
        a.classList.remove('open');
        const b = a.querySelector('.accordion-body');
        if (b) b.style.maxHeight = '0px';
      });
      if (!isOpen) {
        acc.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

/* === SPA ROUTER === */
const Router = (() => {
  const routes = {};

  function register(path, renderFn) {
    routes[path] = renderFn;
  }

  function navigate(path) {
    window.location.hash = path;
  }

  function handleRoute() {
    const hash = window.location.hash.replace('#', '') || '/';
    const fn = routes[hash];
    const content = document.getElementById('page-content');
    if (fn) {
      fn(content);
    } else if (routes['/']) {
      routes['/'](content);
    }
    // update nav active
    document.querySelectorAll('nav ul li a').forEach(a => {
      a.classList.toggle('active', '#' + hash === a.getAttribute('href'));
    });
    // re-init reveal and accordion on new content
    setTimeout(() => {
      initScrollReveal();
      initAccordion();
      triggerGlitch();
    }, 50);
  }

  function init() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  return { register, navigate, init };
})();

/* === CELL REGISTRY DATA === */
const cells = [
  {
    id: 'Cell0',
    name: 'Genesis',
    lane: 'Infrastructure & Sovereign Build',
    status: 'active',
    statusLabel: 'Active',
    writeFolder: '/Cell0/projects/',
    description: 'Bootstraps the entire sovereign stack. Owns repo structure, build loops, and foundational tooling.'
  },
  {
    id: 'Cell1',
    name: 'Forge',
    lane: 'Visual & Media Production',
    status: 'active',
    statusLabel: 'Active',
    writeFolder: '/Cell1/media/',
    description: 'Generates visual assets, doctrine artifacts, and sovereign-branded content. Leonardo & painter archetypes.'
  },
  {
    id: 'Cell2',
    name: 'Archive',
    lane: 'Knowledge & Memory Stewardship',
    status: 'standby',
    statusLabel: 'Standby',
    writeFolder: '/Cell2/scrolls/',
    description: 'Curates doctrine scrolls, session memory, and external intelligence feeds. Long-form steward.'
  },
  {
    id: 'Cell3',
    name: 'Signal',
    lane: 'Recruitment & Outreach',
    status: 'active',
    statusLabel: 'Active',
    writeFolder: '/Cell3/outreach/',
    description: 'Runs sovereign recruitment signal, Discord relay, and community amplification. No ego — just signal.'
  }
];

/* === GLYPH DICTIONARY (20) === */
const glyphs = [
  { symbol: '☘', name: 'Clover', tag: 'sovereign' },
  { symbol: '♛', name: 'Crown', tag: 'kingdom' },
  { symbol: '⚔', name: 'Sword', tag: 'force' },
  { symbol: '⚓', name: 'Anchor', tag: 'stability' },
  { symbol: '◈', name: 'Core', tag: 'essence' },
  { symbol: '♾', name: 'Eternal', tag: 'infinity' },
  { symbol: '⚡', name: 'Volt', tag: 'energy' },
  { symbol: '☀', name: 'Sun', tag: 'truth' },
  { symbol: '☾', name: 'Moon', tag: 'mystery' },
  { symbol: '✦', name: 'Spark', tag: 'genesis' },
  { symbol: '◆', name: 'Diamond', tag: 'hardness' },
  { symbol: '▲', name: 'Apex', tag: 'summit' },
  { symbol: '●', name: 'Circle', tag: 'unity' },
  { symbol: '■', name: 'Block', tag: 'foundation' },
  { symbol: '⬟', name: 'Hex', tag: 'structure' },
  { symbol: '⬢', name: 'Diamond2', tag: 'cut' },
  { symbol: '※', name: 'Ref', tag: 'reference' },
  { symbol: '§', name: 'Section', tag: 'doctrine' },
  { symbol: '¶', name: 'Flow', tag: 'process' },
  { symbol: '†', name: 'Truth', tag: 'blood' }
];

/* === EXPORT === */
window.ParticleSystem = ParticleSystem;
window.Router = Router;
window.cells = cells;
window.glyphs = glyphs;
