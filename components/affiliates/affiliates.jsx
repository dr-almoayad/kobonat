// components/Affiliates/Affiliates.jsx
'use client'
import React from 'react';
import './affiliates.css'
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';

const Affiliates = () => {
  const t = useTranslations('Affiliates');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const brands = [
    {
      id: 1,
      name: "Amazon",
      logo: "/amazon.png",
      category: "Retail",
      accent: "#000000",
      bg: '/amazon_bg.jpg'
    },
    {
      id: 2,
      name: "Noon",
      logo: "/noon.png",
      category: "Retail",
      accent: "#f4dd11",
      bg: '/noon_bg.jpg'
    },
    {
      id: 3,
      name: "TEMU",
      logo: "/temu.png",
      category: "Retail",
      accent: "#ff8201",
      bg: '/temu_bg.jpg'
    },
    {
      id: 4,
      name: "Aliexpress",
      logo: "/ali.png",
      category: "Retail",
      accent: "#e43225",
      bg: '/ali_bg.png'
    },
    {
      id: 5,
      name: "Jarir",
      logo: "/jarir.png",
      category: "Electronics",
      accent: "#ed1d24",
      bg: '/jarir_bg.jpg'
    },
    {
      id: 6,
      name: "Extra",
      logo: "/extra.png",
      category: "Electronics",
      accent: "#0067a4",
      bg: '/extra_bg.png'
    },
    {
      id: 7,
      name: "Samsung",
      logo: "/samsung.png",
      category: "Electronics",
      accent: "#000000",
      bg: '/samsung_bg.jpg'
    },
    {
      id: 8,
      name: "LG",
      logo: "/lg.png",
      category: "Electronics",
      accent: "#a50034",
      bg: '/lg_bg.jpg'
    },
    {
      id: 9,
      name: "Playstation",
      logo: "/playstation.png",
      category: "Video Games",
      accent: "#0070d1",
      bg: '/playstation_bg.png'
    },
    {
      id: 10,
      name: "Tamkeen",
      logo: "/tamkeen.png",
      category: "Electronics",
      accent: "#0e1831",
      bg: '/tamkeen_bg.jpg'
    },
    {
      id: 11,
      name: "Styli",
      logo: "/styli.png",
      category: "Retail",
      accent: "#000000",
      bg: '/styli_bg.jpeg'
    },
    {
      id: 12,
      name: "Trendyol",
      logo: "/trendyol.png",
      category: "Fashion",
      accent: "#f4dd11",
      bg: '/trendyol_bg.jpg'
    },
    {
      id: 13,
      name: "Foot Locker",
      logo: "/footlocker.png",
      category: "E-commerce",
      accent: "#ff8201",
      bg: '/footlocker_bg.jpg'
    },
    {
      id: 14,
      name: "Raneen",
      logo: "/raneen.png",
      category: "Travel",
      accent: "#e43225",
      bg: '/raneen_bg.jpg'
    },
    {
      id: 15,
      name: "Sephora",
      logo: "/sephora.png",
      category: "Electronics",
      accent: "#ed1d24",
      bg: '/sephora_bg.jpg'
    },
    {
      id: 16,
      name: "Nike",
      logo: "/Nike.png",
      category: "Fashion",
      accent: "#0067a4",
      bg: '/nike_bg.jpg'
    },
    {
      id: 17,
      name: "Adidas",
      logo: "/adidas.png",
      category: "Fashion",
      accent: "#000000",
      bg: '/adidas_bg.avif'
    },
    {
      id: 18,
      name: "Sun & Sand Sports",
      logo: "/sss.png",
      category: "E-commerce",
      accent: "#a50034",
      bg: '/sss_bg.jpg'
    },
    {
      id: 19,
      name: "Namshi",
      logo: "/namshi.jpg",
      category: "Retail",
      accent: "#b6ed2f",
      bg: '/namshi_bg.jpg'
    },
    {
      id: 20,
      name: "Newegg",
      logo: "/newegg.png",
      category: "Retail",
      accent: "#b6ed2f",
      bg: '/newegg_bg.jpg'
    },
    {
      id: 21,
      name: "Shein",
      logo: "/shein.png",
      category: "Retail",
      accent: "#b6ed2f",
      bg: '/shein_bg.jpg'
    },
  ];

  const [numColumns, setNumColumns] = useState(5);
  const [columnDurations, setColumnDurations] = useState([]);

  // Function to generate random duration
  const getRandomDuration = () => {
    return Math.random() * (60 - 30) + 30;
  };

  // Update column count based on screen size
  useEffect(() => {
    const handleResize = () => {
      let newNumColumns;
      if (window.innerWidth <= 768) {
        newNumColumns = 3;
      } else if (window.innerWidth <= 1024) {
        newNumColumns = 4;
      } else {
        newNumColumns = 5;
      }
      setNumColumns(newNumColumns);

      setColumnDurations(Array.from({ length: newNumColumns }, () => getRandomDuration()));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const splitIntoColumns = (arr, cols) => {
    return Array.from({ length: cols }, (_, i) =>
      arr.filter((_, idx) => idx % cols === i)
    );
  };

  const columns = splitIntoColumns(brands, numColumns);

  return (
    <section className='affiliates_section' dir={isRtl ? 'rtl' : 'ltr'}>
      <h1 className="carousel-title">{t('title')}</h1>
      <div className="brands-wrapper">
        <div className="brands-columns">
          {columns.map((col, colIdx) => (
            <div
              key={colIdx}
              className="brand-column"
              style={{
                animationDuration: `${columnDurations[colIdx]}s`,
                animationDelay: `${colIdx * 2}s`
              }}
            >
              {col.concat(col).map((b, i) => (
                <div className="brand-card" key={i} style={{ '--accent-color': b.accent, '--affiliate-bg': b.bg }}>
                  <Image className='affiliate_bg' src={b.bg} alt={b.name} width={1000} height={1000} style={{aspectRatio: '1/1'}}/>
                  <Image className='affiliate_logo' src={b.logo} alt={b.name} width={200} height={200}/>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Affiliates;