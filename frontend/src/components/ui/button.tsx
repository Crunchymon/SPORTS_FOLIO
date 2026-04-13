import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
}

export const buttonVariants = ({ 
  variant = "default", 
  size = "default", 
  className 
}: { 
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link", 
  size?: "default" | "sm" | "lg" | "icon", 
  className?: string 
} = {}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95"
  
  const variants = {
    default: "bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-600/20 hover:-translate-y-0.5",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 hover:-translate-y-0.5",
    outline: "border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 shadow-sm",
    secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100",
    ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-600",
    link: "text-primary-600 underline-offset-4 hover:underline"
  }

  const sizes = {
    default: "h-11 px-5 py-2",
    sm: "h-9 px-4",
    lg: "h-12 px-8 text-base",
    icon: "h-11 w-11",
  }

  return cn(baseStyles, variants[variant], sizes[size], className)
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
