import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
    {
        variants: {
            variant: {
                default:
                    "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 border border-indigo-400/20",
                destructive:
                    "bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600 hover:shadow-rose-500/40 border border-rose-400/20",
                outline:
                    "border border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:text-white backdrop-blur-sm hover:border-slate-600",
                secondary:
                    "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700",
                ghost: "hover:bg-slate-800 hover:text-white",
                link: "text-indigo-400 underline-offset-4 hover:underline",
                glass:
                    "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-md shadow-lg shadow-black/20",
                neon:
                    "bg-slate-950 border border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:border-emerald-400 hover:bg-emerald-950/30"
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8 text-base",
                icon: "h-10 w-10",
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
    VariantProps<typeof buttonVariants> { }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
