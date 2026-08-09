import { cn } from "@/lib/utils";

type EduflowLogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
};

/** Official EduFlow mark from /icon.svg */
export function EduflowLogo({
  size = 40,
  className,
  showWordmark = false,
}: EduflowLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.svg"
        alt="EduFlow"
        width={size}
        height={size}
        className="rounded-lg"
      />
      {showWordmark && (
        <span className="text-sm font-bold tracking-[0.2em] text-[#0db8a6]">
          EDUFLOW
        </span>
      )}
    </span>
  );
}
