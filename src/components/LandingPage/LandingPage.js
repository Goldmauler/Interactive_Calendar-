'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CalendarRange,
  Sparkles,
  Flame,
  NotebookPen,
  MoonStar,
  LayoutGrid,
  ChevronRight,
  PlayCircle,
} from 'lucide-react';
import styles from './LandingPage.module.css';

const APP_NAME = 'Calendra';

const FEATURES = [
  {
    title: 'Range Selection',
    desc: 'Pick start and end days with clear in-between highlighting.',
    icon: CalendarRange,
    tone: 'large',
  },
  {
    title: 'Festival Tracker',
    desc: 'Month-wise festival signals with visual markers.',
    icon: Sparkles,
    tone: 'small',
  },
  {
    title: 'Habit Streaks',
    desc: 'Track your daily wins and maintain momentum.',
    icon: Flame,
    tone: 'small',
  },
  {
    title: 'Notes and Events',
    desc: 'Keep quick notes and timed events in one planner.',
    icon: NotebookPen,
    tone: 'small',
  },
  {
    title: 'Dark Mode',
    desc: 'Balanced dark palette tuned for comfort and contrast.',
    icon: MoonStar,
    tone: 'small',
  },
  {
    title: 'Multi-view',
    desc: 'Switch between focused month and broader timeline context.',
    icon: LayoutGrid,
    tone: 'large',
  },
];

function HeadlineChars({ text, visible }) {
  return (
    <span className={styles.charWrap} aria-label={text}>
      {text.split('').map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className={`${styles.char} ${visible ? styles.charVisible : ''}`}
          style={{ '--char-index': i }}
          aria-hidden="true"
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}

export default function LandingPage() {
  const heroBgRef = useRef(null);
  const revealRefs = useRef([]);
  const progressFillRef = useRef(null);

  const [heroTextVisible, setHeroTextVisible] = useState(false);

  const navLinks = useMemo(
    () => [
      { href: '#features', label: 'Features' },
      { href: '#preview', label: 'Preview' },
      { href: '#proof', label: 'Proof' },
      { href: '#cta', label: 'Get Started' },
    ],
    []
  );

  useEffect(() => {
    const t = setTimeout(() => setHeroTextVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let raf = 0;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const next = max > 0 ? (window.scrollY / max) * 100 : 0;
        if (progressFillRef.current) {
          progressFillRef.current.style.width = `${Math.min(100, Math.max(0, next))}%`;
        }
        raf = 0;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      revealRefs.current.forEach(el => {
        if (!el) return;
        el.classList.add(styles.revealVisible);
      });
      return;
    }

    const onParallax = () => {
      if (!heroBgRef.current) return;
      const isMobile = window.matchMedia('(max-width: 839px)').matches;
      if (isMobile) {
        heroBgRef.current.style.transform = 'translate3d(0, 0, 0)';
        return;
      }

      const y = Math.min(window.scrollY * 0.2, 140);
      heroBgRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
    };
    onParallax();
    window.addEventListener('scroll', onParallax, { passive: true });
    window.addEventListener('resize', onParallax);

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          el.classList.add(styles.revealVisible);

          if (el.dataset.animate === 'features') {
            el.classList.add(styles.featuresVisible);
          }

          io.unobserve(el);
        });
      },
      { threshold: 0.2 }
    );

    revealRefs.current.forEach(el => {
      if (!el) return;
      el.classList.add(styles.revealReady);
      io.observe(el);
    });

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onParallax);
      window.removeEventListener('resize', onParallax);
    };
  }, []);

  const setRevealRef = el => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  return (
    <main className={styles.pageRoot}>
      <div className={styles.progressTrack} aria-hidden="true">
        <span ref={progressFillRef} className={styles.progressFill} />
      </div>

      <header className={styles.navWrap}>
        <nav className={styles.navBar}>
          <div className={styles.brand}>
            <Image
              src="/images/Adobe Express - file.png"
              alt={`${APP_NAME} logo`}
              width={36}
              height={36}
              priority
              className={styles.brandLogo}
            />
            <span className={styles.brandText}>{APP_NAME}</span>
          </div>
          <ul className={styles.navList}>
            {navLinks.map(link => (
              <li key={link.href}>
                <a href={link.href} className={styles.navLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/calendar" className={styles.navButton}>
            Open App
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div ref={heroBgRef} className={styles.heroBg} aria-hidden="true">
          <div className={styles.starField} />
          <div className={styles.gridField} />
        </div>

        <div className={styles.orbOne} aria-hidden="true" />
        <div className={styles.orbTwo} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.kicker}>Interactive Calendar</p>
            <h1 className={styles.heroTitle}>
              <HeadlineChars text="Your time, beautifully organised." visible={heroTextVisible} />
            </h1>
            <p className={styles.heroSub}>
              Notes, events, habits, festivals - all in one place.
            </p>
            <div className={styles.heroCtas}>
              <a href="#cta" className={styles.ctaPrimary}>
                Try it free <ChevronRight size={16} />
              </a>
              <a href="#preview" className={styles.ctaGhost}>
                <PlayCircle size={16} /> Watch demo
              </a>
            </div>
          </div>

          <aside className={styles.heroPreviewCard} aria-hidden="true">
            <Image
              src="/images/Adobe Express - file.png"
              alt="Calendra logo"
              fill
              priority
              sizes="(max-width: 840px) 92vw, 42vw"
              className={styles.heroPreviewImage}
            />
          </aside>
        </div>
      </section>

      <section id="features" ref={setRevealRef} data-animate="features" className={styles.sectionBlock}>
        <div className={styles.sectionHead}>
          <h2>Built for planning without friction</h2>
          <p>Fast interactions, clear visual hierarchy, and practical day-to-day utility.</p>
        </div>

        <div className={styles.bentoGrid}>
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                data-feature-card
                className={`${styles.featureCard} ${feature.tone === 'large' ? styles.featureLarge : ''}`}
                style={{ '--feature-index': idx }}
              >
                <Icon size={32} strokeWidth={1.8} className={styles.featureIcon} />
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="preview" ref={setRevealRef} className={styles.sectionBlock}>
        <div className={styles.sectionHead}>
          <h2>Live calendar preview</h2>
          <p>This is the real app embedded directly, so reviewers can see the actual interactive calendar.</p>
        </div>

        <div className={styles.previewPinWrap}>
          <div className={styles.previewPhoneShell}>
            <div className={styles.previewPhoneNotch} aria-hidden="true" />
            <iframe
              title="Interactive calendar live preview"
              src="/calendar"
              className={styles.previewIframe}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section id="proof" ref={setRevealRef} className={styles.proofStrip}>
        <div>
          <strong>12k+</strong>
          <span>Monthly planners</span>
        </div>
        <div>
          <strong>4.9/5</strong>
          <span>Average rating</span>
        </div>
        <div>
          <strong>98%</strong>
          <span>Say it is easier than spreadsheets</span>
        </div>
      </section>

      <section id="cta" ref={setRevealRef} className={styles.ctaSection}>
        <h2>Start planning with clarity today</h2>
        <p>Launch your month view, track what matters, and keep every note where it belongs.</p>
        <div className={styles.ctaRow}>
          <a href="#" className={styles.ctaPrimary}>Try it free <ChevronRight size={16} /></a>
          <a href="#preview" className={styles.ctaGhost}>See preview</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>{APP_NAME} - Interactive Calendar Experience</p>
        <p>Designed for focused planning on desktop and mobile.</p>
      </footer>
    </main>
  );
}
