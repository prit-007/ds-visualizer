import React from 'react';
import { BookOpen, Clock, Cpu, Lightbulb } from 'lucide-react';

// Learning-first card shown above every visualizer canvas: a plain-language
// "what", the run-time / space complexity in @-notation, and when to reach
// for this structure/algorithm. Collapsible via <details>.

const AlgoOverview = ({ title, what, time, space, when, note }) => (
  <details className="algo-overview" open>
    <summary className="algo-overview-summary">
      <BookOpen size={16} />
      <span>Learn · {title}</span>
    </summary>
    <p className="ao-what">{what}</p>
    <div className="ao-grid">
      <div className="ao-cell" title="Time complexity">
        <Clock size={14} />
        <span className="ao-label">Time</span>
        <span className="ao-value">{time}</span>
      </div>
      <div className="ao-cell" title="Space complexity">
        <Cpu size={14} />
        <span className="ao-label">Space</span>
        <span className="ao-value">{space}</span>
      </div>
      <div className="ao-cell" title="When to use it">
        <Lightbulb size={14} />
        <span className="ao-label">Use when</span>
        <span className="ao-value">{when}</span>
      </div>
    </div>
    {note && <p className="ao-note">{note}</p>}
  </details>
);

export default AlgoOverview;
