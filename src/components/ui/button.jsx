import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2d8cff] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded bg-[#2d2d2d] text-[#888] border border-[#3d3d3d] hover:bg-[#3d3d3d] hover:text-[#2d8cff] hover:border-[#2d8cff]",
        primary: "rounded bg-[#2d8cff] text-white hover:bg-[#1a73e8]",
        active:
          "rounded-none bg-[rgba(45,140,255,0.15)] text-[#2d8cff] border border-[#2d8cff] hover:bg-[#2d8cff] hover:text-white",
        ghost: "rounded text-white hover:bg-[#2d2d2d] hover:text-[#2d8cff]",
        outline:
          "rounded border border-[#3d3d3d] bg-transparent hover:bg-[#2d2d2d] text-white",
        secondary: "rounded bg-[#3d3d3d] text-white hover:bg-[#4d4d4d]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
