import React from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";

SyntaxHighlighter.registerLanguage("javascript", javascript);

const lineStyle = {
  margin: 0,
  padding: "0 0.25rem",
  background: "transparent",
  fontSize: "0.72rem",
  fontFamily: "source-code-pro, Menlo, Monaco, Consolas, monospace",
};

const CodePane = ({ lines = [], line, vars }) => {
  const varEntries = vars ? Object.entries(vars) : [];

  return (
    <div className="code-pane">
      <div className="code-pane-title">Pseudocode</div>
      <div className="code-lines" aria-label="Pseudocode">
        {lines.map((text, index) => {
          const lineNumber = index + 1;
          const isActive = line === lineNumber;
          return (
            <div
              key={lineNumber}
              className={`code-line ${isActive ? "active" : ""}`}
              aria-current={isActive ? "true" : undefined}
            >
              <span className="code-gutter">{lineNumber}</span>
              <SyntaxHighlighter
                language="javascript"
                style={oneDark}
                customStyle={lineStyle}
              >
                {text}
              </SyntaxHighlighter>
            </div>
          );
        })}
      </div>
      {varEntries.length > 0 && (
        <div className="var-watch">
          <div className="var-watch-title">Variables</div>
          {varEntries.map(([name, value]) => (
            <div key={name} className="var-row">
              <span className="var-name">{name}</span>
              <span className="var-value">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodePane;
