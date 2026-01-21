import { type Variants, type Transition } from "framer-motion"

// Default spring transition for smooth animations
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
}

// Smooth ease transition
export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
}

// Container variants for staggered children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// Fast stagger for lists
export const fastStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

// Fade up animation for cards and sections
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
}

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

// Scale fade animation for modals and dialogs
export const scaleFade: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

// Slide in from right (for sheets/sidebars)
export const slideInRight: Variants = {
  hidden: { x: "100%" },
  show: {
    x: 0,
    transition: smoothTransition,
  },
  exit: {
    x: "100%",
    transition: { duration: 0.2 },
  },
}

// Slide in from left
export const slideInLeft: Variants = {
  hidden: { x: "-100%" },
  show: {
    x: 0,
    transition: smoothTransition,
  },
  exit: {
    x: "-100%",
    transition: { duration: 0.2 },
  },
}

// Slide in from bottom (for mobile sheets)
export const slideInBottom: Variants = {
  hidden: { y: "100%" },
  show: {
    y: 0,
    transition: smoothTransition,
  },
  exit: {
    y: "100%",
    transition: { duration: 0.2 },
  },
}

// Card hover animation
export const cardHover = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: springTransition,
  },
  tap: {
    scale: 0.98,
  },
}

// Button press animation
export const buttonPress = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.95 },
}

// Icon bounce animation
export const iconBounce = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.1,
    rotate: [0, -10, 10, -10, 0],
    transition: {
      rotate: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  },
}

// Progress bar fill animation
export const progressFill = (value: number): Variants => ({
  hidden: { scaleX: 0, originX: 0 },
  show: {
    scaleX: value / 100,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
      delay: 0.2,
    },
  },
})

// Circular progress draw animation
export const circularProgressDraw = (progress: number, circumference: number): Variants => ({
  hidden: {
    strokeDashoffset: circumference,
  },
  show: {
    strokeDashoffset: circumference - (progress / 100) * circumference,
    transition: {
      duration: 1,
      ease: [0.4, 0, 0.2, 1],
      delay: 0.3,
    },
  },
})

// Number counter animation config
export const counterAnimation = {
  duration: 1,
  delay: 0.2,
}

// Water fill animation
export const waterFill = (percentage: number): Variants => ({
  hidden: { height: "0%" },
  show: {
    height: `${percentage}%`,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
    },
  },
})

// List item animation
export const listItem: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: smoothTransition,
  },
}

// Pulse animation for timers
export const pulse: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

// Shake animation for errors
export const shake: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
}

// Success checkmark animation
export const checkmark: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: "easeOut" },
      opacity: { duration: 0.1 },
    },
  },
}

// Backdrop overlay animation
export const backdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  exit: { opacity: 0 },
}

// Page transition variants
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
}

// Tab content transition
export const tabContent: Variants = {
  hidden: { opacity: 0, x: 10 },
  show: {
    opacity: 1,
    x: 0,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.2 },
  },
}

// Celebration animation (for goals reached)
export const celebration: Variants = {
  initial: { scale: 1, rotate: 0 },
  celebrate: {
    scale: [1, 1.2, 1],
    rotate: [0, -5, 5, -5, 0],
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}
