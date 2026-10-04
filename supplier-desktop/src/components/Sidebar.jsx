import React from 'react';

export default function Sidebar({ tabs, activeTab, onChange }) {
  return (
    <aside className="sidebar">
      <div className="brand-box">
        <small>ZADA</small>
        <h2>Supplier Desk</h2>
      </div>

      <nav className="side-nav" aria-label="Sidebar navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'nav-tab active' : 'nav-tab'}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
