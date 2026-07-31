/*
 * SCROLL-ANIMATIONEN (GSAP ScrollTrigger)
 *
 * Performance-Regeln (Priorität #1):
 * – Nur transform + opacity (Compositor, keine Layout-Thrashing)
 * – Kein clip-path, kein filter-Animate, kein rotationX / 3D
 * – Entrance-Reveals: once:true → Trigger entfernt sich danach selbst
 * – scrub für Band + Slabs + Werdegang
 * – Galerie Desktop: scrub Einflug links/rechts, bleibt sichtbar (transform + opacity)
 * – Hero-Intro + Marquee bleiben reines CSS
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('reveal', 'M0,0 C0.77,0 0.175,1 1,1');
ScrollTrigger.config({ limitCallbacks: true });

/* ---------- Preloader → Hero-Intro ---------- */
function finishPreloader(preloader) {
  document.documentElement.dataset.ready = 'true';
  document.documentElement.removeAttribute('data-loading');
  preloader?.remove();
  ScrollTrigger.refresh();
}

function initHeroVotePop(delay = 0) {
  const heroVote = document.querySelector('.hero__vote');
  if (!heroVote) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(heroVote, { clearProps: 'all' });
    return;
  }

  gsap.fromTo(
    heroVote,
    { scale: 0.35, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: 0.75, ease: 'back.out(2)', delay },
  );
}

function initPreloader() {
  const preloader = document.getElementById('preloader');
  const heroFrame = document.querySelector('.hero__frame');
  const heroImg = document.querySelector('.hero__frame img');
  const heroVote = document.querySelector('.hero__vote');

  if (!preloader || !heroFrame) {
    finishPreloader(preloader);
    initHeroVotePop(0.15);
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finishPreloader(preloader);
    return;
  }

  document.documentElement.dataset.loading = 'true';

  const line = preloader.querySelector('.preloader__line');
  const nameLine = preloader.querySelector('.preloader__name-mask > span');
  const sigPath = preloader.querySelector('.preloader__sig-path');
  const inner = preloader.querySelector('.preloader__inner');

  gsap.set(line, { scaleX: 0, transformOrigin: 'left center' });
  gsap.set(nameLine, { yPercent: 120 });
  gsap.set(sigPath, { autoAlpha: 0 });
  gsap.set(heroFrame, { scale: 0.05, autoAlpha: 0 });
  gsap.set(heroImg, { scale: 1.35 });
  gsap.set(heroVote, { scale: 0.35, autoAlpha: 0 });

  if (sigPath) {
    const len = sigPath.getTotalLength();
    gsap.set(sigPath, {
      strokeDasharray: len,
      strokeDashoffset: len,
      autoAlpha: 1,
    });
  }

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    onComplete: () => finishPreloader(preloader),
  });

  tl.to(line, { scaleX: 1, duration: 0.85, ease: 'power2.inOut' })
    .to(nameLine, { yPercent: 0, duration: 0.7, ease: 'power3.out' }, '-=0.05')
    .to(sigPath, { strokeDashoffset: 0, duration: 1.15, ease: 'power1.inOut' }, '+=0.1')
    .to({}, { duration: 0.28 })
    .to(inner, { y: 72, autoAlpha: 0, duration: 0.7, ease: 'power2.in' })
    .to(preloader, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, '-=0.25')
    .add(() => {
      document.documentElement.dataset.ready = 'true';
    }, '-=0.15')
    .to(heroFrame, { scale: 1, autoAlpha: 1, duration: 1.45, ease: 'power3.out' }, '-=0.05')
    .to(heroImg, { scale: 1, duration: 1.45, ease: 'power3.out' }, '<')
    .to(heroVote, { scale: 1, autoAlpha: 1, duration: 0.75, ease: 'back.out(2)' }, '+=0.4');
}

initPreloader();

/* ---------- Wahlkreis-Karte ----------
 * Marker und Ortsliste teilen einen Zustand: Zeigen (Hover) und Merken (Klick)
 * sind getrennt, damit ein Klick auf einen bereits überfahrenen Punkt nichts
 * zurücknimmt. Gerendert wird nur über eine Klasse – kein Layout-Lesen.
 */
const mapRoot = document.querySelector('[data-map]');
const mapTargets = mapRoot ? Array.from(mapRoot.querySelectorAll('[data-i]')) : [];
let mapPinned = '';
let mapHovered = '';
let mapShown = '';

function renderMap() {
  const next = mapPinned || mapHovered;
  if (next === mapShown) return;
  mapShown = next;
  mapTargets.forEach((el) => {
    const on = el.dataset.i === next;
    el.classList.toggle('is-on', on);
    if (el.tagName === 'BUTTON') el.setAttribute('aria-expanded', String(on));
  });
}

function closeMap() {
  mapPinned = '';
  mapHovered = '';
  renderMap();
}

mapRoot?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-i]');
  if (!button) return;
  mapPinned = mapPinned === button.dataset.i ? '' : button.dataset.i;
  renderMap();
});

document.addEventListener('click', (event) => {
  if (mapShown && !event.target.closest('[data-map]')) closeMap();
});

if (mapRoot && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  mapRoot.addEventListener('pointerover', (event) => {
    const button = event.target.closest('button[data-i]');
    if (!button) return;
    mapHovered = button.dataset.i;
    renderMap();
  });

  mapRoot.addEventListener('pointerleave', () => {
    mapHovered = '';
    renderMap();
  });
}

/* ---------- Galerie: Lightbox (mobil) ---------- */
const galleryGrid = document.querySelector('.gallery__grid');
const galleryLightbox = document.getElementById('gallery-lightbox');
const galleryLightboxImg = galleryLightbox?.querySelector('.gallery-lightbox__img');
const galleryLightboxClose = galleryLightbox?.querySelector('.gallery-lightbox__close');
const galleryMobile = window.matchMedia('(max-width: 760px)');

function galleryLightboxSrc(src) {
  return src.replace(/w_\d+/, 'w_1600');
}

function openGalleryLightbox(img) {
  if (!galleryLightbox || !galleryLightboxImg) return;
  galleryLightboxImg.src = galleryLightboxSrc(img.src);
  galleryLightboxImg.alt = img.alt;
  galleryLightbox.showModal();
}

function closeGalleryLightbox() {
  galleryLightbox?.close();
}

galleryGrid?.addEventListener('click', (event) => {
  if (!galleryMobile.matches) return;
  const img = event.target.closest('.gallery__item img');
  if (!img) return;
  openGalleryLightbox(img);
});

galleryLightboxClose?.addEventListener('click', closeGalleryLightbox);

galleryLightbox?.addEventListener('click', (event) => {
  if (event.target === galleryLightbox) closeGalleryLightbox();
});

galleryLightbox?.addEventListener('close', () => {
  if (galleryLightboxImg) {
    galleryLightboxImg.removeAttribute('src');
    galleryLightboxImg.alt = '';
  }
});

/* ---------- Fullscreen-Menü (mobil) ---------- */
const burger = document.querySelector('.topbar__burger');
const menu = document.querySelector('.menu');

function setMenu(open) {
  if (!burger) return;
  document.documentElement.dataset.menu = open ? 'open' : '';
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
}

burger?.addEventListener('click', () => {
  setMenu(document.documentElement.dataset.menu !== 'open');
});

menu?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMap();
    setMenu(false);
  }
});

/* ================== SCROLL-ANIMATIONEN (GSAP) ================== */
const mm = gsap.matchMedia();
const $$ = (sel) => gsap.utils.toArray(sel);

const once = (trigger, start = 'top 90%') => ({
  trigger,
  start,
  once: true,
});

const inBento = (el) => el.closest('.bento');

mm.add('(prefers-reduced-motion: no-preference)', () => {
  /* Manifest: Hintergrund wischt von links nach rechts (nur transform) */
  $$('.manifest__line').forEach((line, i) => {
    const bg = line.querySelector('.manifest__bg');
    if (!bg) return;
    gsap.fromTo(bg,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.85, ease: 'reveal', delay: i * 0.12,
        scrollTrigger: once(line, 'top 88%') });
  });

  $$('.reveal:not(.reveal--left):not(.reveal--right):not(.reveal--words):not(.reveal--sig)')
    .filter((el) => !inBento(el))
    .forEach((el) => {
      gsap.fromTo(el, { autoAlpha: 0, y: 28 }, {
        autoAlpha: 1, y: 0, duration: 0.65, ease: 'power2.out',
        scrollTrigger: once(el),
      });
    });

  $$('.reveal--left').forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, x: -60 }, {
      autoAlpha: 1, x: 0, duration: 0.7, ease: 'power2.out',
      scrollTrigger: once(el, 'top 88%'),
    });
  });

  $$('.reveal--right').forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, x: 60 }, {
      autoAlpha: 1, x: 0, duration: 0.7, ease: 'power2.out',
      scrollTrigger: once(el, 'top 88%'),
    });
  });

  /* Karten-Marker: setzen sich einzeln auf die Karte (Skalierung um den Ortspunkt) */
  $$('.map__pin').forEach((el, i) => {
    gsap.fromTo(el,
      { autoAlpha: 0, scale: 0.4 },
      { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)', delay: i * 0.07,
        scrollTrigger: once('.map', 'top 85%') });
  });

  $$('.reveal--words').forEach((container) => {
    const spans = container.querySelectorAll('.w > span');
    gsap.fromTo(spans, { yPercent: 110 }, {
      yPercent: 0, duration: 0.6, ease: 'power3.out', stagger: 0.022,
      scrollTrigger: once(container, 'top 88%'),
    });
  });

  /* Stat-Zahlen: scroll-getrieben, später und langsamer */
  const statsSection = document.querySelector('.person__stats');
  const nums = $$('.stat__num');
  if (statsSection && nums.length) {
    gsap.set(nums, { yPercent: 110 });
    const statsTl = gsap.timeline({
      scrollTrigger: {
        trigger: statsSection,
        start: 'top 58%',
        end: 'top 12%',
        scrub: true,
      },
    });
    nums.forEach((num, i) => {
      statsTl.to(num, { yPercent: 0, ease: 'none', duration: 0.32 }, 0.24 + i * 0.15);
    });
  }

  /* Band: Container 100vw×100svh, skaliert von klein auf exakt Vollbild */
  const bandWrap = document.querySelector('.band-wrap');
  const band = document.querySelector('.band');
  if (bandWrap && band) {
    gsap.fromTo(band, { scale: 0.12 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: bandWrap,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    const bandImg = band.querySelector('img');
    if (bandImg) {
      gsap.fromTo(bandImg, { yPercent: -4 }, {
        yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: bandWrap, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  }

  /* Bento: exakt wie Hero (window-open + img-settle), scroll-getriggert */
  $$('.bento__frame').forEach((frame) => {
    ScrollTrigger.create({
      trigger: frame,
      start: 'top 92%',
      once: true,
      onEnter: () => frame.classList.add('is-open'),
    });
  });

  $$('.slab:not(.goals)').forEach((section) => {
    const bg = section.querySelector('.slab__bg');
    if (!bg) return;
    gsap.fromTo(bg, { scale: 0.94 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 50%', scrub: true },
    });
  });

  return () => {};
});

mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
  /* Ziele Desktop: Vorschaubild folgt dem Cursor (nur transform + opacity) */
  const goals = document.querySelector('.goals');
  const floater = document.querySelector('.goals__floater');
  const floaterImg = floater?.querySelector('img');
  if (goals && floater && floaterImg) {
    gsap.set(floater, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.94 });
    const setX = gsap.quickSetter(floater, 'x', 'px');
    const setY = gsap.quickSetter(floater, 'y', 'px');

    goals.addEventListener('mousemove', (e) => {
      setX(e.clientX);
      setY(e.clientY);
    });

    $$('.goals__item').forEach((item) => {
      item.addEventListener('mouseenter', () => {
        const src = item.dataset.img;
        if (src) floaterImg.src = src;
        gsap.to(floater, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power2.out' });
      });
      item.addEventListener('mouseleave', () => {
        gsap.to(floater, { autoAlpha: 0, scale: 0.94, duration: 0.18, ease: 'power2.in' });
      });
    });
  }
});

mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
  const track = document.querySelector('.career__track');
  const viewport = document.querySelector('.career__viewport');
  if (!track || !viewport) return;

  viewport.style.overflowX = 'hidden';
  viewport.style.overflowY = 'visible';
  const stations = $$('.station');
  const getX = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

  const getStationProgress = () => {
    const padL = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const padR = parseFloat(getComputedStyle(track).paddingRight) || 0;
    const span = track.scrollWidth - padL - padR;
    return stations.map((s) => {
      const dot = s.querySelector('.station__dot');
      const x = s.offsetLeft + dot.offsetLeft + dot.offsetWidth * 0.5;
      return span > 0 ? gsap.utils.clamp(0, 1, (x - padL) / span) : 0;
    });
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.career',
      start: 'top top',
      end: () => '+=' + (getX() + window.innerHeight * 0.22),
      pin: true,
      scrub: 0.8,
      fastScrollEnd: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  tl.to(track, { x: () => -getX(), ease: 'none', duration: 1 }, 0);
  tl.fromTo('.career__progress', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0);
  tl.fromTo('.career__wash', { opacity: 0 }, { opacity: 0.08, duration: 0.2, ease: 'none' }, 0.05)
    .to('.career__wash', { opacity: 0, duration: 0.2, ease: 'none' }, 0.75);

  const progresses = getStationProgress();
  stations.forEach((s, i) => {
    const dot = s.querySelector('.station__dot');
    gsap.set(s, { autoAlpha: 0.22, y: 10 });
    gsap.set(dot, { scale: 0.55 });
    tl.to(s, { autoAlpha: 1, y: 0, duration: 0.05, ease: 'none' }, progresses[i]);
    tl.to(dot, { scale: 1, duration: 0.05, ease: 'none' }, progresses[i]);
  });

  ScrollTrigger.refresh();
  ScrollTrigger.update();
});

mm.add('(max-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
  $$('.station').forEach((s) => {
    gsap.fromTo(s, { autoAlpha: 0, y: 24 }, {
      autoAlpha: 1, y: 0, duration: 0.65, ease: 'power2.out',
      scrollTrigger: once(s, 'top 90%'),
    });
  });
});
