// Tree Visualization Component
const TreeVisualization = () => {
    return (
        <svg viewBox="0 0 300 150" className="w-full h-auto">
            <rect x="0" y="0" width="300" height="150" fill="#f8fafc" />

            {/* Tree Nodes */}
            {/* Root */}
            <circle cx="150" cy="30" r="20" fill="#3b82f6" />
            <text x="150" y="35" fontFamily="monospace" fontSize="14" fill="white" textAnchor="middle">50</text>

            {/* Level 1 */}
            <circle cx="90" cy="80" r="20" fill="#60a5fa" />
            <text x="90" y="85" fontFamily="monospace" fontSize="14" fill="white" textAnchor="middle">25</text>

            <circle cx="210" cy="80" r="20" fill="#60a5fa" />
            <text x="210" y="85" fontFamily="monospace" fontSize="14" fill="white" textAnchor="middle">75</text>

            {/* Level 2 */}
            <circle cx="60" cy="120" r="15" fill="#93c5fd" />
            <text x="60" y="125" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">10</text>

            <circle cx="120" cy="120" r="15" fill="#93c5fd" />
            <text x="120" y="125" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">30</text>

            <circle cx="180" cy="120" r="15" fill="#93c5fd" />
            <text x="180" y="125" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">60</text>

            <circle cx="240" cy="120" r="15" fill="#93c5fd" />
            <text x="240" y="125" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">90</text>

            {/* Edges */}
            <line x1="138" y1="45" x2="102" y2="65" stroke="#3b82f6" strokeWidth="2" />
            <line x1="162" y1="45" x2="198" y2="65" stroke="#3b82f6" strokeWidth="2" />

            <line x1="83" y1="95" x2="67" y2="105" stroke="#60a5fa" strokeWidth="2" />
            <line x1="97" y1="95" x2="113" y2="105" stroke="#60a5fa" strokeWidth="2" />

            <line x1="203" y1="95" x2="187" y2="105" stroke="#60a5fa" strokeWidth="2" />
            <line x1="217" y1="95" x2="233" y2="105" stroke="#60a5fa" strokeWidth="2" />

            {/* Current operation highlight */}
            <circle cx="210" cy="80" r="25" fill="none" stroke="#ef4444" strokeWidth="2">
                <animate attributeName="r" values="22;25;22" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
};

export default TreeVisualization;