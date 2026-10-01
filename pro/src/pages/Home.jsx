import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Code, BookOpen } from 'lucide-react';
import HeroSVG from '../visualizations/HeroSVG'; 
import SortingVisualization from '../visualizations/SortingVisualization'; 
import TreeVisualization from '../visualizations/TreeVisualization';

const Home = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="py-12 mb-12 border-b border-gray-200">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Visualize, Learn, Master</h2>
            <p className="text-xl text-gray-600 mb-6">
              Interactive visualizations that bring data structures and algorithms to life
            </p>
            <div className="flex space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition">
                Get Started
              </button>
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md transition">
                Explore Tutorials
              </button>
            </div>
          </div>
          <div className="md:w-1/2">
            <HeroSVG />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-12 mb-12 border-b border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Database size={24} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Interactive Data Structures</h3>
            <p className="text-gray-600">
              Visualize arrays, linked lists, trees, graphs, and more with dynamic, step-by-step animations
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Code size={24} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Algorithm Playground</h3>
            <p className="text-gray-600">
              Watch sorting, searching, and graph algorithms in action with customizable inputs and speed controls
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Comprehensive Tutorials</h3>
            <p className="text-gray-600">
              Learn with detailed explanations, code examples, and practice problems for all skill levels
            </p>
          </div>
        </div>
      </section>
      
      {/* Showcase Section */}
      <section className="py-12 mb-12 border-b border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Explore Visualizations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md overflow-hidden">
            <h3 className="text-xl font-semibold mb-4">Sorting Algorithms</h3>
            <SortingVisualization />
            <div className="mt-4">
              <Link to="/sorting" className="text-blue-600 hover:text-blue-800 font-medium">Try sorting visualizer →</Link>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md overflow-hidden">
            <h3 className="text-xl font-semibold mb-4">Binary Search Tree</h3>
            <TreeVisualization />
            <div className="mt-4">
              <Link to="/tree" className="text-blue-600 hover:text-blue-800 font-medium">Explore tree operations →</Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-12 bg-blue-50 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to master algorithms?</h2>
        <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
          Join thousands of students and professionals who have improved their programming skills with AlgoViz
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md text-lg transition">
          Start Learning Now
        </button>
      </section>
    </div>
  );
};

export default Home;