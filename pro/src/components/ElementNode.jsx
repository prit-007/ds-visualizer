import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { prefersReducedMotion } from "../lib/motionPrefs";

const ElementNode = ({ 
  value, 
  index, 
  isActive = false, 
  isHighlighted = false, 
  isRemoving = false,
  isSorted = false,
  className = "",
  showIndex = true
}) => {
  const elementRef = useRef(null);
  
  useEffect(() => {
    const tween = isActive
      ? {
          scale: 1.1,
          boxShadow: "0 0 20px rgba(79, 70, 229, 0.6)",
          duration: 0.3
        }
      : {
          scale: 1,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          duration: 0.3
        };
    if (prefersReducedMotion()) {
      const { duration, ...target } = tween;
      gsap.set(elementRef.current, target);
    } else {
      gsap.to(elementRef.current, tween);
    }
  }, [isActive]);

  return (
    <motion.div
      ref={elementRef}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isRemoving ? 0 : 1, 
        opacity: isRemoving ? 0 : 1,
        backgroundColor: isHighlighted
          ? "var(--primary-color)"
          : isSorted
            ? "var(--sorted-color, #dcfce7)"
            : "var(--surface-color)",
        color: isHighlighted ? "white" : "var(--text-primary)"
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 12 }}
      className={`element-node ${isActive ? 'active' : ''} ${isHighlighted ? 'highlighted' : ''} ${isSorted ? 'sorted' : ''} ${className}`}
    >
      <span className="element-value">{value}</span>
      {showIndex && <span className="element-index">{index}</span>}
    </motion.div>
  );
};

export default ElementNode;