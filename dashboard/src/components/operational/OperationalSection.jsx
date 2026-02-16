import React, { useState } from "react";
import ClassSummary from "./ClassSummary";
import ClassRoster from "./ClassRoster";
import SkuAudit from "./SkuAudit";
import {
  getTermOptions,
  filterByTerm,
  getCurrentTermLabel,
  groupByClass,
  groupClassesByLocation,
  filterByProgramType,
} from "../../utils/transform";
import { PROGRAM_TABS } from "../../constants";

export default function OperationalSection({ orders }) {
  const [programTab, setProgramTab] = useState("term");

  const programOrders = filterByProgramType(orders, programTab);

  const termOptions = getTermOptions(programOrders);
  const defaultTerm = termOptions.includes(getCurrentTermLabel())
    ? getCurrentTermLabel()
    : termOptions[0] || "";
  const [selectedTerm, setSelectedTerm] = useState(defaultTerm);

  const filteredOrders = filterByTerm(programOrders, selectedTerm);
  const classes = groupByClass(filteredOrders);
  const locationGroups = groupClassesByLocation(classes);

  // Reset term selection when switching program tabs
  function handleProgramTabChange(key) {
    setProgramTab(key);
    const newOrders = filterByProgramType(orders, key);
    const newTermOptions = getTermOptions(newOrders);
    const newDefault = newTermOptions.includes(getCurrentTermLabel())
      ? getCurrentTermLabel()
      : newTermOptions[0] || "";
    setSelectedTerm(newDefault);
  }

  return (
    <div>
      <div className="sub-tabs">
        {PROGRAM_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`sub-tab ${programTab === tab.key ? "active" : ""}`}
            onClick={() => handleProgramTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="term-selector">
        <label>Term:</label>
        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
        >
          {termOptions.map((term) => (
            <option key={term} value={term}>
              {term}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: "#888", marginLeft: 8 }}>
          {programOrders.length} total records | {filteredOrders.length} in selected term
        </span>
      </div>
      {locationGroups.map((group) => (
        <div key={group.location} className="location-group">
          <div className="location-header">
            <h2>{group.location}</h2>
            <span className="location-count">{group.totalStudents} students</span>
          </div>
          <ClassSummary classes={group.classes} />
          <ClassRoster classes={group.classes} />
        </div>
      ))}
      {locationGroups.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">{"\uD83D\uDCDA"}</div>
          <p>No classes found for this term.</p>
        </div>
      )}
      <SkuAudit orders={programOrders} />
    </div>
  );
}
