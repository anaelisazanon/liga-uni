import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CalItemTone =
  | "event"
  | "reservation"
  | "reuniao_uni"
  | "capacitacao"
  | "staff"
  | "oficina";

export type CalItem = {
  id: string;
  title: string;
  start: string;
  end?: string;
  sub?: string;
  location?: string;
  description?: string;
  tone?: CalItemTone;
  enrolled?: boolean;
};

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function toneClasses(tone?: CalItemTone, enrolled?: boolean): string {
  const base = enrolled ? "ring-1 ring-primary/50 font-semibold " : "";
  switch (tone) {
    case "reuniao_uni":
      return (
        base +
        "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
      );
    case "capacitacao":
      return (
        base +
        "bg-primary/15 text-primary border border-primary/25 hover:bg-primary/25"
      );
    case "staff":
      return (
        base +
        "bg-accent/25 text-accent-foreground border border-accent/40 hover:bg-accent/35"
      );
    case "oficina":
      return (
        base +
        "bg-success/15 text-success border border-success/30 hover:bg-success/25"
      );
    case "reservation":
      return (
        base +
        "bg-secondary text-secondary-foreground border border-border hover:bg-muted"
      );
    default:
      return (
        base +
        "bg-primary/12 text-primary border border-primary/20 hover:bg-primary/20"
      );
  }
}

export function MonthCalendar({
  items,
  onItemClick,
}: {
  items: CalItem[];
  onItemClick?: (id: string) => void;
}) {
  const [cur, setCur] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = cur.getFullYear();
  const month = cur.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const itemsOn = (day: number) => {
    const start = new Date(year, month, day, 0, 0, 0).getTime();
    const end = new Date(year, month, day, 23, 59, 59).getTime();
    return items.filter((it) => {
      const s = new Date(it.start).getTime();
      const e = it.end ? new Date(it.end).getTime() : s;
      return s <= end && e >= start;
    });
  };

  return (
    <div className="rounded-xl border bg-card shadow-card">
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <div className="font-display text-lg font-bold">
          {MONTHS[month]} {year}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCur(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const d = new Date();
              setCur(new Date(d.getFullYear(), d.getMonth(), 1));
            }}
          >
            Hoje
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCur(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {WEEK.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, idx) => (
          <div
            key={idx}
            className="min-h-28 border-b border-r p-1.5 text-xs last:border-r-0 [&:nth-child(7n)]:border-r-0"
          >
            {d && (
              <>
                <div
                  className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full font-medium ${
                    isToday(d) ? "bg-primary text-primary-foreground" : "text-foreground/80"
                  }`}
                >
                  {d}
                </div>
                <div className="space-y-1">
                  {itemsOn(d).map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => onItemClick?.(it.id)}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] leading-tight transition ${toneClasses(
                        it.tone,
                        it.enrolled,
                      )}`}
                      title={`${it.title}${it.sub ? ` — ${it.sub}` : ""}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {it.enrolled && <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" />}
                        <span className="font-medium">
                          {new Date(it.start).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>{" "}
                        <span className="truncate">{it.title}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
