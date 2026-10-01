import React from "react";

const ComplexityInfo = ({
  operationName,
  complexity,
  explanation
}) => {
  return (
    <div className="info-panel">
      <h3>Time Complexity</h3>
      <div className="complexity-item">
        <span className="operation-name">{operationName}:</span>
        <span className="complexity-value">{complexity}</span>
      </div>
      <p className="complexity-explanation">{explanation}</p>
    </div>
  );
};

export default ComplexityInfo;