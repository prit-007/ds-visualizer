import React from "react";

const CasePresets = ({ presets = [], disabled = false }) => {
  return (
    <div className="preset-row">
      <span className="preset-label">Load case:</span>
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          className="preset-button"
          onClick={preset.onClick}
          disabled={disabled}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
};

export default CasePresets;
