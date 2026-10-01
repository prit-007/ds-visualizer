import React from "react";
import MemoryBlock from "./MemoryBlock";

const MemoryRepresentation = ({ blocks = [] }) => {
  return (
    <div className="memory-representation">
      <h3>Memory Representation</h3>
      <div className="memory-blocks">
        {blocks.map((block, index) => (
          <MemoryBlock
            key={block.address ?? index}
            address={block.address}
            value={block.value}
            isActive={block.isActive}
            isShifting={block.isShifting}
            pointers={block.pointers}
          />
        ))}
      </div>
    </div>
  );
};

export default MemoryRepresentation;
