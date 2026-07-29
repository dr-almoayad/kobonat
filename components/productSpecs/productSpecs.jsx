// components/productSpecs/productSpecs.jsx - ADAPTED FOR COMPARISON SCHEMA
"use client";
import React from "react";
import { useLocale } from "next-intl";
import "./productSpecs.css";

const SpecRow = ({ label, value }) => (
  <div className="spec_row">
    <span className="spec_label">{label}</span>
    <span className="spec_value">
      {typeof value === "boolean" ? (
        value ? (
          <span className="spec_yes">✓ Yes</span>
        ) : (
          <span className="spec_no">✗ No</span>
        )
      ) : (
        value || 'N/A'
      )}
    </span>
  </div>
);

const SpecSection = ({ title, data }) => {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;
  
  return (
    <div className="spec_section">
      <h3 className="spec_title">{title}</h3>
      <div>
        {entries.map(([label, value]) => (
          <SpecRow key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
};

export default function ProductSpecs({ product }) {
  const locale = useLocale();
  const lang = locale.split('-')[0];
  
  if (!product) return null;

  // ── NEW: Read from product.specifications (ComparisonProduct.specifications JSON) ──
  const rawSpecs = product.specifications || [];
  
  // Build a flat key-value map using the current locale
  const specMap = {};
  rawSpecs.forEach(item => {
    const key = lang === 'ar' ? (item.key_ar || item.key_en) : (item.key_en || item.key_ar);
    const value = lang === 'ar' ? (item.value_ar || item.value_en) : (item.value_en || item.value_ar);
    if (key && value) {
      specMap[key] = value;
    }
  });

  // ── Also add brand name if available (it's separate from specifications) ──
  if (product.brand?.name && !specMap['Brand']) {
    specMap['Brand'] = product.brand.name;
  }

  // If no specifications available
  if (Object.keys(specMap).length === 0) {
    return (
      <section className="specs_section">
        <div className="specs_section_container">
          <div className="specs_section_header">
            <h2>Product Specifications</h2>
            <p>No specifications available for this product.</p>
          </div>
        </div>
      </section>
    );
  }

  // ── Categorization (same logic as before) ──
  const categorizedSpecs = {
    "General": {},
    "Technical": {},
    "Physical": {},
    "Other": {}
  };

  const technicalKeywords = ['processor', 'cpu', 'gpu', 'ram', 'memory', 'storage', 'battery', 'camera', 'display', 'screen', 'resolution', 'chipset', 'connectivity', 'wifi', 'bluetooth'];
  const physicalKeywords = ['weight', 'dimensions', 'size', 'height', 'width', 'depth', 'color', 'material'];
  const generalKeywords = ['brand', 'model', 'year', 'warranty', 'manufacturer'];

  Object.entries(specMap).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    
    if (generalKeywords.some(kw => lowerKey.includes(kw))) {
      categorizedSpecs["General"][key] = value;
    } else if (technicalKeywords.some(kw => lowerKey.includes(kw))) {
      categorizedSpecs["Technical"][key] = value;
    } else if (physicalKeywords.some(kw => lowerKey.includes(kw))) {
      categorizedSpecs["Physical"][key] = value;
    } else {
      categorizedSpecs["Other"][key] = value;
    }
  });

  // Remove empty categories
  const filteredCategories = Object.entries(categorizedSpecs).filter(
    ([_, data]) => Object.keys(data).length > 0
  );

  const totalSpecs = Object.keys(specMap).length;
  const shouldCategorize = totalSpecs > 6;

  if (!shouldCategorize) {
    return (
      <section className="specs_section">
        <div className="specs_section_container">
          <div className="specs_section_header">
            <h2>Product Specifications</h2>
          </div>
          <div className="specs_grid">
            <div className="specs_col">
              <SpecSection title="Specifications" data={specMap} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const mid = Math.ceil(filteredCategories.length / 2);
  const leftCategories = filteredCategories.slice(0, mid);
  const rightCategories = filteredCategories.slice(mid);

  return (
    <section className="specs_section">
      <div className="specs_section_container">
        <div className="specs_section_header">
          <h2>Product Specifications</h2>
          <p>Detailed technical specifications and features</p>
        </div>
        <div className="specs_grid">
          <div className="specs_col">
            {leftCategories.map(([title, data]) => (
              <SpecSection key={title} title={title} data={data} />
            ))}
          </div>
          <div className="specs_col">
            {rightCategories.map(([title, data]) => (
              <SpecSection key={title} title={title} data={data} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
