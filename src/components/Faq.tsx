"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaQuestion } from "react-icons/fa";
import type { FaqItem } from "@/lib/faq";
import { cardCls } from "@/lib/ui";

export function FaqList({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (index: number) => setOpenIndex((current) => (current === index ? null : index));

  return (
    <section className={cardCls}>
      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          const panelId = `faq-panel-${i}`;
          const buttonId = `faq-button-${i}`;
          return (
            <div key={i} className="overflow-hidden border border-white/10 rounded-xl">
              <button
                type="button"
                id={buttonId}
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-zinc-200 hover:bg-white/5 transition focus:outline-none focus:ring-2 focus:ring-brand"
                onClick={() => toggle(i)}
              >
                <FaQuestion className="shrink-0 text-brand" />
                <span>{item.question}</span>
                {isOpen ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
              </button>
              <div
                id={panelId}
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="border-t border-white/5 px-4 pb-4 text-sm text-zinc-300 leading-relaxed"
              >
                {item.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
