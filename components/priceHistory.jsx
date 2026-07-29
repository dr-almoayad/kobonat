// ============================================================================
// 1. FIXED PRICE HISTORY COMPONENT
// components/price_history/priceHistory.jsx
// ============================================================================

"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import "./priceHistory.css";

export default function PriceHistory({ product }) {
    const [priceHistory, setPriceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [priceDirection, setPriceDirection] = useState(null);
    const [range, setRange] = useState("all");

    if (!product || !product.stores || product.stores.length === 0) {
        return (
            <section className="price_history">
                <div className="price_history_container">
                    <h2>Price History</h2>
                    <p>No price history available for this product.</p>
                </div>
            </section>
        );
    }

    const initialLowestSeller = product.stores.reduce((prev, curr) => 
        curr.price < prev.price ? curr : prev
    );

    const [selectedStoreId, setSelectedStoreId] = useState(initialLowestSeller.storeId);

    const selectedSellerProduct = useMemo(() => {
        return product.stores.find(s => s.storeId === selectedStoreId) || initialLowestSeller;
    }, [selectedStoreId, product.stores, initialLowestSeller]);

    // Fetch price history
    useEffect(() => {
        const fetchPriceHistory = async () => {
            try {
                setLoading(true);
                const res = await fetch(
                    `/api/products/${product.id}/price-history?storeId=${selectedStoreId}&range=${range}`
                );
                
                if (!res.ok) throw new Error('Failed to fetch price history');
                
                const data = await res.json();
                setPriceHistory(data.history || []);
                setPriceDirection(data.trend);
            } catch (err) {
                console.error("Error fetching price history:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        if (product?.id) {
            fetchPriceHistory();
        }
    }, [product.id, selectedStoreId, range]);

    const filteredData = useMemo(() => {
        return priceHistory.map(item => ({
            date: new Date(item.timestamp).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }),
            price: parseFloat(item.price),
            fullDate: item.timestamp
        }));
    }, [priceHistory]);

    const lowestPrice = useMemo(() => {
        const allPrices = product.stores.map(s => parseFloat(s.price));
        return Math.min(...allPrices);
    }, [product.stores]);

    const currentPrice = parseFloat(selectedSellerProduct.price);
    const selectedSellerName = selectedSellerProduct.store.name || "N/A";

    // Calculate price statistics
    const priceStats = useMemo(() => {
        if (filteredData.length === 0) return null;

        const prices = filteredData.map(d => d.price);
        const lowest = Math.min(...prices);
        const highest = Math.max(...prices);
        const average = prices.reduce((a, b) => a + b, 0) / prices.length;

        return { lowest, highest, average };
    }, [filteredData]);

    if (loading) {
        return (
            <section className="price_history">
                <div className="price_history_container">
                    <h2>Price History</h2>
                    <div className="loading-spinner">Loading price data...</div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="price_history">
                <div className="price_history_container">
                    <h2>Price History</h2>
                    <p className="error-message">Error loading price history: {error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="price_history">
            <div className="price_history_container">
                <div className="price_history_header">
                    <h2>Price History</h2>
                    <div className="price_history_header_actions">
                        <select
                            value={selectedStoreId}
                            onChange={(e) => setSelectedStoreId(parseInt(e.target.value))}
                        >
                            {product.stores.map((sp) => (
                                <option key={sp.storeId} value={sp.storeId}>
                                    {sp.store.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="chart_container">
                    {filteredData.length > 0 ? (
                        <>
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
                                            domain={["auto", "auto"]} 
                                            tickFormatter={(v) => `$${v}`} 
                                            tick={{ fontSize: 12 }}
                                            stroke="#888"
                                        />
                                        <Tooltip 
                                            formatter={(value) => [`$${value.toFixed(2)}`, "Price"]} 
                                            labelFormatter={(label) => `Date: ${label}`}
                                            contentStyle={{
                                                background: '#fff',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px'
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

                            <div className="range_selector">
                                <button 
                                    onClick={() => setRange("7d")} 
                                    className={range === "7d" ? "active" : ""}
                                >
                                    7 days
                                </button>
                                <button 
                                    onClick={() => setRange("1m")} 
                                    className={range === "1m" ? "active" : ""}
                                >
                                    1 month
                                </button>
                                <button 
                                    onClick={() => setRange("3m")} 
                                    className={range === "3m" ? "active" : ""}
                                >
                                    3 months
                                </button>
                                <button 
                                    onClick={() => setRange("all")} 
                                    className={range === "all" ? "active" : ""}
                                >
                                    All time
                                </button>
                            </div>

                            <div className="price_table">
                                <div className="price_cell">
                                    <p>Lowest Price</p>
                                    <h2>${priceStats?.lowest.toFixed(2)}</h2>
                                    <span>In this period</span>
                                </div>
                                <div className="price_cell">
                                    <p>Current Price</p>
                                    <h2>
                                        ${currentPrice.toFixed(2)}
                                        {priceDirection && (
                                            <span style={{
                                                color: priceDirection === 'down' ? '#22c55e' : '#ef4444',
                                                fontSize: '0.9rem',
                                                marginLeft: '8px'
                                            }}>
                                                {priceDirection === 'down' ? '↓' : '↑'}
                                            </span>
                                        )}
                                    </h2>
                                    <span>{selectedSellerName}</span>
                                </div>
                                <div className="price_cell">
                                    <p>Average Price</p>
                                    <h2>${priceStats?.average.toFixed(2)}</h2>
                                    <span>In this period</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-data">
                            <p>No price history available for this period.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}