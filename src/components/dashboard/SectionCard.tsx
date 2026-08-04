
import type { CSSProperties, ReactNode } from "react";

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function SectionCard({ children, className = '', style }: SectionCardProps) {
  return (
    <div className={`section-card ${className}`} style={style}>
      {children}
    </div>
  );
}
