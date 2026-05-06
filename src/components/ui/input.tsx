import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'min-h-10 w-full min-w-0 rounded-md border border-border bg-[var(--control-bg)] px-4 py-2.5 text-sm text-foreground shadow-none outline-none transition-[color,box-shadow,background-color,border-color] duration-200',
        'placeholder:text-muted-foreground',
        'selection:bg-primary/30 selection:text-foreground',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/25',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
