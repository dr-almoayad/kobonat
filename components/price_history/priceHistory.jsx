// components/price_history/priceHistory.jsx
'use client';
import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useLocale } from 'next-intl';
import './priceHistory.css';

export default function PriceHistory({ product }) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [range, setRange] = useState('all');

  // Use the pre-fetched price history (from the best offer)
  const rawHistory = product.priceHistory || [];

  // Transform data for chart
  const historyData = useMemo(() => {
    return rawHistory.map(item => ({
      date: new Date(item.recordedAt || item.timestamp).toLocaleDateString(
        isRtl ? 'ar-SA' : 'en-US',
        { month: 'short', day: 'numeric' }
      ),
      price: parseFloat(item.price),
      fullDate: item.recordedAt || item.timestamp,
    }));
  }, [rawHistory, isRtl]);

  // Filter by range
  const filteredData = useMemo(() => {
    if (range === 'all') return historyData;
    const days = range === '7d' ? 7 : range === '1m' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return historyData.filter(d => new Date(d.fullDate) >= cutoff);
  }, [historyData, range]);

  // If no data, show empty state
  if (filteredData.length === 0) {
    return (
      <section className="price_history">
        <div className="price_history_container">
          <h2>Price History</h2>
          <p>No price history available for this product.</p>
        </div>
      </section>
    );
  }

  // Calculate stats
  const prices = filteredData.map(d => d.price);
  const currentPrice = prices[prices.length - 1] || 0;
  const lowestPrice = Math.min(...prices);
  const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Determine trend from last two points
  let trend = null;
  if (prices.length >= 2) {
    const latest = prices[prices.length - 1];
    const previous = prices[prices.length - 2];
    if (latest < previous) trend = 'down';
    else if (latest > previous) trend = 'up';
  }

  return (
    <section className="price_history">
      <div className="price_history_container">
        <div className="price_history_header">
          <h2>Price History</h2>
          <div className="range_selector">
            {['7d', '1m', '3m', 'all'].map(r => (
              <button
                key={r}
                className={range === r ? 'active' : ''}
                onClick={() => setRange(r)}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="chart_wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="10%" stopColor="#7B61FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7B61FF" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#888"
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v) => `${v}`}
                tick={{ fontSize: 12 }}
                stroke="#888"
              />
              <Tooltip
                formatter={(value) => [`${value.toFixed(2)} SAR`, 'Price']}
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#7B61FF"
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="price_table">
          <div className="price_cell">
            <p>Lowest Price</p>
            <h2>{lowestPrice.toFixed(2)} SAR</h2>
            <span>In this period</span>
          </div>
          <div className="price_cell">
            <p>Current Price</p>
            <h2>
              {currentPrice.toFixed(2)} SAR
              {trend && (
                <span
                  style={{
                    color: trend === 'down' ? '#22c55e' : '#ef4444',
                    fontSize: '0.9rem',
                    marginLeft: '8px',
                  }}
                >
                  {trend === 'down' ? '↓' : '↑'}
                </span>
              )}
            </h2>
            <span>Latest</span>
          </div>
          <div className="price_cell">
            <p>Average Price</p>
            <h2>{averagePrice.toFixed(2)} SAR</h2>
            <span>In this period</span>
          </div>
        </div>
      </div>
    </section>
  );
}
