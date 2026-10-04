import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CalItem = { id: string; title: string; start: string; tone?: "event" | "reservation"; sub?: string };

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MonthCalendar({ items, onItemClick }: { items: CalItem[]; onItemClick?: (id: string) => void }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const today = new Date();

  const byDay = (d: number) =>
    items
      .filter((it) => {
        const s = new Date(it.start);
        return s.getFullYear() === year && s.getMonth() === month && s.getDate() === d;
      })
      .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="rounded-xl border bg-card shadow-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          <ChevronLeft />
        </Button>
        <h3 className="text-lg font-semibold capitalize">
          {cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
        {WEEK.map((w) => (
          <div key={w} className="py-2">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const isToday = d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
          return (
            <div key={i} className="min-h-24 border-b border-r p-1.5 text-xs">
              {d && (
                <>
                  <div className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                    {d}
                  </div>
                  <div className="space-y-1">
                    {byDay(d).map((it) => (
                      <button
                        key={it.id}
                        onClick={() => onItemClick?.(it.id)}
                        title={`${it.title}${it.sub ? " · " + it.sub : ""}`}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left ${
                          it.tone === "reservation" ? "bg-accent/30 text-accent-foreground" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {new Date(it.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} {it.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
