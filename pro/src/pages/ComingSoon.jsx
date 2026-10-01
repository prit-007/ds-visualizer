import React from 'react';
import { Link } from 'react-router-dom';

const ComingSoon = ({ title }) => {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 mb-8">
        This visualizer is on the roadmap but not built yet. In the meantime,
        explore one of the implemented structures:
      </p>
      <div className="flex justify-center gap-4 flex-wrap">
        <Link
          to="/array"
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
        >
          Array
        </Link>
        <Link
          to="/linked-list"
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
        >
          Linked List
        </Link>
        <Link
          to="/tree"
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
        >
          AVL Tree
        </Link>
      </div>
    </div>
  );
};

export default ComingSoon;
