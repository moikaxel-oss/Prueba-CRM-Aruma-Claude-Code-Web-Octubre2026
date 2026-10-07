import { AuthGate } from "@/components/AuthGate";
import { Sidebar } from "@/components/Sidebar";
import { Board } from "@/components/Board";

export default function Home() {
  return (
    <AuthGate>
      <div className="flex h-screen gap-4 p-4">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <Board />
        </main>
      </div>
    </AuthGate>
  );
}
