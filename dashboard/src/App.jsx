import React, { useState } from "react";
import Layout from "./components/Layout";
import EnrollmentSection from "./components/enrollment/EnrollmentSection";
import OperationalSection from "./components/operational/OperationalSection";
import FinanceSection from "./components/finance/FinanceSection";
import { useOrders } from "./hooks/useOrders";
import { normalizeOrders } from "./utils/transform";

function formatTimeAgo(date) {
  if (!date) return null;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="stats-row">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-label" />
            <div className="skeleton skeleton-value" />
          </div>
        ))}
      </div>
      <div className="chart-grid">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton-chart">
            <div className="skeleton skeleton-chart-title" />
            <div className="skeleton skeleton-chart-area" />
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="skeleton skeleton-chart-title" style={{ marginBottom: 16 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton skeleton-cell" />
            <div className="skeleton skeleton-cell" />
            <div className="skeleton skeleton-cell" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <div className="error-message">Failed to load data</div>
      <div className="error-hint">{error}</div>
      <button className="btn btn-primary" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

export default function App() {
  const { orders: rawOrders, loading, refreshing, error, refresh, lastSynced } = useOrders();
  const [activeTab, setActiveTab] = useState("enrollment");

  const orders = normalizeOrders(rawOrders);
  const timeAgo = formatTimeAgo(lastSynced);

  if (loading) {
    return (
      <Layout activeTab={activeTab} onTabChange={setActiveTab} onRefresh={refresh}>
        <LoadingSkeleton />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout activeTab={activeTab} onTabChange={setActiveTab} onRefresh={refresh}>
        <ErrorDisplay error={error} onRetry={refresh} />
      </Layout>
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={refresh}
      refreshing={refreshing}
      lastSynced={timeAgo}
    >
      <div key={activeTab} className="section-fade">
        {activeTab === "enrollment" && <EnrollmentSection orders={orders} />}
        {activeTab === "operational" && <OperationalSection orders={orders} />}
        {activeTab === "finance" && <FinanceSection orders={orders} />}
      </div>
    </Layout>
  );
}
