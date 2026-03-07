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
        className={`flex w-full cursor-pointer items-center justify-between rounded-[4px] border border-[#c9962a] px-4 py-[0.6rem] text-left font-cinzel text-[0.75rem] tracking-[0.08em] text-[#2c1a08] transition-colors duration-200 hover:bg-[#d4b87a] ${
          isOpen ? "bg-[#d4b87a]" : "bg-[#e8d5a3]"
        }`}
        aria-expanded={isOpen}
      >
        <span className="uppercase">{title}</span>
        <span
          className={`text-[#2c1a08] transition-transform duration-200 ${
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
          <div className="rounded-[6px] border border-[#c9962a] bg-[#faf3e0] px-4 py-3">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
