import { Link, useParams } from 'react-router-dom';
import { getLesson } from '../lessons';
import './Lessons.css';

const LessonReader = () => {
  const { slug } = useParams();
  const lesson = getLesson(slug);

  if (!lesson) {
    return (
      <div className="empty-state">
        <h2>Lesson not found</h2>
        <p>That lesson has not been written yet — pick one from the list instead.</p>
        <Link to="/lessons">← Back to lessons</Link>
      </div>
    );
  }

  return (
    <article className="lesson-article">
      <Link to="/lessons" className="lesson-back">
        ← Back to lessons
      </Link>
      <lesson.Component />
    </article>
  );
};

export default LessonReader;
