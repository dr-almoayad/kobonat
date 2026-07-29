// components/VariantSelector/VariantSelector.jsx
'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import './VariantSelector.css';

const getFallbackIcon = (optionName = '') => {
  const name = optionName.toLowerCase();
  if (name.includes('color')) return 'palette';
  if (name.includes('storage') || name.includes('capacity')) return 'sd_storage';
  if (name.includes('size')) return 'straighten';
  if (name.includes('material')) return 'texture';
  return 'smartphone';
};

/**
 * VariantSelector – adapts to the new ComparisonProductVariant schema
 * 
 * product.variants = [
 *   { id, attributes: { Color: 'Black', Storage: '256GB' }, image: '...', isDefault, offers: [...] },
 *   ...
 * ]
 */
const VariantSelector = ({ product, onVariantChange }) => {
  const locale = useLocale();
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [activeVariant, setActiveVariant] = useState(null);
  const lastNotifiedRef = useRef(null);

  // 1. Build option groups from variants' attributes
  const optionGroups = useMemo(() => {
    const groups = {};
    product.variants?.forEach(v => {
      if (!v.isActive) return;
      Object.entries(v.attributes || {}).forEach(([key, value]) => {
        if (!groups[key]) groups[key] = new Set();
        groups[key].add(value);
      });
    });
    // Convert sets to arrays and sort for consistency
    const result = {};
    Object.keys(groups).forEach(key => {
      result[key] = Array.from(groups[key]).sort();
    });
    return result;
  }, [product.variants]);

  // 2. Get the list of option keys (e.g., ['Color', 'Storage'])
  const optionKeys = Object.keys(optionGroups);

  // 3. Find a matching variant given selected attributes
  const findMatchingVariant = (attrs) => {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.find(v =>
      v.isActive &&
      Object.entries(attrs).every(([key, val]) => v.attributes?.[key] === val)
    ) || null;
  };

  // 4. Auto-select default variant on mount
  useEffect(() => {
    if (!product.variants?.length || optionKeys.length === 0) return;

    // Find default variant (isDefault === true) or fallback to first active
    const defaultVariant = product.variants.find(v => v.isDefault && v.isActive) ||
                          product.variants.find(v => v.isActive) ||
                          product.variants[0];

    if (!defaultVariant) return;

    // Build initial selections from the default variant's attributes
    const initial = {};
    optionKeys.forEach(key => {
      if (defaultVariant.attributes && defaultVariant.attributes[key] !== undefined) {
        initial[key] = defaultVariant.attributes[key];
      } else {
        // If the default variant doesn't have this attribute, pick first available value
        const values = optionGroups[key] || [];
        if (values.length > 0) initial[key] = values[0];
      }
    });
    setSelectedAttributes(initial);
  }, [product.variants, optionKeys, optionGroups]);

  // 5. Notify parent when active variant changes
  useEffect(() => {
    if (!activeVariant) return;
    if (activeVariant.id === lastNotifiedRef.current) return;

    lastNotifiedRef.current = activeVariant.id;

    // Compute lowest price for the variant (from its offers)
    const variantOffers = activeVariant.offers || [];
    let lowestPrice = null;
    if (variantOffers.length > 0) {
      const prices = variantOffers.map(o => o.effectivePrice || o.currentPrice);
      lowestPrice = Math.min(...prices);
    }

    onVariantChange?.({
      variant: activeVariant,
      lowestPrice: lowestPrice,
    });
  }, [activeVariant, onVariantChange]);

  // 6. Update selected attributes and recalculate active variant
  const handleAttributeChange = (key, value) => {
    const newAttrs = { ...selectedAttributes, [key]: value };
    setSelectedAttributes(newAttrs);

    const matched = findMatchingVariant(newAttrs);
    setActiveVariant(matched);
  };

  // 7. Determine if a value is selectable (i.e., there exists at least one variant with that combination)
  const isValueAvailable = (key, value) => {
    // Temporarily replace the current attribute with the candidate value
    const testAttrs = { ...selectedAttributes, [key]: value };
    return findMatchingVariant(testAttrs) !== null;
  };

  // 8. Get image/color preview for a specific attribute value
  const getValuePreview = (key, value) => {
    // Find any variant that has this attribute value
    const sampleVariant = product.variants?.find(v =>
      v.isActive && v.attributes?.[key] === value
    );
    if (!sampleVariant) return null;

    // If it's a color, try to get a color code from the variant's attributes (we could store colorHex)
    // For now, we'll check if the value matches common color names and map them
    const colorMap = {
      black: '#000000',
      white: '#ffffff',
      red: '#ff0000',
      blue: '#0000ff',
      green: '#00ff00',
      yellow: '#ffff00',
      silver: '#c0c0c0',
      gold: '#ffd700',
      'space gray': '#8a8a8a',
      midnight: '#1a1a2e',
      starlight: '#f5f5dc',
      graphite: '#4a4a4a',
      pink: '#ff69b4',
      purple: '#800080',
      orange: '#ffa500',
    };
    const lowerVal = value.toLowerCase();
    const colorHex = colorMap[lowerVal] || null;

    // Image preview – use variant.image if available
    const image = sampleVariant.image || null;

    return { colorHex, image };
  };

  if (!product.variants?.length || optionKeys.length === 0) {
    return null;
  }

  return (
    <div className="variant-selector">
      {optionKeys.map(key => {
        const values = optionGroups[key] || [];
        const displayName = locale === 'ar' ? key : key; // Could add translation mapping later

        return (
          <div key={key} className="variant-option">
            <h4>{displayName}</h4>
            <div className="variant-values image-grid">
              {values.map(val => {
                const isSelected = selectedAttributes[key] === val;
                const isAvailable = isValueAvailable(key, val);
                const preview = getValuePreview(key, val);

                return (
                  <button
                    key={`${key}-${val}`}
                    onClick={() => isAvailable && handleAttributeChange(key, val)}
                    className={`
                      variant-image-btn
                      ${isSelected ? 'active' : ''}
                      ${!isAvailable ? 'disabled' : ''}
                    `.trim()}
                    disabled={!isAvailable}
                    title={val}
                  >
                    <div className="variant-image-wrapper">
                      {preview?.image ? (
                        <Image
                          src={preview.image}
                          alt={val}
                          width={80}
                          height={80}
                          className="option-image-preview"
                        />
                      ) : preview?.colorHex ? (
                        <span
                          className="color-swatch-large"
                          style={{ backgroundColor: preview.colorHex }}
                        />
                      ) : (
                        <span className="material-symbols-sharp option-icon-fallback">
                          {getFallbackIcon(key)}
                        </span>
                      )}
                    </div>
                    <span className="value-text">{val}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VariantSelector;
