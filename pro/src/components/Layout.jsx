import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, Home, ChevronRight, ChevronDown, Database, Code, BookOpen, BarChart2, Github, Settings, HelpCircle, Sun, Moon } from 'lucide-react';
import GuidedTour from './GuidedTour';

const Layout = () => {
  // Drawer starts open on desktop; on phones start collapsed so content
  // is visible immediately (the toggle lives in the always-visible header).
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 768
  );
  const [expandedCategories, setExpandedCategories] = useState({
    dataStructures: true,
    algorithms: false,
    tutorials: false
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const location = useLocation();
  const workspaceRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Route change: scroll the content pane back to the top; on phones the
  // drawer closes so the destination page is visible immediately.
  useEffect(() => {
    if (workspaceRef.current) workspaceRef.current.scrollTop = 0;
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [location.pathname]);

  // Escape closes the mobile drawer.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleCategory = (category) => {
    // Collapsed rail: one click re-opens the sidebar and expands the section
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setExpandedCategories((prev) => ({ ...prev, [category]: true }));
      return;
    }
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  // Active-section marker: highlight a category when any child route is live
  const categoryActive = (paths) => paths.some((path) => isActivePath(path));

  const categoryClass = (active) =>
    `w-full flex items-center justify-between px-4 py-2 text-left rounded-xl transition-colors duration-150 ${
      active
        ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-100 font-semibold'
        : 'text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800'
    }`;

  const isActivePath = (path) => location.pathname === path;

  const navLinkClass = (path) => {
    const base =
      'flex items-center rounded-xl transition-colors duration-150';
    const active = isActivePath(path);
    const sizing = isSidebarOpen ? 'px-4 py-2' : 'px-0 justify-center py-2';
    const tone = active
      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100 font-semibold'
      : 'text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800';
    return `${base} ${sizing} ${tone}`;
  };

  const subLinkClass = (path) => {
    const active = isActivePath(path);
    return `block px-4 py-2 text-sm rounded-xl transition-colors duration-150 ${
      active
        ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100 font-semibold'
        : 'text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800'
    }`;
  };

  const pageTransition = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.18, ease: 'easeOut' },
      };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-900 dark:via-indigo-950 dark:to-blue-950">
      {/* Mobile backdrop: tap to close the drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — static on desktop (collapsible rail), off-canvas drawer on mobile */}
      <div
        className={`sidebar bg-white dark:bg-gray-900 shadow-xl border-r border-indigo-100 dark:border-gray-700 transition-all duration-300 flex flex-col h-full z-40 md:z-auto md:static ${
          isSidebarOpen
            ? 'w-64 translate-x-0'
            : 'w-16 -translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="p-4 flex items-center border-b border-indigo-100 dark:border-gray-700 shrink-0">
          {isSidebarOpen && <span className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">AlgoViz</span>}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          <nav aria-label="Main navigation">
            <ul className="space-y-1 px-2">
              <li>
                <Link
                  to="/"
                  className={navLinkClass('/')}
                  aria-current={isActivePath('/') ? 'page' : undefined}
                  aria-label="Home"
                  title={!isSidebarOpen ? 'Home' : undefined}
                >
                  <Home size={20} />
                  {isSidebarOpen && <span className="ml-3 font-medium">Home</span>}
                </Link>
              </li>

              {/* Data Structures Section */}
              <li>
                <button
                  type="button"
                  className={categoryClass(categoryActive(['/array', '/linked-list', '/stack-queue', '/tree', '/graph', '/hash-table']))}
                  onClick={() => toggleCategory('dataStructures')}
                  aria-expanded={expandedCategories.dataStructures}
                  aria-label="Data Structures"
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
                      <Link to="/array" className={subLinkClass('/array')} aria-current={isActivePath('/array') ? 'page' : undefined}>
                        Arrays &amp; Lists
                      </Link>
                    </li>
                    <li>
                      <Link to="/linked-list" className={subLinkClass('/linked-list')} aria-current={isActivePath('/linked-list') ? 'page' : undefined}>
                        Linked Lists
                      </Link>
                    </li>
                    <li>
                      <Link to="/stack-queue" className={subLinkClass('/stack-queue')} aria-current={isActivePath('/stack-queue') ? 'page' : undefined}>
                        Stacks &amp; Queues
                      </Link>
                    </li>
                    <li>
                      <Link to="/tree" className={subLinkClass('/tree')} aria-current={isActivePath('/tree') ? 'page' : undefined}>
                        Trees
                      </Link>
                    </li>
                    <li>
                      <Link to="/graph" className={subLinkClass('/graph')} aria-current={isActivePath('/graph') ? 'page' : undefined}>
                        Graphs
                      </Link>
                    </li>
                    <li>
                      <Link to="/hash-table" className={subLinkClass('/hash-table')} aria-current={isActivePath('/hash-table') ? 'page' : undefined}>
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
                  className={categoryClass(categoryActive(['/sorting', '/searching', '/graph-algo', '/dynamic-programming', '/greedy']))}
                  onClick={() => toggleCategory('algorithms')}
                  aria-expanded={expandedCategories.algorithms}
                  aria-label="Algorithms"
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
                      <Link to="/sorting" className={subLinkClass('/sorting')} aria-current={isActivePath('/sorting') ? 'page' : undefined}>
                        Sorting
                      </Link>
                    </li>
                    <li>
                      <Link to="/searching" className={subLinkClass('/searching')} aria-current={isActivePath('/searching') ? 'page' : undefined}>
                        Searching
                      </Link>
                    </li>
                    <li>
                      <Link to="/graph-algo" className={subLinkClass('/graph-algo')} aria-current={isActivePath('/graph-algo') ? 'page' : undefined}>
                        Graph Algorithms
                      </Link>
                    </li>
                    <li>
                      <Link to="/dynamic-programming" className={subLinkClass('/dynamic-programming')} aria-current={isActivePath('/dynamic-programming') ? 'page' : undefined}>
                        Dynamic Programming
                      </Link>
                    </li>
                    <li>
                      <Link to="/greedy" className={subLinkClass('/greedy')} aria-current={isActivePath('/greedy') ? 'page' : undefined}>
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
                  className={categoryClass(categoryActive(['/lessons', '/curriculum', '/complexity', '/challenges']))}
                  onClick={() => toggleCategory('tutorials')}
                  aria-expanded={expandedCategories.tutorials}
                  aria-label="Tutorials"
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
                      <Link to="/lessons" className={subLinkClass('/lessons')} aria-current={isActivePath('/lessons') ? 'page' : undefined}>
                        Lessons
                      </Link>
                    </li>
                    <li>
                      <Link to="/curriculum" className={subLinkClass('/curriculum')} aria-current={isActivePath('/curriculum') ? 'page' : undefined}>
                        Curriculum map
                      </Link>
                    </li>
                    <li>
                      <Link to="/complexity" className={subLinkClass('/complexity')} aria-current={isActivePath('/complexity') ? 'page' : undefined}>
                        Complexity Lab
                      </Link>
                    </li>
                    <li>
                      <Link to="/challenges" className={subLinkClass('/challenges')} aria-current={isActivePath('/challenges') ? 'page' : undefined}>
                        Challenges
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <Link
                  to="/visualizer"
                  className={navLinkClass('/visualizer')}
                  aria-current={isActivePath('/visualizer') ? 'page' : undefined}
                  aria-label="Visualizer"
                  title={!isSidebarOpen ? 'Visualizer' : undefined}
                >
                  <BarChart2 size={20} />
                  {isSidebarOpen && <span className="ml-3 font-medium">Visualizer</span>}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom Links */}
        <div className="sidebar-footer p-4 border-t border-indigo-100 dark:border-gray-700 shrink-0">
          <ul className="space-y-2 px-2">
            <li>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 text-indigo-700 dark:text-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 rounded-xl transition-colors duration-150" title={!isSidebarOpen ? 'GitHub' : undefined}>
                <Github size={20} />
                {isSidebarOpen && <span className="ml-3 font-medium">GitHub</span>}
              </a>
            </li>
            <li>
              <Link to="/settings" className={navLinkClass('/settings')} aria-current={isActivePath('/settings') ? 'page' : undefined} aria-label="Settings" title={!isSidebarOpen ? 'Settings' : undefined}>
                <Settings size={20} />
                {isSidebarOpen && <span className="ml-3 font-medium">Settings</span>}
              </Link>
            </li>
            <li>
              <Link to="/help" className={navLinkClass('/help')} aria-current={isActivePath('/help') ? 'page' : undefined} aria-label="Help" title={!isSidebarOpen ? 'Help' : undefined}>
                <HelpCircle size={20} />
                {isSidebarOpen && <span className="ml-3 font-medium">Help</span>}
              </Link>
            </li>
            <GuidedTour collapsed={!isSidebarOpen} />
          </ul>
        </div>
      </div>

      {/* Main Content — header fixed, workspace scrolls inside the viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="bg-white dark:bg-gray-900 shadow-sm h-14 sm:h-16 shrink-0 flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle navigation"
            aria-expanded={isSidebarOpen}
            className="p-2 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-300 shrink-0"
          >
            <Menu size={22} />
          </button>
          <h1 className="flex-1 min-w-0 text-base sm:text-2xl font-extrabold text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent truncate">
            <span className="sm:hidden">AlgoViz</span>
            <span className="hidden sm:inline">AlgoViz - Data Structures &amp; Algorithms Visualizer</span>
          </h1>
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={isDark}
            className="theme-toggle p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-300 transition-colors duration-fast shrink-0"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <main className="workspace flex-1 overflow-y-auto min-h-0 p-4 md:p-6" ref={workspaceRef}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              {...pageTransition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
