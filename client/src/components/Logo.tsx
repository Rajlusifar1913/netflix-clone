import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className = "", href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      to={href}
      aria-label="Streamly home"
      className={cn(
        "text-[1.65rem] font-black tracking-[-0.08em] text-[#e50914] sm:text-[2rem]",
        className
      )}
    >
      STREAMLY
    </Link>
  );
}
