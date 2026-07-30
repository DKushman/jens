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
CustomEase.create('windowDown', 'M0,0 C0.23,0 0.77,1 1,1');
ScrollTrigger.config({ limitCallbacks: true });

/* ---------- Wahlkreis-Karte: Tap/Klick öffnet Bild am Punkt ---------- */
const spots = document.querySelector('.map__spots');

function closeSpots(except) {
  spots?.querySelectorAll('[aria-expanded="true"]').forEach((btn) => {
    if (btn !== except) btn.setAttribute('aria-expanded', 'false');
  });
}

spots?.addEventListener('click', (event) => {
  const dot = event.target.closest('.map__dot');
  if (!dot) return;
  const isOpen = dot.getAttribute('aria-expanded') === 'true';
  closeSpots(dot);
  dot.setAttribute('aria-expanded', String(!isOpen));
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.map__spot')) closeSpots();
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
    closeSpots();
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
  $$('.reveal:not(.reveal--left):not(.reveal--right):not(.reveal--words):not(.reveal--sig):not(.reveal--spot)')
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

  $$('.reveal--spot').forEach((el, i) => {
    gsap.fromTo(el,
      { autoAlpha: 0, scale: 0.4, xPercent: -50, yPercent: -50 },
      { autoAlpha: 1, scale: 1, xPercent: -50, yPercent: -50,
        duration: 0.5, ease: 'back.out(1.4)', delay: i * 0.05,
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

  /* Fenster-Reveal: Vorhang von oben – Bild bleibt unverzerrt */
  $$('.bento__curtain').forEach((curtain) => {
    const frame = curtain.closest('.bento__frame');
    gsap.fromTo(curtain,
      { scaleY: 1, transformOrigin: '50% 0%' },
      { scaleY: 0, duration: 0.72, ease: 'windowDown',
        scrollTrigger: once(frame, 'top 92%') });
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

function initGalleryScrub() {
  const gallerySection = document.querySelector('.gallery');
  const galleryItems = $$('.gallery__ph');
  if (!gallerySection || !galleryItems.length) return () => {};

  const getFromX = (side) => {
    const off = window.innerWidth * 0.55 + 100;
    return side === 'right' ? off : -off;
  };

  const applyFrom = () => {
    galleryItems.forEach((ph) => {
      const side = ph.dataset.from === 'right' ? 'right' : 'left';
      const rot = parseFloat(getComputedStyle(ph).getPropertyValue('--gr')) || 0;
      gsap.set(ph, {
        rotation: rot,
        x: getFromX(side),
        autoAlpha: 0,
        force3D: true,
      });
    });
  };

  applyFrom();

  const flyTl = gsap.timeline({
    scrollTrigger: {
      trigger: gallerySection,
      start: 'top 68%',
      end: 'top 18%',
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  galleryItems.forEach((ph, i) => {
    flyTl.to(ph, { x: 0, autoAlpha: 1, ease: 'none', duration: 0.1 }, 0.08 + i * 0.012);
  });

  ScrollTrigger.addEventListener('refreshInit', applyFrom);

  return () => ScrollTrigger.removeEventListener('refreshInit', applyFrom);
}

mm.add('(min-width: 761px) and (prefers-reduced-motion: reduce)', () => {
  $$('.gallery__ph').forEach((ph) => {
    const rot = parseFloat(getComputedStyle(ph).getPropertyValue('--gr')) || 0;
    gsap.set(ph, { rotation: rot, x: 0, y: 0, autoAlpha: 1 });
  });
});

mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
  const track = document.querySelector('.career__track');
  const viewport = document.querySelector('.career__viewport');
  if (!track || !viewport) {
    const cleanupGallery = initGalleryScrub();
    ScrollTrigger.refresh();
    ScrollTrigger.update();
    return cleanupGallery;
  }

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

  const cleanupGallery = initGalleryScrub();
  ScrollTrigger.refresh();
  ScrollTrigger.update();

  return cleanupGallery;
});

mm.add('(max-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
  $$('.station').forEach((s) => {
    gsap.fromTo(s, { autoAlpha: 0, y: 24 }, {
      autoAlpha: 1, y: 0, duration: 0.65, ease: 'power2.out',
      scrollTrigger: once(s, 'top 90%'),
    });
  });
});
