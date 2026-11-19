import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackToGamesButtonProps {
  href?: string;
  label?: string;
  className?: string;
  iconSize?: number;
  onClick?: () => void;
}

const defaultClassName =
  "mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-x-1 hover:border-blue-200 hover:text-blue-700";

export default function BackToGamesButton({
  href = "/games",
  label = "Quay lại",
  className,
  iconSize = 17,
  onClick,
}: BackToGamesButtonProps) {
  const classes = className ?? defaultClassName;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        <ArrowLeft size={iconSize} />
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={classes}>
      <ArrowLeft size={iconSize} />
      {label}
    </Link>
  );
}
