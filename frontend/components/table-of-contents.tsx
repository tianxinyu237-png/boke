"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function useHeadings(containerId: string) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const elements = container.querySelectorAll("h2, h3");
    const items: Heading[] = [];

    elements.forEach((el, i) => {
      const id = el.id || `heading-${i}`;
      if (!el.id) el.id = id;
      items.push({
        id,
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : 3,
      });
    });

    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [containerId]);

  return { headings, activeId };
}

export function TableOfContents({
  headings,
  activeId,
}: {
  headings: Heading[];
  activeId: string;
}) {
  if (headings.length < 2) return null;

  return (
    <nav className="text-sm">
      <h4 className="text-xs font-semibold text-text-muted mb-4">目录</h4>
      <ul className="space-y-1.5 border-l border-border pl-3">
        {headings.map((h) => {
          const isActive = h.id === activeId;
          return (
            <li
              key={h.id}
              style={{ paddingLeft: h.level === 3 ? "12px" : "0" }}
            >
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={`block py-0.5 text-xs leading-relaxed transition-colors truncate ${
                  isActive
                    ? "text-accent font-medium"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
