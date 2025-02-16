import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StepProps {
  title: string
  children: ReactNode
  className?: string
}

export function Step({ title, children, className }: StepProps) {
  return (
    <div className={cn("mb-8 last:mb-0", className)}>
      <h3 className="font-medium text-lg mb-2">{title}</h3>
      <div className="ml-4 text-muted-foreground">{children}</div>
    </div>
  )
}

interface StepsProps {
  children: ReactNode
  className?: string
}

export function Steps({ children, className }: StepsProps) {
  return (
    <div className={cn("mt-4 relative", className)}>
      <div className="absolute left-0 top-0 h-full w-px bg-border ml-2 hidden sm:block" />
      <div className="relative">{children}</div>
    </div>
  )
} 