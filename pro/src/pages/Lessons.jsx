import { Link } from 'react-router-dom';
import { LESSONS } from '../lessons';
import { loadProgress } from '../lib/progress';
import './Lessons.css';

const Lessons = () => {
  const progress = loadProgress();
  const completedCount = LESSONS.filter((lesson) => progress.lessons[lesson.slug]).length;

  return (
    <div className="lessons-page">
      <h1>Lessons</h1>
      <div className="progress-summary">
        <span className="progress-xp">XP {progress.xp}</span>
        <span className="progress-streak">Streak {progress.streak.count}</span>
        <span className="progress-lessons">
          Lessons {completedCount} / {LESSONS.length}
        </span>
      </div>
      <p className="lessons-intro">
        Short why → how → practice reads for every implemented structure. Predict the answer first,
        then open the visualizer and check yourself.
      </p>
      <div className="lessons-grid">
        {LESSONS.map((lesson) => {
          const done = Boolean(progress.lessons[lesson.slug]);
          return (
            <Link
              key={lesson.slug}
              to={`/lessons/${lesson.slug}`}
              className={`lesson-card${done ? ' completed' : ''}`}
            >
              <span className="lesson-tag">{lesson.structure}</span>
              <h2>{lesson.title}</h2>
              <p>{lesson.summary}</p>
              <span className="lesson-cta">{done ? 'Revisit lesson →' : 'Read lesson →'}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Lessons;
