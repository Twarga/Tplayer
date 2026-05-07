export const animations = {
  pageEnter: 'animate-in fade-in slide-in-from-bottom-2 duration-200',
  pageExit: 'animate-out fade-out slide-out-to-top-2 duration-200',
  cardHover: 'transition-all duration-200 ease-default hover:scale-[1.02] hover:shadow-lg',
  buttonPress: 'transition-transform duration-150 active:scale-[0.97]',
  progressThumb: 'transition-all duration-150 group-hover:opacity-100',
}

export const transitions = {
  default: 'transition-all duration-200 ease-default',
  fast: 'transition-all duration-150 ease-default',
  slow: 'transition-all duration-300 ease-default',
  spring: 'transition-all duration-300 ease-spring',
}