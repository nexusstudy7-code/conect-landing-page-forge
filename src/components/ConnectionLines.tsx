interface ConnectionLinesProps {
  className?: string;
}

const ConnectionLines = ({ className = '' }: ConnectionLinesProps) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Simple static gradient lines for performance */}
      <svg
        className="absolute w-full h-full opacity-[0.03]"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <path
          d="M0 200 Q250 150 500 300 T1000 250"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M0 400 Q200 500 400 400 T800 500 T1000 400"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M0 700 Q300 600 600 750 T1000 650"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        
        {/* Connection nodes */}
        <circle cx="250" cy="175" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="500" cy="300" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="750" cy="275" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="400" cy="450" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="600" cy="750" r="3" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
  );
};

export default ConnectionLines;
