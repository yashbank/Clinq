import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden rounded-md bg-muted/35',
        "after:pointer-events-none after:absolute after:inset-0 after:translate-x-[-100%] after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-foreground/6 after:to-transparent after:content-['']",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
