import { Link } from 'react-router-dom';
import { CONCEPTS, layoutCurriculum, masteryFor } from '../lib/curriculum';
import { loadProgress } from '../lib/progress';
import './Curriculum.css';

const MASTERY_LABEL = {
  new: 'New',
  started: 'In progress',
  mastered: 'Mastered',
};

const Curriculum = () => {
  const progress = loadProgress();
  const { nodes, edges, width, height } = layoutCurriculum(CONCEPTS);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div className="curriculum-page">
      <h1>Curriculum map</h1>
      <p className="curriculum-intro">
        Follow the arrows from what you know to what comes next. Concepts tint by mastery — lesson
        done plus operations practiced marks a concept mastered.
      </p>
      <div className="curriculum-legend">
        {Object.entries(MASTERY_LABEL).map(([key, label]) => (
          <span key={key} className={`curriculum-legend-chip mastery-${key}`}>
            {label}
          </span>
        ))}
      </div>
      <div className="curriculum-canvas" style={{ width, height }}>
        <svg
          className="curriculum-edges"
          width={width}
          height={height}
          aria-hidden="true"
          focusable="false"
        >
          {edges.map((edge) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                className="curriculum-edge"
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            );
          })}
        </svg>
        {nodes.map((node) => {
          const mastery = masteryFor(node, progress);
          return (
            <Link
              key={node.id}
              to={node.href}
              data-concept={node.id}
              aria-label={node.title}
              className={`curriculum-node mastery-${mastery}`}
              style={{ left: node.x, top: node.y }}
            >
              <span className="curriculum-node-title">{node.title}</span>
              <span className="curriculum-node-meta">{node.structure}</span>
              <span className="curriculum-node-summary">{node.summary}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Curriculum;
