import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-16 w-full rounded-md border border-[var(--control-border)] bg-[var(--control-bg)] px-3 py-2 text-sm text-foreground shadow-none outline-none transition-[color,box-shadow,background-color,border-color] duration-200',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/25',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
