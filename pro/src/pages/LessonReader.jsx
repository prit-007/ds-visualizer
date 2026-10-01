import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLesson } from '../lessons';
import { isLessonComplete, recordLesson } from '../lib/progress';
import { fireCelebration } from '../lib/celebration';
import './Lessons.css';

const LessonReader = () => {
  const { slug } = useParams();
  const lesson = getLesson(slug);
  const [completed, setCompleted] = useState(() => isLessonComplete(slug));

  useEffect(() => {
    setCompleted(isLessonComplete(slug));
  }, [slug]);

  if (!lesson) {
    return (
      <div className="empty-state">
        <h2>Lesson not found</h2>
        <p>That lesson has not been written yet — pick one from the list instead.</p>
        <Link to="/lessons">← Back to lessons</Link>
      </div>
    );
  }

  const handleComplete = () => {
    if (completed) return;
    recordLesson(slug);
    fireCelebration();
    setCompleted(true);
  };

  return (
    <article className="lesson-article">
      <Link to="/lessons" className="lesson-back">
        ← Back to lessons
      </Link>
      <lesson.Component />
      <div className="lesson-footer">
        <button
          type="button"
          className="lesson-complete"
          onClick={handleComplete}
          disabled={completed}
        >
          {completed ? 'Completed ✓' : 'Mark as complete'}
        </button>
      </div>
    </article>
  );
};

export default LessonReader;
