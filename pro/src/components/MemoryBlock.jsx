import React from "react";

const MemoryBlock = ({
  address,
  value,
  isActive = false,
  isShifting = false,
  pointers = []
}) => {
  return (
    <div 
      className={`memory-block ${isActive ? 'active' : ''} ${isShifting ? 'shifting' : ''}`}
    >
      <div className="memory-address">{address}</div>
      <div className="memory-value">{value}</div>
      {pointers.map((pointer) => (
        <div key={pointer.label} className="memory-pointer">
          {pointer.label} → {pointer.target ?? "null"}
        </div>
      ))}
    </div>
  );
};

export default MemoryBlock;
