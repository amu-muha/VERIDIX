import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Navbar } from "./components/Navbar";
import { AuthModal } from "./components/AuthModal";
import { ThoughtFeed } from "./components/ThoughtFeed";
import { GatekeeperPlayground } from "./components/GatekeeperPlayground";
import { AdminDashboard } from "./components/AdminDashboard";
import { Shield, Cpu, Database, Sparkles } from "lucide-react";

function MainContent() {
  const [currentTab, setCurrentTab] = useState<"feed" | "playground" | "admin">("feed");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === "feed" && (
          <ThoughtFeed openAuthModal={() => setAuthModalOpen(true)} />
        )}

        {currentTab === "playground" && (
          <GatekeeperPlayground />
        )}

        {currentTab === "admin" && (
          <AdminDashboard />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Modern Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300 font-mono">VERIDIX Platform</span>
            <span>— AI-Driven Gatekeeping Sentinel</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px] font-mono">
            <span className="flex items-center space-x-1.5 text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>PostgreSQL + Prisma</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gemini 2.5 Flash</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Fastify 5</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
