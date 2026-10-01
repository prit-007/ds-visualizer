import { Link } from 'react-router-dom';
import { LESSONS } from '../lessons';
import './Lessons.css';

const Lessons = () => (
  <div className="lessons-page">
    <h1>Lessons</h1>
    <p className="lessons-intro">
      Short why → how → practice reads for every implemented structure. Predict the answer first,
      then open the visualizer and check yourself.
    </p>
    <div className="lessons-grid">
      {LESSONS.map((lesson) => (
        <Link key={lesson.slug} to={`/lessons/${lesson.slug}`} className="lesson-card">
          <span className="lesson-tag">{lesson.structure}</span>
          <h2>{lesson.title}</h2>
          <p>{lesson.summary}</p>
          <span className="lesson-cta">Read lesson →</span>
        </Link>
      ))}
    </div>
  </div>
);

export default Lessons;
