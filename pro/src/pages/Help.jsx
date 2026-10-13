import React from 'react';
import { Link } from 'react-router-dom';
import './Help.css';

// Static help page: shortcuts, gestures, features index, FAQ.

const SHORTCUTS = [
  ['Space', 'Play / pause the current run'],
  ['← / →', 'Step backward / forward through a run'],
  ['Enter', 'Submit the active operation from any input'],
  ['Escape', 'Close the mobile navigation drawer (or the tour)'],
  ['Tab', 'Move between controls — focus rings are visible'],
  ['Ctrl / ⌘ + F', 'Browser page search (also finds step text)'],
];

const FEATURES = [
  ['Visualizers', '/lessons', 'One page per structure and algorithm, from arrays to Dijkstra.'],
  ['Lessons', '/lessons', 'Guided MDX walkthroughs for the core structures.'],
  ['Curriculum', '/curriculum', 'A concept map with mastery tracking as you complete lessons and runs.'],
  ['Complexity Lab', '/complexity', 'Measure real growth and compare it against the theory.'],
  ['Challenges', '/challenges', 'Adversarial scenarios that score your understanding.'],
  ['Prediction mode', '/lessons', 'Enable 🎯 in any run — guess the next step before it plays.'],
];

const FAQ = [
  ['Where is my progress stored?', 'Entirely in your browser (localStorage). Nothing is sent anywhere — the app is fully offline.'],
  ['Do the visualizations need the internet?', 'No. All assets, fonts and algorithms are local.'],
  ['Why does binary search refuse my array?', 'Binary search only works on sorted data — the page guides you to sort first.'],
  ['The tree gets tiny when I add many nodes.', 'The canvas fits the whole tree to the viewport. Very wide trees scroll horizontally after a floor so nodes stay readable.'],
  ['How do I reset a page?', 'Use the Reset / Clear toolbar on every data-structure page.'],
];

const Help = () => (
  <div className="help-page">
    <h1>Help & Shortcuts</h1>
    <p className="page-tagline">Everything you need to get the most out of AlgoViz.</p>

    <section className="help-card">
      <h2>Keyboard shortcuts</h2>
      <table className="help-table">
        <tbody>
          {SHORTCUTS.map(([key, action]) => (
            <tr key={key}>
              <td>
                <code className="help-key">{key}</code>
              </td>
              <td>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>

    <section className="help-card">
      <h2>Touch & gestures</h2>
      <ul className="help-list">
        <li>The navigation drawer opens from the top-left button on phones and closes on tap-outside or <kbd>Escape</kbd>.</li>
        <li>Canvas scrolls sideways if a tree or graph grows very wide.</li>
        <li>All buttons have 44px touch targets and inputs use 16px text (no iOS zoom-on-focus).</li>
      </ul>
    </section>

    <section className="help-card">
      <h2>Features index</h2>
      <ul className="help-list">
        {FEATURES.map(([name, href, desc]) => (
          <li key={name}>
            <Link to={href}>{name}</Link> — {desc}
          </li>
        ))}
      </ul>
    </section>

    <section className="help-card">
      <h2>Frequently asked questions</h2>
      {FAQ.map(([q, a]) => (
        <details key={q} className="help-faq">
          <summary>{q}</summary>
          <p className="help-faq-answer">{a}</p>
        </details>
      ))}
    </section>

    <section className="help-card">
      <h2>Give feedback</h2>
      <p className="help-faq-answer">
        This is an open-source project. Report issues or request features via the
        GitHub repository linked in the sidebar — see{' '}
        <Link to="/challenges">Challenges</Link> and{' '}
        <Link to="/lessons">Lessons</Link> while you are here.
      </p>
    </section>
  </div>
);

export default Help;
