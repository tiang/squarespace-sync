import React from "react";
import { DASHBOARD_TABS } from "../constants";

const TAB_ICONS = {
  enrollment: "\uD83C\uDF93",
  operational: "\uD83D\uDCCB",
  finance: "\uD83D\uDCB0",
};

export default function Layout({ activeTab, onTabChange, onRefresh, refreshing, lastSynced, children }) {
  return (
    <div className="layout">
      <header className="header">
        <div>
          <h1>{"\uD83D\uDE80"} Rocket Academy Dashboard</h1>
          {lastSynced && (
            <div className="header-subtitle">Last synced: {lastSynced}</div>
          )}
        </div>
        <div className="header-actions">
          <button
            className={`btn btn-primary ${refreshing ? "btn-loading" : ""}`}
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Syncing..." : "Refresh"}
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
            {TAB_ICONS[tab.key]} {tab.label}
          </button>
        ))}
      </nav>
      <main className="content">{children}</main>
    </div>
  );
}
