import React from "react";

const ViewToggle = ({ view, onChange, disabled = false }) => {
  return (
    <div className="view-toggle" role="group" aria-label="Visualization view">
      <button
        type="button"
        className={`view-toggle-btn${view === "story" ? " active" : ""}`}
        aria-pressed={view === "story"}
        onClick={() => onChange("story")}
        disabled={disabled}
      >
        Story
      </button>
      <button
        type="button"
        className={`view-toggle-btn${view === "memory" ? " active" : ""}`}
        aria-pressed={view === "memory"}
        onClick={() => onChange("memory")}
        disabled={disabled}
      >
        Memory
      </button>
    </div>
  );
};

export default ViewToggle;
