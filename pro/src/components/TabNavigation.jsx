import React from "react";

const TabNavigation = ({
  tabs = [],
  activeTab,
  onTabChange,
  disabled = false
}) => {
  return (
    <div className="tab-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onTabChange(tab.id)}
          disabled={disabled}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;