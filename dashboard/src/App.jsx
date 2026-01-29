import React, { useState } from "react";
import Layout from "./components/Layout";
import EnrollmentSection from "./components/enrollment/EnrollmentSection";
import OperationalSection from "./components/operational/OperationalSection";
import FinanceSection from "./components/finance/FinanceSection";
import { useOrders } from "./hooks/useOrders";
import { normalizeOrders } from "./utils/transform";

export default function App() {
  const { orders: rawOrders, loading, error, refresh } = useOrders();
  const [activeTab, setActiveTab] = useState("enrollment");

  const orders = normalizeOrders(rawOrders);

  if (loading) {
    return (
      <Layout activeTab={activeTab} onTabChange={setActiveTab} onRefresh={refresh}>
        <div className="loading">Loading orders...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout activeTab={activeTab} onTabChange={setActiveTab} onRefresh={refresh}>
        <div className="error">Error: {error}</div>
      </Layout>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onRefresh={refresh}>
      {activeTab === "enrollment" && <EnrollmentSection orders={orders} />}
      {activeTab === "operational" && <OperationalSection orders={orders} />}
      {activeTab === "finance" && <FinanceSection orders={orders} />}
    </Layout>
  );
}
