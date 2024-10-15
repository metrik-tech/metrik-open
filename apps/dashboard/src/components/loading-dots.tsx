import { cn } from "@/utils/cn";
import styles from "./loading-dots.module.css";

const LoadingDots = ({ className }: { className?: string }) => {
  return (
    <span className={cn(styles.loading, className)}>
      <span />
      <span />
      <span />
    </span>
  );
};

export { LoadingDots };
