import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-sky-500 text-white shadow-md hover:bg-sky-600",
        secondary: "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
        destructive: "border-transparent bg-red-500 text-white shadow-md hover:bg-red-600 destructive:bg-red-500/10 dark:text-red-500/50",
        outline: "text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800",
        success: "border-transparent bg-emerald-500 text-white shadow-md hover:bg-emerald-600",
        warning: "border-transparent bg-amber-500 text-white shadow-md hover:bg-amber-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
