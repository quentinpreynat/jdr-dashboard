import { useState, type ReactNode } from "react";

interface SceneEditorAccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function SceneEditorAccordion({
  title,
  defaultOpen = false,
  children,
}: SceneEditorAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);

  return (
    <section className="space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex min-h-11 w-full cursor-pointer items-center justify-between rounded-md border border-stone-300 px-4 py-3 text-left font-serif tracking-wide text-stone-800 transition-colors duration-200 hover:bg-stone-300/40 ${
          isOpen ? "bg-stone-200/60" : "bg-stone-100"
        }`}
        aria-expanded={isOpen}
      >
        <span className="text-xs uppercase text-stone-900">{title}</span>
        <span
          className={`text-xs text-stone-700 transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
          aria-hidden="true"
        >
          &gt;
        </span>
      </button>
      <div
        className={`grid transition-all duration-200 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-70"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-md border border-stone-300 bg-stone-100/80 px-4 py-3">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
