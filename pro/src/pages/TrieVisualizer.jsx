import React, { useState, useRef, useEffect, useMemo } from "react";
import TabNavigation from "../components/TabNavigation";
import AlgoOverview from "../components/AlgoOverview";
import { Trie } from "../lib/trie";
import {
  buildInsertSteps,
  buildSearchSteps,
  buildDeleteSteps,
  buildListSteps,
} from "../lib/trieSteps";
import { buildTrieLayout } from "../lib/trieLayout";
import { TRIE_PSEUDOCODE } from "../lib/pseudocode";
import { recordOperation, recordPrediction } from "../lib/progress";
import OperationPlayer from "../components/OperationPlayer";
import ErrorMessage from "../components/ErrorMessage";
import ComplexityInfo from "../components/ComplexityInfo";
import PropertyDisplay from "../components/PropertyDisplay";
import MemoryRepresentation from "../components/MemoryRepresentation";
import ViewToggle from "../components/ViewToggle";
import ShareButton from "../components/ShareButton";
import RunHistoryPanel from "../components/RunHistoryPanel";
import { readScenario } from "../lib/share";
import { recordRun, listRuns } from "../lib/timeTravel";
import "./TrieVisualizer.css";

const TABS = [
  { id: "insert", label: "Insert" },
  { id: "search", label: "Search" },
  { id: "delete", label: "Delete" },
  { id: "list", label: "List" },
];

const BUTTON_LABEL = {
  insert: "Insert Word",
  search: "Search Word",
  delete: "Delete Word",
  list: "List Words",
};

const COMPLEXITY = {
  insert: {
    operationName: "Insert",
    complexity: "O(L)",
    explanation: "Each of the word's L letters walks or creates one child pointer — linear in the word length.",
  },
  search: {
    operationName: "Search",
    complexity: "O(L)",
    explanation: "Follow one child pointer per letter of the word; the final node must be marked as a word end.",
  },
  delete: {
    operationName: "Delete",
    complexity: "O(L)",
    explanation: "Descend L levels to the word, unmark it, then prune nodes up to the last branching point.",
  },
  list: {
    operationName: "List / Suggest",
    complexity: "O(W · L)",
    explanation: "A depth-first walk visits every word-end in the trie, reaching all W words through their shared prefixes.",
  },
};

const DEMO_WORDS = ["cat", "car", "dog", "door", "dorm", "dot", "rat", "run"];

const buildTrie = (words) => {
  const t = new Trie();
  words.forEach((w) => t.insert(w));
  return t;
};

const TrieVisualizer = () => {
  const [trie] = useState(() => {
    const scenario = readScenario();
    if (scenario && scenario.structure === "trie" && Array.isArray(scenario.values)) {
      return buildTrie(scenario.values);
    }
    return buildTrie(DEMO_WORDS);
  });
  const [words, setWords] = useState(() => {
    const scenario = readScenario();
    return scenario && scenario.structure === "trie" && Array.isArray(scenario.values)
      ? scenario.values
      : [...DEMO_WORDS];
  });
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState("insert");
  const [wordInput, setWordInput] = useState("");
  const [prefixInput, setPrefixInput] = useState("");
  const [activeNode, setActiveNode] = useState(null);
  const [highlightedChars, setHighlightedChars] = useState([]);
  const [nodeStates, setNodeStates] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("story");

  const containerRef = useRef(null);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const layout = buildTrieLayout(trie.root);
  const suggestions = useMemo(() => {
    if (!prefixInput.trim()) return [];
    return trie.wordsWithPrefix(prefixInput.trim(), 8);
  }, [prefixInput, trie]);

  const startRun = (steps, onComplete, runMeta) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
    if (runMeta) recordRun({ structure: "trie", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setActiveNode(null);
    setHighlightedChars([]);
    setNodeStates({});
  };

  const ui = { setActiveNode, setHighlightedChars, setNodeStates };

  const parseWord = () => {
    const w = wordInput.trim().toLowerCase();
    if (!w) {
      setError("Please enter a word");
      return null;
    }
    if (!/^[a-z]+$/.test(w)) {
      setError("Use lowercase letters only");
      return null;
    }
    return w;
  };

  const handleInsert = () => {
    const w = parseWord();
    if (w === null) return;
    const steps = buildInsertSteps(trie, w, ui);
    startRun(
      steps,
      () => {
        setTick((t) => t + 1);
        setWords((prev) => (prev.includes(w) ? prev : [...prev, w]));
        setWordInput("");
        clearHighlights();
      },
      { before: [...words], after: words.includes(w) ? [...words] : [...words, w], label: `Insert "${w}"` }
    );
  };

  const handleSearch = () => {
    const w = parseWord();
    if (w === null) return;
    const steps = buildSearchSteps(trie, w, ui);
    startRun(
      steps,
      () => {
        setTick((t) => t + 1);
        clearHighlights();
      },
      { before: [...words], after: [...words], label: `Search "${w}"` }
    );
  };

  const handleDelete = () => {
    const w = parseWord();
    if (w === null) return;
    const steps = buildDeleteSteps(trie, w, ui);
    startRun(
      steps,
      () => {
        setTick((t) => t + 1);
        setWords((prev) => prev.filter((x) => x !== w));
        setWordInput("");
        clearHighlights();
      },
      { before: [...words], after: words.filter((x) => x !== w), label: `Delete "${w}"` }
    );
  };

  const handleList = () => {
    const steps = buildListSteps(trie, ui);
    startRun(
      steps,
      () => {
        clearHighlights();
      },
      { before: [...words], after: [...words], label: "List words" }
    );
  };

  const handleRun = () => {
    if (activeTab === "insert") handleInsert();
    else if (activeTab === "search") handleSearch();
    else if (activeTab === "delete") handleDelete();
    else handleList();
  };

  const applyPreset = (ws) => {
    trie.root.children = {};
    ws.forEach((w) => trie.insert(w));
    setWords([...ws]);
    setTick((t) => t + 1);
    clearHighlights();
    setError(null);
    setRun(null);
    setWordInput("");
    setPrefixInput("");
  };

  const handleReset = () => applyPreset(DEMO_WORDS);
  const handleClear = () => applyPreset([]);

  const handleForkRun = (runEntry) => {
    if (runEntry.structure === "trie" && Array.isArray(runEntry.before)) {
      applyPreset(runEntry.before);
    }
  };

  const handleTabChange = (next) => {
    if (next === activeTab || isAnimating) return;
    setActiveTab(next);
    setRun(null);
    setError(null);
    clearHighlights();
  };

  const wordCount = trie.countWords();
  const memoryBlocks = words.map((w, i) => ({
    address: `0x${(i * 4 + 0x3c00).toString(16).toUpperCase()}`,
    value: w,
    isEnd: trie.contains(w),
  }));

  const complexityInfo = COMPLEXITY[activeTab] ?? COMPLEXITY.insert;

  return (
    <div className="trie-page" ref={containerRef}>
      <h1>Trie Visualizer</h1>
      <p className="page-tagline">
        Prefix trees that make dictionary lookups as fast as the word is long.
      </p>

      <AlgoOverview
        title="Trie (Prefix Tree)"
        what="Every letter is a node; each word is a root-to-node path that ends in a word marker. Shared prefixes share nodes, so lookups and suggestions follow O(L) walks."
        time="O(L) per operation"
        space="O(W · L) worth of nodes"
        when="autocomplete, spell-checking, phonebook and router tables — anything that answers 'does X exist?' or 'what starts with X?' fast."
        note="Green ✓ badges mark complete words; pruning dashed nodes disappear on delete."
      />

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>Trie</h2>

          <ViewToggle view={view} onChange={setView} disabled={isAnimating} />

          <ShareButton structure="trie" values={words} />

          <div className="data-actions">
            <button type="button" className="data-action-btn" onClick={handleReset} disabled={isAnimating}>
              Reset
            </button>
            <button type="button" className="data-action-btn danger" onClick={handleClear} disabled={isAnimating}>
              Clear
            </button>
          </div>

          {view === "memory" ? (
            words.length === 0 ? (
              <p className="empty-state">No words yet — insert a word to get started.</p>
            ) : (
              <MemoryRepresentation blocks={memoryBlocks} />
            )
          ) : (
            <div
              key={tick}
              className="trie-canvas"
              style={{ width: layout.width, height: layout.height }}
            >
              <svg width={layout.width} height={layout.height} aria-hidden="true">
                {layout.edges.map((e, i) => (
                  <line
                    key={`${e.parentValue}-${e.childValue}-${i}`}
                    className={`trie-edge${highlightedChars.length > 0 && layout.nodes.some((n) => n.char === e.childValue) ? " active" : ""}`}
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                  />
                ))}
              </svg>
              {layout.nodes.map((n) => (
                <div
                  key={`${n.char}-${n.x}-${n.y}`}
                  className="trie-node-slot"
                  style={{ left: `${n.x}px`, top: `${n.y}px` }}
                >
                  <div
                    className={`trie-node${n.isRoot ? " root" : ""}${activeNode === n.char ? " active" : ""}${nodeStates.pruned === n.char ? " pruned" : ""}${n.isEnd ? " end" : ""}`}
                  >
                    {n.isRoot ? "·" : n.char}
                  </div>
                </div>
              ))}
            </div>
          )}

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`trie:${activeTab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={TRIE_PSEUDOCODE[activeTab]}
            />
          )}

          <div className="suggestions-box">
            <label htmlFor="trie-suggest">Suggestions — type a prefix:</label>
            <input
              id="trie-suggest"
              type="text"
              value={prefixInput}
              onChange={(e) => setPrefixInput(e.target.value)}
              placeholder="e.g. do"
              disabled={isAnimating}
            />
            {suggestions.length > 0 && (
              <ul className="suggestion-list">
                {suggestions.map((w) => (
                  <li key={w} className="suggestion-chip">
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="controls-area">
          <h2>Operations</h2>

          <ErrorMessage message={error} />

          <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} disabled={isAnimating} />

          <form
            className="operation-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              handleRun();
            }}
          >
            {activeTab !== "list" && (
              <div className="input-group">
                <label>{activeTab === "insert" ? "Word to insert:" : activeTab === "search" ? "Word to find:" : "Word to delete:"}</label>
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Enter a word"
                  disabled={isAnimating}
                />
              </div>
            )}
            <button type="submit" className="operation-button" disabled={isAnimating}>
              {BUTTON_LABEL[activeTab]}
            </button>
          </form>

          <ComplexityInfo operationName={complexityInfo.operationName} complexity={complexityInfo.complexity} explanation={complexityInfo.explanation} />

          <PropertyDisplay
            title="Trie Properties"
            properties={[
              { name: "Words", value: wordCount },
              { name: "Nodes", value: layout.nodes.filter((n) => !n.isRoot).length },
            ]}
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel runs={listRuns("trie")} onFork={handleForkRun} disabled={isAnimating} />
        </div>
      </div>
    </div>
  );
};

export default TrieVisualizer;
