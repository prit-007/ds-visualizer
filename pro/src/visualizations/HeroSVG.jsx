// Hero SVG Component
const HeroSVG = () => {
    return (
        <svg viewBox="0 0 500 300" className="w-full h-auto">
            {/* Background Elements */}
            <rect x="0" y="0" width="500" height="300" fill="#f8fafc" />
            <circle cx="400" cy="50" r="30" fill="#dbeafe" />
            <circle cx="100" cy="250" r="20" fill="#dbeafe" />
            <path d="M0,200 Q125,150 250,200 T500,200" stroke="#bfdbfe" strokeWidth="2" fill="none" />

            {/* Main Visualization Area */}
            <rect x="100" y="80" width="300" height="140" rx="10" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />

            {/* Array Visualization */}
            <rect x="120" y="100" width="40" height="40" rx="4" fill="#3b82f6" />
            <rect x="170" y="100" width="40" height="40" rx="4" fill="#60a5fa" />
            <rect x="220" y="100" width="40" height="40" rx="4" fill="#93c5fd" />
            <rect x="270" y="100" width="40" height="40" rx="4" fill="#3b82f6" />
            <rect x="320" y="100" width="40" height="40" rx="4" fill="#60a5fa" />

            {/* Array Values */}
            <text x="140" y="125" fontFamily="monospace" fontSize="16" fill="white" textAnchor="middle">12</text>
            <text x="190" y="125" fontFamily="monospace" fontSize="16" fill="white" textAnchor="middle">45</text>
            <text x="240" y="125" fontFamily="monospace" fontSize="16" fill="white" textAnchor="middle">23</text>
            <text x="290" y="125" fontFamily="monospace" fontSize="16" fill="white" textAnchor="middle">8</text>
            <text x="340" y="125" fontFamily="monospace" fontSize="16" fill="white" textAnchor="middle">67</text>

            {/* Sorting Visualization Arrows */}
            <path d="M140,150 L140,170 L240,170 L240,150" stroke="#ef4444" strokeWidth="2" fill="none" />
            <polygon points="235,155 240,150 245,155" fill="#ef4444" />

            {/* Control Panel */}
            <rect x="120" y="180" width="240" height="20" rx="4" fill="#e2e8f0" />
            <circle cx="130" cy="190" r="5" fill="#3b82f6" />
            <rect x="145" y="185" width="10" height="10" fill="#3b82f6" />
            <path d="M170,185 L180,190 L170,195 Z" fill="#3b82f6" />
            <rect x="190" y="185" width="20" height="10" fill="#3b82f6" />
            <path d="M220,185 L220,195 M225,185 L225,195" stroke="#3b82f6" strokeWidth="2" />

            {/* Code Elements */}
            <rect x="380" y="65" width="100" height="80" rx="4" fill="white" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="390" y1="80" x2="470" y2="80" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="390" y1="95" x2="450" y2="95" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="390" y1="110" x2="460" y2="110" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="390" y1="125" x2="440" y2="125" stroke="#cbd5e1" strokeWidth="1" />

            {/* Decorative Elements */}
            <circle cx="50" cy="100" r="35" fill="white" stroke="#93c5fd" strokeWidth="2" />
            <path d="M35,100 L65,100 M50,85 L50,115" stroke="#3b82f6" strokeWidth="2" />

            <circle cx="50" cy="200" r="35" fill="white" stroke="#93c5fd" strokeWidth="2" />
            <path d="M35,200 L65,200" stroke="#3b82f6" strokeWidth="2" />

            <circle cx="450" cy="200" r="35" fill="white" stroke="#93c5fd" strokeWidth="2" />
            <path d="M435,185 L465,215 M435,215 L465,185" stroke="#3b82f6" strokeWidth="2" />

            {/* Animation Effect */}
            <circle cx="290" y="125" r="20" fill="rgba(239, 68, 68, 0.2)">
                <animate attributeName="r" from="5" to="20" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
};

export default HeroSVG;