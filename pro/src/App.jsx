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
import StackQueue from './pages/StackQueue';
import HashTable from './pages/HashTable';
import Graph from './pages/Graph';
import Sorting from './pages/Sorting';
import Searching from './pages/Searching';
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
          <Route path='/stack-queue' element={<StackQueue />} />
          <Route path='/graph' element={<Graph />} />
          <Route path='/hash-table' element={<HashTable />} />
          <Route path='/sorting' element={<Sorting />} />
          <Route path='/searching' element={<Searching />} />
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
