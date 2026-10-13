import React, { useEffect, useRef } from 'react';

// Dual-pane pseudocode viewer. Renders plain <code> (the listings use ←/→
// arrows, not JS — Prism's JS highlighter was misleading), with a derived
// procedure title, kind-tinted active line, line-number gutter, scrolling
// the active line into view, and a variable watch.
// `line` is the active 1-based line; `kind` tints the accent
// (compare/move/found/error); `vars` feeds the watch.

const deriveName = (lines) => {
  const first = lines?.[0] ?? '';
  const match = /procedure\s+([A-Za-z0-9_]+)/.exec(first);
  return match ? match[1] : null;
};

const formatValue = (v) => {
  if (v !== null && typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'string') return v;
  return String(v);
};

const CodePane = ({ lines = [], line, vars, kind }) => {
  const listRef = useRef(null);
  const name = deriveName(lines);

  // Keep the executing line visible while runs advance past the fold.
  useEffect(() => {
    const active = listRef.current?.querySelector('.code-line.active');
    if (active && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [line, lines]);

  const entries = vars ? Object.entries(vars) : [];

  return (
    <div className="code-pane">
      <div className="code-pane-title">{name ? `Pseudocode · ${name}` : 'Pseudocode'}</div>
      <div className="code-lines" ref={listRef} aria-label="Pseudocode">
        {lines.map((text, index) => {
          const lineNumber = index + 1;
          const isActive = line === lineNumber;
          return (
            <div
              key={lineNumber}
              className={`code-line ${isActive ? 'active' : ''} ${
                isActive && kind ? `code-line-${kind}` : ''
              }`.trim()}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="code-gutter">{lineNumber}</span>
              <code className="code-text">{text}</code>
            </div>
          );
        })}
      </div>
      {entries.length > 0 && (
        <div className="var-watch">
          <div className="var-watch-title">Variables</div>
          {entries.map(([vName, value]) => (
            <div key={vName} className="var-row">
              <span className="var-name">{vName}</span>
              <span className="var-value">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodePane;