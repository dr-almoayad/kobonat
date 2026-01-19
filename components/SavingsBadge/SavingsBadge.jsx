// components/SavingsBadge/SavingsBadge.jsx
'use client';
import React from 'react';
import './SavingsBadge.css';

const SavingsBadge = ({ savingsData, compact = false }) => {
  if (!savingsData || savingsData.percentageSaving < 5) return null;

  const { percentageSaving, absoluteSaving } = savingsData;

  // Determine badge level based on savings
  const getBadgeLevel = () => {
    if (percentageSaving >= 50) return 'unicorn';
    if (percentageSaving >= 30) return 'hot';
    if (percentageSaving >= 20) return 'great';
    return 'good';
  };

  const level = getBadgeLevel();

  const badgeConfig = {
    unicorn: { 
      label: '🦄 UNICORN', 
      color: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFD700, #FFA500)'
    },
    hot: { 
      label: '🔥 HOT DEAL', 
      color: '#FF4500',
      gradient: 'linear-gradient(135deg, #FF4500, #FF6347)'
    },
    great: { 
      label: '⭐ GREAT', 
      color: '#00C853',
      gradient: 'linear-gradient(135deg, #00C853, #64DD17)'
    },
    good: { 
      label: '👍 GOOD', 
      color: '#2196F3',
      gradient: 'linear-gradient(135deg, #2196F3, #03A9F4)'
    }
  };

  const config = badgeConfig[level];

  if (compact) {
    return (
      <div 
        className="savings-badge-compact"
        style={{ background: config.gradient }}
      >
        <span className="percentage">-{Math.round(percentageSaving)}%</span>
      </div>
    );
  }

  return (
    <div className="savings-badge-container">
      <div 
        className={`savings-badge savings-badge-${level}`}
        style={{ background: config.gradient }}
      >
        <div className="badge-top">
          <span className="badge-label">{config.label}</span>
        </div>
        <div className="badge-savings">
          <span className="percentage">{Math.round(percentageSaving)}%</span>
          <span className="off">OFF</span>
        </div>
        <div className="badge-amount">
          Save {Math.round(absoluteSaving)} SAR
        </div>
      </div>
    </div>
  );
};

export default SavingsBadge;