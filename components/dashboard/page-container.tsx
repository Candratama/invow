import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Width preset. Default 4xl matches PageHeader for visual alignment. */
  width?: "4xl" | "6xl" | "7xl";
}

const WIDTH_CLASS = {
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
} as const;

/**
 * Consistent content container for dashboard pages.
 * Pairs with PageHeader to keep horizontal alignment consistent.
 */
export function PageContainer({
  children,
  className,
  width = "4xl",
}: PageContainerProps) {
  return (
    <div className={cn(WIDTH_CLASS[width], "mx-auto px-4 lg:px-6", className)}>
      {children}
    </div>
  );
}
