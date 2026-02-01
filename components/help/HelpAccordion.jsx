'use client';
import { useState, useMemo } from 'react';
import './help-accordion.css';

/**
 * Each topic object shape:
 * {
 *   id: string,           // unique key, also used as filter value
 *   label: string,        // display label (already localised by the server)
 *   icon: string,         // Material Symbol name
 *   items: [
 *     { id: string, question: string, answer: string }
 *   ]
 * }
 */
export default function HelpAccordion({ topics }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [openId, setOpenId] = useState(null);

  // "All" means every topic; otherwise show only the selected one
  const visibleTopics = useMemo(() => {
    if (activeFilter === 'all') return topics;
    return topics.filter(t => t.id === activeFilter);
  }, [topics, activeFilter]);

  const toggle = (id) => setOpenId(prev => (prev === id ? null : id));

  return (
    <div className="help-accordion-root">
      {/* ── Filter Tabs ── */}
      <div className="help-filter-bar" role="tablist">
        <button
          className={`help-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
          role="tab"
          aria-selected={activeFilter === 'all'}
        >
          <span className="material-symbols-sharp">grid_view</span>
          <h4>{topics.length > 0 ? topics[0].allLabel || 'All' : 'All'}</h4>
        </button>
        {topics.map(topic => (
          <button
            key={topic.id}
            className={`help-filter-btn ${activeFilter === topic.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(topic.id)}
            role="tab"
            aria-selected={activeFilter === topic.id}
          >
            <span className="material-symbols-sharp">{topic.icon}</span>
            <h4>{topic.label}</h4>
          </button>
        ))}
      </div>

      {/* ── Accordion Sections ── */}
      {visibleTopics.map(topic => (
        <div key={topic.id} className="help-topic-group">
          {/* Topic heading (only visible when "All" is selected and there are multiple topics) */}
          {activeFilter === 'all' && topics.length > 1 && (
            <div className="help-topic-heading">
              <span className="material-symbols-sharp">{topic.icon}</span>
              {topic.label}
            </div>
          )}

          {/* Accordion items */}
          {topic.items.map(item => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className={`help-accordion-item ${isOpen ? 'open' : ''}`}>
                <button
                  className="help-accordion-trigger"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  type="button"
                >
                  <span className="help-accordion-question">{item.question}</span>
                  <span className="material-symbols-sharp help-accordion-chevron">
                    {isOpen ? 'remove' : 'add'}
                  </span>
                </button>

                {/* Answer panel — always in DOM for accessibility, hidden via CSS height */}
                <div className="help-accordion-panel" role="region">
                  <div className="help-accordion-answer">{item.answer}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
