import type { Transition, Variants } from 'framer-motion'

export const motionDurations = {
  instant: 0.08,
  fast: 0.16,
  normal: 0.22,
  slow: 0.32,
} as const

export const motionEasing = {
  standard: [0.4, 0, 0.2, 1],
  softOut: [0.22, 1, 0.36, 1],
  smoothInOut: [0.45, 0, 0.2, 1],
} as const

export const routeTransition: Transition = {
  duration: motionDurations.normal,
  ease: motionEasing.softOut,
}

export const pageMotion: Variants = {
  initial: { opacity: 0, y: 10, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
}

export const panelMotion: Variants = {
  closed: {
    opacity: 0,
    x: 18,
    transition: { duration: motionDurations.fast, ease: motionEasing.standard },
  },
  open: {
    opacity: 1,
    x: 0,
    transition: { duration: motionDurations.slow, ease: motionEasing.softOut },
  },
}

export const staggerParent: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.04,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasing.softOut,
    },
  },
}

export const animations = {
  cardHover: 'card-lift',
  buttonPress: 'btn-press',
  controlButton: 'interactive-soft hover:scale-[1.08] active:scale-[0.94]',
  progressThumb: 'transition-opacity duration-fast group-hover:opacity-100',
  progressFill: 'transition-[width] duration-fast ease-default',
  volumeReveal: 'transition-[width,opacity] duration-normal ease-default',
}

export const transitions = {
  default: 'interactive-soft',
  fast: 'transition-all duration-fast ease-default',
  slow: 'transition-all duration-slow ease-default',
  spring: 'transition-all duration-slow ease-spring',
}
