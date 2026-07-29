// components/tabnav/Tabnav.jsx

'use client';
import React, { useEffect, useRef, useState } from 'react';
import './tabnav.css';

const TABS = [
  { id: 'price-list', label: 'Prices' },
  { id: 'product-specs', label: 'Specs' },
  { id: 'price-history', label: 'Price History' },
];

export default function TabNavigation() {
  const navRef = useRef(null);
  const [active, setActive] = useState(TABS[0].id);
  const rafRef = useRef(null);

  function getOffsets() {
    const headerHeight =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--site-header-height'
        )
      ) || 0;
    const navHeight =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--tabnav-height'
        )
      ) || 0;
    const total = headerHeight + navHeight + 8;
    return { headerHeight, navHeight, total };
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const { total } = getOffsets();
    const top = el.getBoundingClientRect().top + window.scrollY - total;
    window.scrollTo({ top, behavior: 'smooth' });
    setActive(id);
  }

  useEffect(() => {
    const sections = document.querySelectorAll('.tab_section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-150px 0px -50% 0px',
        threshold: 0.25,
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <nav ref={navRef} className="tab-navigation">
      <div className="tab-navigation-inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => scrollToSection(t.id)}
            className={`tab-btn ${active === t.id ? 'active' : ''}`}
            aria-current={active === t.id ? 'true' : 'false'}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
