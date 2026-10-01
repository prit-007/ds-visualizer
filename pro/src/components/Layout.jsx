import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, Home, ChevronRight, ChevronDown, Database, Code, BookOpen, BarChart2, Github, Settings, HelpCircle, Sun, Moon } from 'lucide-react';
import GuidedTour from './GuidedTour';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({
    dataStructures: true,
    algorithms: false,
    tutorials: false
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const toggleCategory = (category) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-900 dark:via-indigo-950 dark:to-blue-950 flex">
      {/* Sidebar */}
      <div className={`sidebar bg-white dark:bg-gray-900 shadow-xl border-r border-indigo-100 dark:border-gray-700 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'} flex flex-col`}>
        {/* Logo Section */}
        <div className="p-4 flex items-center justify-between border-b border-indigo-100 dark:border-gray-700">
          {isSidebarOpen && <span className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">AlgoViz</span>}
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-300"
          >
            <Menu size={20} />
          </button>
        </div>
        
        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav>
            <ul className="space-y-1 px-2">
              <li>
                <Link to="/" className="flex items-center px-4 py-2 text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 rounded-xl">
                  <Home size={20} />
                  {isSidebarOpen && <span className="ml-3 font-medium">Home</span>}
                </Link>
              </li>
              
              {/* Data Structures Section */}
              <li>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2 text-left text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 rounded-xl"
                  onClick={() => toggleCategory('dataStructures')}
                  aria-expanded={expandedCategories.dataStructures}
                >
                  <div className="flex items-center">
                    <Database size={20} />
                    {isSidebarOpen && <span className="ml-3 font-medium">Data Structures</span>}
                  </div>
                  {isSidebarOpen && (
                    expandedCategories.dataStructures ? 
                    <ChevronDown size={16} /> : 
                    <ChevronRight size={16} />
                  )}
                </button>
                
                {isSidebarOpen && expandedCategories.dataStructures && (
                  <ul className="pl-10 mt-1 space-y-1">
                    <li>
                      <Link to="/array" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Arrays & Lists
                      </Link>
                    </li>
                    <li>
                      <Link to="/linked-list" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Linked Lists
                      </Link>
                    </li>
                    <li>
                      <Link to="/stack-queue" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Stacks & Queues
                      </Link>
                    </li>
                    <li>
                      <Link to="/tree" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Trees
                      </Link>
                    </li>
                    <li>
                      <Link to="/graph" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Graphs
                      </Link>
                    </li>
                    <li>
                      <Link to="/hash-table" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Hash Tables
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              
              {/* Algorithms Section */}
              <li>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2 text-left text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 rounded-xl"
                  onClick={() => toggleCategory('algorithms')}
                  aria-expanded={expandedCategories.algorithms}
                >
                  <div className="flex items-center">
                    <Code size={20} />
                    {isSidebarOpen && <span className="ml-3 font-medium">Algorithms</span>}
                  </div>
                  {isSidebarOpen && (
                    expandedCategories.algorithms ? 
                    <ChevronDown size={16} /> : 
                    <ChevronRight size={16} />
                  )}
                </button>
                
                {isSidebarOpen && expandedCategories.algorithms && (
                  <ul className="pl-10 mt-1 space-y-1">
                    <li>
                      <Link to="/sorting" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Sorting
                      </Link>
                    </li>
                    <li>
                      <Link to="/searching" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Searching
                      </Link>
                    </li>
                    <li>
                      <Link to="/graph-algo" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Graph Algorithms
                      </Link>
                    </li>
                    <li>
                      <Link to="/dynamic-programming" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Dynamic Programming
                      </Link>
                    </li>
                    <li>
                      <Link to="/greedy" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Greedy Algorithms
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              
              {/* Tutorials Section */}
              <li>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2 text-left text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 rounded-xl"
                  onClick={() => toggleCategory('tutorials')}
                  aria-expanded={expandedCategories.tutorials}
                >
                  <div className="flex items-center">
                    <BookOpen size={20} />
                    {isSidebarOpen && <span className="ml-3 font-medium">Tutorials</span>}
                  </div>
                  {isSidebarOpen && (
                    expandedCategories.tutorials ? 
                    <ChevronDown size={16} /> : 
                    <ChevronRight size={16} />
                  )}
                </button>
                
                {isSidebarOpen && expandedCategories.tutorials && (
                  <ul className="pl-10 mt-1 space-y-1">
                    <li>
                      <Link to="/beginner" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Beginners
                      </Link>
                    </li>
                    <li>
                      <Link to="/intermediate" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Intermediate
                      </Link>
                    </li>
                    <li>
                      <Link to="/advanced" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Advanced
                      </Link>
                    </li>
                    <li>
                      <Link to="/practice" className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl">
                        Practice Problems
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              
              <li>
                <Link to="/visualizer" className="flex items-center px-4 py-2 text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 rounded-xl">
                  <BarChart2 size={20} />
                  {isSidebarOpen && <span className="ml-3 font-medium">Visualizer</span>}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Bottom Links */}
        <div className="sidebar-footer p-4 border-t border-indigo-100 dark:border-gray-700">
          <ul className="space-y-2 px-2">
            <li>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 rounded-xl">
                <Github size={20} />
                {isSidebarOpen && <span className="ml-3 font-medium">GitHub</span>}
              </a>
            </li>
            <li>
              <Link to="/settings" className="flex items-center px-4 py-2 text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 rounded-xl">
                <Settings size={20} />
                {isSidebarOpen && <span className="ml-3 font-medium">Settings</span>}
              </Link>
            </li>
            <li>
              <Link to="/help" className="flex items-center px-4 py-2 text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 rounded-xl">
                <HelpCircle size={20} />
                {isSidebarOpen && <span className="ml-3 font-medium">Help</span>}
              </Link>
            </li>
            <GuidedTour collapsed={!isSidebarOpen} />
          </ul>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-900 shadow-sm h-16 flex items-center px-6 gap-4">
          <h1 className="flex-1 text-2xl font-extrabold text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            AlgoViz - Data Structures &amp; Algorithms Visualizer
          </h1>
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={isDark}
            className="theme-toggle p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-300 transition-colors duration-fast"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>
        
        <main className="workspace p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;