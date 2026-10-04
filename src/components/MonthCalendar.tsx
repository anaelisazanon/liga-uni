import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CalItem = {
  id: string;
  title: string;
  start: string;
  end?: string;
  tone?: "event" | "reservation";
  sub?: string;
  description?: string;
  location?: string;
};

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MonthCalendar({
  items,
  onItemClick,
}: {
  items: CalItem[];
  onItemClick?: (id: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const today = new Date();

  const byDay = (d: number) => {
    const dayStart = new Date(year, month, d, 0, 0, 0, 0);
    const dayEnd = new Date(year, month, d, 23, 59, 59, 999);
    return items
      .filter((it) => {
        const s = new Date(it.start);
        const e = it.end ? new Date(it.end) : s;
        return s <= dayEnd && e >= dayStart;
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  };

  const daysWithItems = Array.from({ length: days }, (_, i) => i + 1)
    .map((d) => ({ day: d, list: byDay(d) }))
    .filter((entry) => entry.list.length > 0);

  return (
    <div className="rounded-xl border bg-card shadow-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date();
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
          >
            Hoje
          </Button>
        </div>
        <h3 className="text-lg font-semibold capitalize">
          {cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          <ChevronRight />
        </Button>
      </div>

      {/* Lista agrupada por dia no celular */}
      <div className="divide-y md:hidden">
        {daysWithItems.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma atividade neste mês.
          </div>
        ) : (
          daysWithItems.map(({ day, list }) => {
            const dateObj = new Date(year, month, day);
            const isToday =
              today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            return (
              <div key={day} className="p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                      isToday ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {day}
                  </span>
                  <span>{dateObj.toLocaleDateString("pt-BR", { weekday: "long" })}</span>
                </div>
                <div className="space-y-1.5">
                  {list.map((it) => (
                    <button
                      key={`${day}-${it.id}`}
                      onClick={() => onItemClick?.(it.id)}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-xs ${
                        it.tone === "reservation"
                          ? "bg-accent/30 text-accent-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <div className="font-semibold">
                        {new Date(it.start).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {it.title}
                      </div>
                      {it.sub && <div className="mt-0.5 opacity-80">{it.sub}</div>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Grade de 7 colunas em telas médias e grandes */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
          {WEEK.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const isToday =
              d &&
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === d;
            return (
              <div key={i} className="min-h-24 border-b border-r p-1.5 text-xs">
                {d && (
                  <>
                    <div
                      className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${
                        isToday ? "bg-primary text-primary-foreground" : ""
                      }`}
                    >
                      {d}
                    </div>
                    <div className="space-y-1">
                      {byDay(d).map((it) => (
                        <button
                          key={`${d}-${it.id}`}
                          onClick={() => onItemClick?.(it.id)}
                          title={`${it.title}${it.sub ? " · " + it.sub : ""}`}
                          className={`block w-full truncate rounded px-1.5 py-0.5 text-left ${
                            it.tone === "reservation"
                              ? "bg-accent/30 text-accent-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {new Date(it.start).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          {it.title}
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
    </div>
  );
}
