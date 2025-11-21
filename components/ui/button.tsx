import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 text-sm lg:text-base font-medium",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm lg:text-base font-medium",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium",
        ghost: "hover:bg-accent hover:text-accent-foreground text-sm font-medium",
        link: "text-primary underline-offset-4 hover:underline text-sm font-medium",
      },
      size: {
        default: "h-12 px-4 py-2", // 48px - meets 44px minimum touch target
        sm: "h-11 rounded-md px-3", // 44px - minimum touch target
        lg: "h-14 rounded-md px-8", // 56px - larger for mobile primary actions
        icon: "h-12 w-12", // 48px - minimum thumb target
        fab: "h-fab w-fab", // 56px - floating action button
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }