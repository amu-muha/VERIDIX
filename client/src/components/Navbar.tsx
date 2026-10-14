import { Shield, ShieldCheck, Terminal, LayoutDashboard, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  currentTab: "feed" | "playground" | "admin";
  setCurrentTab: (tab: "feed" | "playground" | "admin") => void;
  openAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openAuthModal }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab("feed")}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
            <Shield className="w-6 h-6 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-100 font-mono">VERIDIX</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">AI Sentinel Gatekeeper</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          <button
            onClick={() => setCurrentTab("feed")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentTab === "feed"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm nav-tab-active"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Feed & Thoughts</span>
          </button>

          <button
            onClick={() => setCurrentTab("playground")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentTab === "playground"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm nav-tab-active"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>AI Playground</span>
          </button>

          {user?.role?.toLowerCase() === "admin" && (
            <button
              onClick={() => setCurrentTab("admin")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentTab === "admin"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Telemetry</span>
            </button>
          )}
        </nav>

        {/* User / Authentication Actions + Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.name || user.email.split("@")[0]}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono uppercase leading-tight">
                    {user.role}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
