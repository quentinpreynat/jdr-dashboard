import type { ChoiceIntent } from "../models";

export interface ChoiceIconProps {
  intent?: ChoiceIntent;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ChoiceIcon({
  intent,
  size = 18,
  strokeWidth = 1.5,
  className = "",
}: ChoiceIconProps) {
  const resolved: ChoiceIntent = intent ?? "other";
  const svgClassName = `opacity-80 ${className}`.trim();
  const commonProps = {
    width: size,
    height: size,
    className: svgClassName,
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: "false" as const,
  };

  switch (resolved) {
    case "explore":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <path d="M8 12V7a2 2 0 0 1 4 0v4" />
          <path d="M12 11V6a2 2 0 0 1 4 0v6" />
          <path d="M16 12.5V8.5a2 2 0 0 1 4 0V14" />
          <path d="M8 12a5 5 0 0 0 5 5h2.5a4.5 4.5 0 0 0 4.5-4.5V14" />
        </svg>
      );
    case "move":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <path d="M7 5c1.8 0 3 1.2 3 3s-1.2 3-3 3-3-1.2-3-3 1.2-3 3-3Z" />
          <path d="M17 13c1.8 0 3 1.2 3 3s-1.2 3-3 3-3-1.2-3-3 1.2-3 3-3Z" />
          <path d="M10 10c2.5 0 4.5 1.2 6 3" />
        </svg>
      );
    case "talk":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <path d="M5 7a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v5a5 5 0 0 1-5 5H10l-4 3v-3a5 5 0 0 1-1-3V7Z" />
          <path d="M9 9h6" />
          <path d="M9 12h4" />
        </svg>
      );
    case "attack":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <path d="M14 4l6 6" />
          <path d="M8 10l6-6" />
          <path d="M3 21l7-7" />
          <path d="M10 14l4 4" />
          <path d="M12 12l8-8" />
        </svg>
      );
    case "other":
    default:
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M8 12h8" />
        </svg>
      );
  }
}
