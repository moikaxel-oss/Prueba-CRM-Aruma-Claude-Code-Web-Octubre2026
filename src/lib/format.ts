const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const formatMoney = (n: number) => money.format(n);

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

export function timeAgo(iso: string): string {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  const abs = Math.abs(mins);
  if (abs < 60) return rtf.format(mins, "minute");
  if (abs < 60 * 24) return rtf.format(Math.round(mins / 60), "hour");
  return rtf.format(Math.round(mins / 1440), "day");
}
