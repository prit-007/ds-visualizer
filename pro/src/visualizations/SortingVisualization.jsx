// Sorting Visualization Component
const SortingVisualization = () => {
    return (
        <svg viewBox="0 0 300 150" className="w-full h-auto">
            <rect x="0" y="0" width="300" height="150" fill="#f8fafc" />

            {/* Bars representing array elements */}
            <rect x="20" y="100" width="20" height="30" fill="#3b82f6" />
            <rect x="50" y="70" width="20" height="60" fill="#60a5fa" />
            <rect x="80" y="40" width="20" height="90" fill="#93c5fd" />
            <rect x="110" y="80" width="20" height="50" fill="#3b82f6" />
            <rect x="140" y="60" width="20" height="70" fill="#60a5fa" />
            <rect x="170" y="30" width="20" height="100" fill="#93c5fd" />
            <rect x="200" y="90" width="20" height="40" fill="#3b82f6" />
            <rect x="230" y="50" width="20" height="80" fill="#60a5fa" />

            {/* Compare indicators */}
            <rect x="80" y="20" width="20" height="10" fill="#ef4444" />
            <rect x="170" y="20" width="20" height="10" fill="#ef4444" />
            <path d="M90,15 L90,5 L180,5 L180,15" stroke="#ef4444" strokeWidth="2" fill="none" />

            {/* Animation */}
            <rect x="80" y="40" width="20" height="90" fill="#ef4444" opacity="0.2">
                <animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.5s" repeatCount="indefinite" />
            </rect>
            <rect x="170" y="30" width="20" height="100" fill="#ef4444" opacity="0.2">
                <animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.5s" repeatCount="indefinite" />
            </rect>
        </svg>
    );
};

export default SortingVisualization;