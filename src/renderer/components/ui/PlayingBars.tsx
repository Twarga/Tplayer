export function PlayingBars() {
  return (
    <div className="flex items-end justify-between w-3 h-3 gap-[1px]">
      <div className="w-[3px] bg-accent rounded-sm animate-playing-bar" style={{ animationDelay: '0s', animationDuration: '0.8s' }} />
      <div className="w-[3px] bg-accent rounded-sm animate-playing-bar" style={{ animationDelay: '0.2s', animationDuration: '0.9s' }} />
      <div className="w-[3px] bg-accent rounded-sm animate-playing-bar" style={{ animationDelay: '0.4s', animationDuration: '0.7s' }} />
    </div>
  )
}
