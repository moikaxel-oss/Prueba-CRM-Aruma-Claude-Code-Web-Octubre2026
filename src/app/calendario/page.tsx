import { AuthGate } from "@/components/AuthGate";
import { CalendarApp } from "@/components/calendar/CalendarApp";

export default function CalendarPage() {
  return (
    <AuthGate>
      <CalendarApp />
    </AuthGate>
  );
}
