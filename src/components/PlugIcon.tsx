import { motion } from 'framer-motion';

interface PlugIconProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

const PlugIcon = ({ size = 40, className = '', animated = true }: PlugIconProps) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Outer circle/cable */}
      <motion.circle
        cx="50"
        cy="50"
        r="35"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={animated ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      {/* Plug body */}
      <motion.rect
        x="35"
        y="40"
        width="30"
        height="25"
        rx="3"
        fill="currentColor"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      
      {/* Plug prongs */}
      <motion.rect
        x="42"
        y="30"
        width="5"
        height="12"
        rx="2"
        fill="currentColor"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
      <motion.rect
        x="53"
        y="30"
        width="5"
        height="12"
        rx="2"
        fill="currentColor"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      />
      
      {/* Cable */}
      <motion.path
        d="M50 65 Q50 80 65 85"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={animated ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      />
    </motion.svg>
  );
};

export default PlugIcon;
