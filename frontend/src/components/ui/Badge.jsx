import { cva } from "class-variance-authority";
import { cn } from "cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
        secondary:
          "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
        success:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        warning:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        danger:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        outline:
          "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}