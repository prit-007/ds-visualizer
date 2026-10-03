import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Layout from './components/Layout';
import Home from './pages/Home';
import ArrayVisualizer from './pages/ArrayVisualizer';
import LinkedListVisualizer from './pages/LinkedListVisualizer';
import TreeVisualizer from './pages/TreeVisualizer';
import Lessons from './pages/Lessons';
import LessonReader from './pages/LessonReader';
import Curriculum from './pages/Curriculum';
import ComplexityLab from './pages/ComplexityLab';
import Challenges from './pages/Challenges';
import ComingSoon from './pages/ComingSoon';

const App = () => {
  return (
    <Router>
      <MotionConfig reducedMotion="user">
        <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path='/array' element={<ArrayVisualizer />} />
          <Route path='/linked-list' element={<LinkedListVisualizer />} />
          <Route path='/tree' element={<TreeVisualizer />} />
          <Route path='/lessons' element={<Lessons />} />
          <Route path='/lessons/:slug' element={<LessonReader />} />
          <Route path='/curriculum' element={<Curriculum />} />
          <Route path='/complexity' element={<ComplexityLab />} />
          <Route path='/challenges' element={<Challenges />} />
          <Route path='/stack-queue' element={<ComingSoon title="Stack & Queue" />} />
          <Route path='/graph' element={<ComingSoon title="Graph" />} />
          <Route path='/hash-table' element={<ComingSoon title="Hash Table" />} />
          <Route path='/sorting' element={<ComingSoon title="Sorting Visualizer" />} />
          <Route path='/searching' element={<ComingSoon title="Searching Algorithms" />} />
          <Route path='/graph-algo' element={<ComingSoon title="Graph Algorithms" />} />
          <Route path='/dynamic-programming' element={<ComingSoon title="Dynamic Programming" />} />
          <Route path='/greedy' element={<ComingSoon title="Greedy Algorithms" />} />
          <Route path='/visualizer' element={<ComingSoon title="Visualizer" />} />
          <Route path='/settings' element={<ComingSoon title="Settings" />} />
          <Route path='/help' element={<ComingSoon title="Help" />} />
        </Route>
      </Routes>
      </MotionConfig>
    </Router>
  );
};

export default App;
