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
          <Route path='/stack-queue' element={<ComingSoon title="Stack & Queue" />} />
          <Route path='/graph' element={<ComingSoon title="Graph" />} />
          <Route path='/hash-table' element={<ComingSoon title="Hash Table" />} />
          <Route path='/sorting' element={<ComingSoon title="Sorting Visualizer" />} />
          <Route path='/searching' element={<ComingSoon title="Searching Algorithms" />} />
          <Route path='/graph-algo' element={<ComingSoon title="Graph Algorithms" />} />
          <Route path='/dynamic-programming' element={<ComingSoon title="Dynamic Programming" />} />
          <Route path='/greedy' element={<ComingSoon title="Greedy Algorithms" />} />
          <Route path='/beginner' element={<ComingSoon title="Beginner Track" />} />
          <Route path='/intermediate' element={<ComingSoon title="Intermediate Track" />} />
          <Route path='/advanced' element={<ComingSoon title="Advanced Track" />} />
          <Route path='/practice' element={<ComingSoon title="Practice" />} />
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
