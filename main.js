/* =============================================
   EASILEE — SMOOTH INTERACTIONS
   Three.js, GSAP, micro-animations
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initCursorGlow();
    initNavbar();
    initScrollAnimations();
    initServiceTilt();
    initCounters();
    initContactForm();
});

// ═══════════════════════════════════════════════
//  THREE.JS — PARTICLE FIELD
// ═══════════════════════════════════════════════
function initThreeJS() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── PARTICLES ──
    const count = 1200;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    const palette = [
        new THREE.Color(0xa855f7),
        new THREE.Color(0xc084fc),
        new THREE.Color(0x7c3aed),
        new THREE.Color(0xd946ef),
    ];

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3] = (Math.random() - 0.5) * 140;
        pos[i3 + 1] = (Math.random() - 0.5) * 140;
        pos[i3 + 2] = (Math.random() - 0.5) * 80;

        const c = palette[Math.floor(Math.random() * palette.length)];
        cols[i3] = c.r;
        cols[i3 + 1] = c.g;
        cols[i3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // ── WIREFRAME SHAPES ──
    const shapes = [];

    function addShape(geom, color, opacity, position, rotSpeed, floatSpeed) {
        const m = new THREE.MeshBasicMaterial({
            color, wireframe: true, transparent: true, opacity,
        });
        const mesh = new THREE.Mesh(geom, m);
        mesh.position.set(...position);
        scene.add(mesh);
        shapes.push({ mesh, rotSpeed, floatSpeed, basePos: [...position] });
    }

    addShape(new THREE.IcosahedronGeometry(4, 1), 0xa855f7, 0.18, [-20, 10, -12], [0.002, 0.003, 0.001], 0.7);
    addShape(new THREE.TorusKnotGeometry(3, 0.7, 64, 8, 2, 3), 0xc084fc, 0.14, [22, -6, -18], [0.003, 0.002, 0.001], 1.1);
    addShape(new THREE.OctahedronGeometry(3, 0), 0x7c3aed, 0.18, [16, 14, -10], [0.003, 0.002, 0.002], 0.5);
    addShape(new THREE.DodecahedronGeometry(2.5, 0), 0xd946ef, 0.15, [-16, -12, -8], [0.001, 0.004, 0.003], 0.9);
    addShape(new THREE.TorusGeometry(3.5, 0.5, 14, 40), 0xc084fc, 0.12, [-8, -18, -22], [0.001, 0.002, 0.003], 0.8);

    // ── FAINT LINES ──
    const lineMat = new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.04 });
    for (let i = 0; i < 20; i++) {
        const lg = new THREE.BufferGeometry();
        const pts = [
            new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50),
            new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50),
        ];
        lg.setFromPoints(pts);
        scene.add(new THREE.Line(lg, lineMat));
    }

    // ── MOUSE ──
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    window.addEventListener('mousemove', e => {
        target.x = (e.clientX / window.innerWidth - 0.5) * 2;
        target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // ── RESIZE ──
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ── RENDER LOOP ──
    const clock = new THREE.Clock();

    function tick() {
        requestAnimationFrame(tick);
        const t = clock.getElapsedTime();

        // Smooth interpolation
        mouse.x += (target.x - mouse.x) * 0.04;
        mouse.y += (target.y - mouse.y) * 0.04;

        // Particles rotate gently
        particles.rotation.x = mouse.y * 0.1 + t * 0.015;
        particles.rotation.y = mouse.x * 0.1 + t * 0.02;

        // Gentle vertical wave
        const p = geo.attributes.position.array;
        for (let i = 0; i < count; i++) {
            p[i * 3 + 1] += Math.sin(t * 0.3 + i * 0.05) * 0.003;
        }
        geo.attributes.position.needsUpdate = true;

        // Shapes float and rotate
        shapes.forEach((s, idx) => {
            s.mesh.rotation.x += s.rotSpeed[0];
            s.mesh.rotation.y += s.rotSpeed[1];
            s.mesh.rotation.z += s.rotSpeed[2];
            s.mesh.position.y = s.basePos[1] + Math.sin(t * s.floatSpeed + idx) * 2;
            s.mesh.position.x = s.basePos[0] + Math.cos(t * s.floatSpeed * 0.5 + idx) * 1;
        });

        // Camera subtle drift
        camera.position.x += (mouse.x * 2 - camera.position.x) * 0.015;
        camera.position.y += (-mouse.y * 2 - camera.position.y) * 0.015;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    tick();
}

// ═══════════════════════════════════════════════
//  CURSOR GLOW
// ═══════════════════════════════════════════════
function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    if (!glow || window.matchMedia('(max-width: 768px)').matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let cx = x, cy = y;

    window.addEventListener('mousemove', e => {
        x = e.clientX;
        y = e.clientY;
    });

    function move() {
        cx += (x - cx) * 0.06;
        cy += (y - cy) * 0.06;
        glow.style.transform = `translate(${cx - 300}px, ${cy - 300}px)`;
        requestAnimationFrame(move);
    }
    move();
}

// ═══════════════════════════════════════════════
//  NAVBAR
// ═══════════════════════════════════════════════
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

// ═══════════════════════════════════════════════
//  GSAP SCROLL ANIMATIONS
// ═══════════════════════════════════════════════
function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Hero scroll indicator fade
    gsap.to('.hero-scroll', {
        opacity: 0,
        scrollTrigger: { trigger: '#hero', start: 'top top', end: '200px top', scrub: true },
    });

    // Hero parallax
    gsap.to('.hero-content', {
        y: -60,
        opacity: 0.2,
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    // Section intros
    gsap.utils.toArray('.section-intro').forEach(el => {
        gsap.from(el, {
            y: 40, opacity: 0,
            duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        });
    });

    // Service cards — staggered entrance
    gsap.from('.service-card', {
        y: 50, opacity: 0, scale: 0.95,
        duration: 0.7, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: '#services', start: 'top 75%', toggleActions: 'play none none none' },
    });

    // About — visual
    gsap.from('.about-visual', {
        x: -50, opacity: 0, scale: 0.95,
        duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '#about', start: 'top 75%', toggleActions: 'play none none none' },
    });

    // About — content
    gsap.from('.about-content', {
        x: 50, opacity: 0,
        duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '#about', start: 'top 75%', toggleActions: 'play none none none' },
    });

    // Feature items stagger
    gsap.from('.feature-item', {
        x: 30, opacity: 0,
        duration: 0.6, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: '#about', start: 'top 75%', toggleActions: 'play none none none' },
    });

    // Project cards
    gsap.from('.project-card', {
        y: 50, opacity: 0, scale: 0.96,
        duration: 0.7, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: '#work', start: 'top 75%', toggleActions: 'play none none none' },
    });

    // Team members
    gsap.from('.team-member', {
        y: 50, opacity: 0, scale: 0.92,
        duration: 0.8, ease: 'power3.out', stagger: 0.15,
        scrollTrigger: { trigger: '#team', start: 'top 75%', toggleActions: 'play none none none' },
    });

    // Contact
    gsap.from('.contact-info', {
        x: -40, opacity: 0,
        duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '#contact', start: 'top 75%', toggleActions: 'play none none none' },
    });
    gsap.from('.contact-form', {
        x: 40, opacity: 0, scale: 0.97,
        duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '#contact', start: 'top 75%', toggleActions: 'play none none none' },
    });
}

// ═══════════════════════════════════════════════
//  SERVICE CARD 3D TILT
// ═══════════════════════════════════════════════
function initServiceTilt() {
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(800px) rotateX(${y * -8}deg) rotateY(${x * 8}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });
    });
}

// ═══════════════════════════════════════════════
//  COUNTER ANIMATION
// ═══════════════════════════════════════════════
function initCounters() {
    const els = document.querySelectorAll('[data-count]');

    const animate = el => {
        const end = parseInt(el.getAttribute('data-count'));
        const dur = 2000;
        const start = performance.now();

        (function step(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(end * eased);
            if (p < 1) requestAnimationFrame(step);
        })(start);
    };

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); }
        });
    }, { threshold: 0.5 });

    els.forEach(el => obs.observe(el));
}

// ═══════════════════════════════════════════════
//  CONTACT FORM
// ═══════════════════════════════════════════════
function initContactForm() {
    const form = document.getElementById('contact-form');
    const btn = document.getElementById('form-submit');
    const budgetInput = document.getElementById('f-budget');

    // Geo-detect: if user's timezone is Asia/Kolkata or Asia/Calcutta, show INR
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const isIndia = tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta';

    if (isIndia) {
        budgetInput.placeholder = '₹15,000 - ₹2,00,000';
    } else {
        budgetInput.placeholder = '$500 - $10,000';
    }

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const fullName = document.getElementById('f-name').value.trim();
        const companyName = document.getElementById('f-company').value.trim();
        const phone = document.getElementById('f-phone').value.trim();
        const email = document.getElementById('f-email').value.trim();
        const budget = document.getElementById('f-budget').value.trim();
        const useCase = document.getElementById('f-usecase').value.trim();
        const requirements = document.getElementById('f-msg').value.trim();

        if (!fullName || !phone || !email || !budget || !useCase || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            btn.style.animation = 'shake 0.4s ease';
            btn.addEventListener('animationend', () => { btn.style.animation = ''; }, { once: true });
            return;
        }

        // Extract numeric value from budget to validate minimum
        const numericBudget = parseFloat(budget.replace(/[^0-9.]/g, ''));
        const minBudget = isIndia ? 12000 : 200;
        const currencyLabel = isIndia ? '₹12,000' : '$200';

        if (!isNaN(numericBudget) && numericBudget < minBudget) {
            alert(`Minimum budget is ${currencyLabel}. Please enter a higher amount.`);
            budgetInput.focus();
            return;
        }

        btn.classList.add('loading');
        btn.disabled = true;

        try {
            const response = await fetch('https://easilee33.app.n8n.cloud/webhook-test/onborading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName,
                    companyName: companyName || 'N/A',
                    phone,
                    email,
                    budget,
                    currency: isIndia ? 'INR' : 'USD',
                    useCase,
                    requirements: requirements || 'N/A',
                }),
            });

            btn.classList.remove('loading');

            if (response.ok) {
                btn.classList.add('success');
                setTimeout(() => {
                    btn.classList.remove('success');
                    btn.disabled = false;
                    form.reset();
                }, 2500);
            } else {
                throw new Error('Request failed');
            }
        } catch (err) {
            btn.classList.remove('loading');
            btn.disabled = false;
            btn.style.animation = 'shake 0.4s ease';
            btn.addEventListener('animationend', () => { btn.style.animation = ''; }, { once: true });
            console.error('Form submission error:', err);
        }
    });

    // Shake keyframes
    const s = document.createElement('style');
    s.textContent = `@keyframes shake {
        0%,100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }`;
    document.head.appendChild(s);
}
