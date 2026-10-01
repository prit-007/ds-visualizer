import React from "react";
import { motion } from "framer-motion";

const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="error-message"
      role="alert"
    >
      {message}
    </motion.div>
  );
};

export default ErrorMessage;
