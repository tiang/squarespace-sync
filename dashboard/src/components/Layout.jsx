import React from "react";
import { DASHBOARD_TABS } from "../constants";

export default function Layout({ activeTab, onTabChange, onRefresh, children }) {
  return (
    <div className="layout">
      <header className="header">
        <h1>Rocket Academy Dashboard</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={onRefresh}>
            Refresh
          </button>
        </div>
      </header>
      <nav className="tabs">
        {DASHBOARD_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="content">{children}</main>
    </div>
  );
}
