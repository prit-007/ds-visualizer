import React, { useState, useRef, useEffect } from "react";
import TabNavigation from "../components/TabNavigation";
import AlgoOverview from "../components/AlgoOverview";
import ShareButton from "../components/ShareButton";
import {
  buildActivitySteps,
  buildFractionalKnapsackSteps,
  buildGreedyCoinSteps,
} from "../lib/greedySteps";
import { GREEDY_PSEUDOCODE } from "../lib/pseudocode";
import { recordOperation, recordPrediction } from "../lib/progress";
import OperationPlayer from "../components/OperationPlayer";
import ErrorMessage from "../components/ErrorMessage";
import ComplexityInfo from "../components/ComplexityInfo";
import PropertyDisplay from "../components/PropertyDisplay";
import RunHistoryPanel from "../components/RunHistoryPanel";
import CasePresets from "../components/CasePresets";
import { recordRun, listRuns } from "../lib/timeTravel";
import "./Greedy.css";

const TABS = [
  { id: "activity", label: "Activity Selection" },
  { id: "knapsack", label: "Fractional Knapsack" },
  { id: "coin", label: "Greedy Coin Change" },
];

const COMPLEXITY = {
  activity: { operationName: "Activity Selection", complexity: "O(n log n)", explanation: "Sorting the n intervals by end time dominates; the scan is linear after that. Greedy (earliest finish) is provably optimal." },
  knapsack: { operationName: "Fractional Knapsack", complexity: "O(n log n)", explanation: "Sort by value/weight ratio and take items greedily; with unbounded pieces the greedy is optimal." },
  coin: { operationName: "Greedy Coin Change", complexity: "O(coins)", explanation: "A single scan from largest to smallest denomination. Exact only for canonical systems like US coins — DP is safer in general." },
};

const OVERVIEW = {
  activity: { title: "Activity Selection", what: "Maximize the number of non-overlapping intervals by always picking the one that ends earliest — it frees the most time for everything else.", time: "O(n log n)", space: "O(n)", when: "scheduling meetings, rooms, or any 'most in a timespan' problem.", note: "Earliest-finish is the textbook proof that a greedy choice can be optimal." },
  knapsack: { title: "Fractional Knapsack", what: "Fill a weight capacity with the most value, allowed to take fractions of items. Greedy takes the highest value-per-weight items first.", time: "O(n log n)", space: "O(n)", when: "divisible goods — flour, water, exposure — where you profit proportionally.", note: "Fractional is greedy-optimal; the 0/1 knapsack (indivisible items) is not and needs DP." },
  coin: { title: "Greedy Coin Change", what: "Reach an amount using the fewest coins by taking the largest coin that fits, again and again.", time: "O(coins)", space: "O(1)", when: "canonical denomination systems (like common currency) where greedy is exact.", note: "Greedy can overshoot — amount 6 with coins 4 and 3 needs DP to find the optimum." },
};

const ACTIVITY_PRESETS = {
  Meetings: [[1, 3], [2, 5], [3, 6], [5, 8], [6, 9]],
  "Early & late": [[0, 2], [1, 3], [2, 4], [4, 6], [5, 7]],
  Packed: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
};

const KNAPSACK_PRESETS = {
  "Ratio play": [
    [5, 30],
    [10, 20],
    [3, 18],
  ],
  "All equal": [
    [2, 10],
    [3, 15],
    [5, 25],
  ],
};

const COIN_PRESETS = { "US cents": [25, 10, 5, 1], "Workable": [8, 3, 1] };

const Greedy = () => {
  const [tab, setTab] = useState("activity");
  const [intervals, setIntervals] = useState(ACTIVITY_PRESETS.Meetings);
  const [knapsackItems, setKnapsackItems] = useState(KNAPSACK_PRESETS["Ratio play"]);
  const [capacityInput, setCapacityInput] = useState("10");
  const [coinDenoms, setCoinDenoms] = useState(COIN_PRESETS["US cents"]);
  const [targetInput, setTargetInput] = useState("48");

  const [activeInterval, setActiveInterval] = useState(null);
  const [picked, setPicked] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [highlightedKeys, setHighlightedKeys] = useState([]);
  const [taken, setTaken] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [coinCounts, setCoinCounts] = useState([]);

  const [isAnimating, setIsAnimating] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const startRun = (steps, onComplete, runMeta) => {
    setIsAnimating(true);
    setRun({ steps, onComplete });
    if (runMeta) recordRun({ structure: "greedy", steps, ...runMeta });
  };

  const clearHighlights = () => {
    setActiveInterval(null);
    setPicked([]);
    setActiveKey(null);
    setHighlightedKeys([]);
    setTaken([]);
    setTotalValue(0);
    setCoinCounts([]);
  };

  const ui = {
    setActiveInterval,
    setPicked,
    setActiveKey,
    setHighlightedKeys,
    setTaken,
    setTotalValue,
    setCoinCounts,
  };

  const handleRun = () => {
    let steps;
    let label;
    if (tab === "activity") {
      steps = buildActivitySteps(intervals, ui);
      label = "Activity selection";
    } else if (tab === "knapsack") {
      const capacity = parseInt(capacityInput);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
        setError("Please enter a capacity (1-50)");
        return;
      }
      steps = buildFractionalKnapsackSteps(knapsackItems, capacity, ui);
      label = `Knapsack capacity ${capacity}`;
    } else {
      const target = parseInt(targetInput);
      if (!Number.isInteger(target) || target < 1 || target > 200) {
        setError("Please enter a target amount (1-200)");
        return;
      }
      steps = buildGreedyCoinSteps(target, coinDenoms, ui);
      label = `Greedy coins ${target}`;
    }
    startRun(steps, () => clearHighlights(), {
      before: { tab, intervals, items: knapsackItems, denoms: coinDenoms },
      after: { tab, intervals, items: knapsackItems, denoms: coinDenoms },
      label,
    });
  };

  const handleClear = () => {
    clearHighlights();
    setError(null);
    setRun(null);
  };

  const handleTabChange = (next) => {
    if (next === tab || isAnimating) return;
    setTab(next);
    clearHighlights();
    setError(null);
    setRun(null);
  };

  const handleForkRun = (runEntry) => {
    if (runEntry.structure !== "greedy" || !runEntry.before) return;
    handleTabChange(runEntry.before.tab ?? "activity");
    if (runEntry.before.intervals) setIntervals(runEntry.before.intervals);
    if (runEntry.before.items) setKnapsackItems(runEntry.before.items);
    if (runEntry.before.denoms) setCoinDenoms(runEntry.before.denoms);
  };

  const setActivityData = (name) => {
    setIntervals(ACTIVITY_PRESETS[name]);
    clearHighlights();
    setError(null);
    setRun(null);
  };
  const setKnapsackData = (name) => setKnapsackItems(KNAPSACK_PRESETS[name]);
  const setCoinData = (name) => setCoinDenoms(COIN_PRESETS[name]);

  const learn = OVERVIEW[tab] ?? OVERVIEW.activity;
  const complexityInfo = COMPLEXITY[tab] ?? COMPLEXITY.activity;
  const maxEnd = Math.max(...intervals.map(([, e]) => e), 1);
  const pickedCount = picked.length;
  const selected = picked.map((i) => i);
  const capacity = parseInt(capacityInput) || 10;
  const filled = taken.reduce((s, a) => s + (a || 0), 0);
  const totalCoins = coinCounts.reduce((s, n) => s + (n || 0), 0);

  return (
    <div className="greedy-page" ref={containerRef}>
      <h1>Greedy Algorithms Visualizer</h1>
      <p className="page-tagline">Make the locally best choice at every step — and see when it is globally optimal.</p>

      <div className="visualizer-grid">
        <div className="visualization-area">
          <h2>{learn.title}</h2>

          <AlgoOverview title={learn.title} what={learn.what} time={learn.time} space={learn.space} when={learn.when} note={learn.note} />

          <ShareButton structure="greedy" values={[]} extra={{ tab }} />

          <div className="data-actions">
            <button type="button" className="data-action-btn" onClick={handleClear} disabled={isAnimating}>Clear</button>
          </div>

          <div className="greedy-canvas">
            {tab === "activity" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", position: "relative" }}>
                {intervals.map(([s, e], i) => (
                  <div key={i} style={{ position: "relative", height: 30 }}>
                    <div
                      className={`activity-bar${activeInterval === i ? " active" : ""}${selected.includes(i) ? " picked" : ""}`}
                      style={{ left: `${(s / maxEnd) * 100}%`, width: `${((e - s) / maxEnd) * 100}%`, position: "absolute" }}
                    >
                      [{s},{e}]
                    </div>
                  </div>
                ))}
                <p className="greedy-label">
                  Selected {pickedCount} interval(s) —{" "}
                  {selected.map((i) => `[${intervals[i][0]},${intervals[i][1]}]`).join(" ") ||
                    "none yet"}
                </p>
              </div>
            )}

            {tab === "knapsack" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {knapsackItems.map(([w, v], i) => {
                  const amount = taken[i] ?? 0;
                  const pct = (amount / Math.max(w, 1)) * 100;
                  return (
                    <div
                      key={i}
                      className={`knapsack-row${activeKey === i ? " active" : ""}`}
                    >
                      <span style={{ width: 150 }}>item {i} (w={w}, v={v})</span>
                      <div style={{ flex: 1, maxWidth: 260 }}>
                        <div className="knapsack-bar" style={{ width: `${Math.max(pct, 4)}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="coin-total">
                  Taken {filled}/{capacity} · value {totalValue}
                </p>
              </div>
            )}

            {tab === "coin" && (
              <div className="dp-chips">
                {coinDenoms.map((c) => (
                  <span key={c} className={`dp-chip${highlightedKeys.includes(c) ? " highlighted" : ""}`}>
                    <span className="dp-index">{c}¢</span>
                    {coinCounts[coinDenoms.indexOf(c)] || 0}
                  </span>
                ))}
                <p className="coin-total">Total coins: {totalCoins}</p>
              </div>
            )}
          </div>

          {run && (
            <OperationPlayer
              steps={run.steps}
              onComplete={() => {
                run.onComplete?.();
                recordOperation(`greedy:${tab}`);
              }}
              onPredictionAnswer={recordPrediction}
              onPlayStateChange={setIsAnimating}
              pseudocode={GREEDY_PSEUDOCODE[tab]}
            />
          )}

          <div className="info-panel">
            <h3>Data</h3>
            {tab === "activity" &&
              intervals.map(([s, e], i) => (
                <div key={i} className="greedy-label">
                  activity {i}: [{s}, {e}]
                </div>
              ))}
            {tab === "knapsack" &&
              knapsackItems.map(([w, v], i) => (
                <div key={i} className="greedy-label">
                  item {i}: weight {w}, value {v} (ratio {(v / w).toFixed(2)})
                </div>
              ))}
            {tab === "coin" && <p className="greedy-label">Denominations: {coinDenoms.join(", ")}</p>}
          </div>
        </div>

        <div className="controls-area">
          <h2>Greedy Settings</h2>
          <ErrorMessage message={error} />

          <TabNavigation tabs={TABS} activeTab={tab} onTabChange={handleTabChange} disabled={isAnimating} />

          {tab === "activity" && (
            <CasePresets
              disabled={isAnimating}
              presets={Object.keys(ACTIVITY_PRESETS).map((name) => ({
                label: name,
                onClick: () => setActivityData(name),
              }))}
            />
          )}
          {tab === "knapsack" && (
            <>
              <CasePresets
                disabled={isAnimating}
                presets={Object.keys(KNAPSACK_PRESETS).map((name) => ({
                  label: name,
                  onClick: () => setKnapsackData(name),
                }))}
              />
              <div className="input-group">
                <label>Capacity:</label>
                <input type="number" value={capacityInput} onChange={(e) => setCapacityInput(e.target.value)} disabled={isAnimating} placeholder="capacity" />
              </div>
            </>
          )}
          {tab === "coin" && (
            <>
              <CasePresets
                disabled={isAnimating}
                presets={Object.keys(COIN_PRESETS).map((name) => ({
                  label: name,
                  onClick: () => setCoinData(name),
                }))}
              />
              <div className="input-group">
                <label>Target:</label>
                <input type="number" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} disabled={isAnimating} placeholder="target" />
              </div>
            </>
          )}

          <form
            className="operation-inputs"
            onSubmit={(e) => {
              e.preventDefault();
              handleRun();
            }}
          >
            <button type="submit" className="operation-button" disabled={isAnimating}>
              {tab === "activity" ? "Schedule Activities" : tab === "knapsack" ? "Fill Knapsack" : "Make Change"}
            </button>
          </form>

          <ComplexityInfo operationName={complexityInfo.operationName} complexity={complexityInfo.complexity} explanation={complexityInfo.explanation} />

          <PropertyDisplay
            title="Greedy Properties"
            properties={
              tab === "activity"
                ? [{ name: "Activities", value: intervals.length }, { name: "Selected", value: pickedCount }]
                : tab === "knapsack"
                  ? [{ name: "Items", value: knapsackItems.length }, { name: "Filled", value: `${filled}/${capacity}` }]
                  : [{ name: "Denominations", value: coinDenoms.length }, { name: "Coins used", value: totalCoins }]
            }
          />
        </div>

        <div className="info-panel">
          <h3>Run history</h3>
          <RunHistoryPanel runs={listRuns("greedy")} onFork={handleForkRun} disabled={isAnimating} />
        </div>
      </div>
    </div>
  );
};

export default Greedy;
