import React from "react";

const PropertyDisplay = ({ 
  title = "Properties", 
  properties = [], 
  className = "" 
}) => {
  return (
    <div className={`info-panel ${className}`}>
      <h3>{title}</h3>
      <div className="property-list">
        {properties.map((prop, index) => (
          <div key={index} className="property-item">
            <span className="property-name">{prop.name}:</span>
            <span className="property-value">{prop.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyDisplay;