import React from "react";
import StatCard from "../StatCard";
import RevenueOverview from "./RevenueOverview";
import RevenueTrends from "./RevenueTrends";
import OrderDetails from "./OrderDetails";
import GeographicSpend from "./GeographicSpend";
import { formatDollars } from "../../utils/transform";

export default function FinanceSection({ orders }) {
  const totalRevenue = orders.reduce((sum, o) => sum + (o["Total"] || 0), 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  return (
    <div>
      <div className="stats-row">
        <StatCard title="Total Revenue" value={formatDollars(totalRevenue)} />
        <StatCard title="Average Order Value" value={formatDollars(avgOrderValue)} />
        <StatCard title="Total Orders" value={orders.length} />
      </div>
      <RevenueOverview orders={orders} />
      <RevenueTrends orders={orders} />
      <GeographicSpend orders={orders} />
      <OrderDetails orders={orders} />
    </div>
  );
}
