import React, { useState, useEffect } from "react";
import { LayoutDashboard, ShieldAlert, ShieldCheck, Activity, Users, Trash2, Plus, RefreshCw, Search } from "lucide-react";
import { api } from "../services/api";
import type { AdminStats, AuditLog, Topic, Thought } from "../types";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);

  // Active admin tab
  const [activeTab, setActiveTab] = useState<"logs" | "topics" | "thoughts">("logs");

  // Filters
  const [decisionFilter, setDecisionFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // New Topic Form
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [fetchedStats, fetchedLogs, fetchedTopics, fetchedThoughts] = await Promise.all([
        api.admin.getStats(),
        api.admin.getAuditLogs(decisionFilter, riskFilter),
        api.admin.getTopics(),
        api.admin.getThoughts(),
      ]);
      setStats(fetchedStats);
      setLogs(fetchedLogs);
      setTopics(fetchedTopics);
      setThoughts(fetchedThoughts);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [decisionFilter, riskFilter]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    setCreatingTopic(true);
    setActionMessage(null);
    try {
      const created = await api.admin.createTopic(newTopicTitle.trim());
      setTopics([created, ...topics]);
      setNewTopicTitle("");
      setActionMessage(`Topic "${created.title}" created successfully!`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to create topic");
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleDeleteTopic = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete topic "${title}" and all its thoughts?`)) return;

    try {
      await api.admin.deleteTopic(id);
      setTopics(topics.filter((t) => t.id !== id));
      setActionMessage(`Topic "${title}" deleted.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete topic");
    }
  };

  const handleDeleteThought = async (id: number) => {
    if (!confirm("Are you sure you want to delete this thought?")) return;

    try {
      await api.admin.deleteThought(id);
      setThoughts(thoughts.filter((t) => t.id !== id));
      setActionMessage("Thought removed successfully.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete thought");
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.inputContent.toLowerCase().includes(query) ||
      (log.reason && log.reason.toLowerCase().includes(query)) ||
      (log.category && log.category.toLowerCase().includes(query)) ||
      (log.user?.email && log.user.email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <LayoutDashboard className="w-6 h-6 text-purple-400" />
            <span>Admin Telemetry & Governance Portal</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            System-wide gatekeeper telemetry, immutable audit trails, and content control.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="self-start sm:self-center flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs flex items-center space-x-2 animate-fade-in">
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Verifications */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Evaluations</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black font-mono text-white mt-2">
              {stats.totalVerifications}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Across all API endpoints</div>
          </div>

          {/* Safe Approvals */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Approved (Safe)</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
              {stats.approvedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Approval Rate: <span className="font-semibold text-emerald-400">{stats.approvalRate}%</span>
            </div>
          </div>

          {/* Blocked Attacks */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Blocked Attacks</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black font-mono text-rose-400 mt-2">
              {stats.blockedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Block Rate: <span className="font-semibold text-rose-400">{stats.blockRate}%</span>
            </div>
          </div>

          {/* System Scale */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Platform Scale</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline space-x-3 mt-2">
              <span className="text-2xl font-bold font-mono text-white">{stats.totalThoughts}</span>
              <span className="text-xs text-slate-400">thoughts /</span>
              <span className="text-2xl font-bold font-mono text-white">{stats.totalTopics}</span>
              <span className="text-xs text-slate-400">topics</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.totalUsers} registered users
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === "logs"
              ? "border-purple-400 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Audit Log Trail ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab("topics")}
          className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === "topics"
              ? "border-purple-400 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Topic Governance ({topics.length})
        </button>
        <button
          onClick={() => setActiveTab("thoughts")}
          className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === "thoughts"
              ? "border-purple-400 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Content Moderation ({thoughts.length})
        </button>
      </div>

      {/* Tab 1: Audit Log Trail */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Controls: Decision Filter, Risk Filter, Search */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium">Filter Decision:</span>
              <select
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Decisions</option>
                <option value="SAFE">SAFE (Approved)</option>
                <option value="BLOCK">BLOCK (Intercepted)</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Input Snippet</th>
                    <th className="py-3 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No audit records match current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              log.decision === "SAFE"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {log.decision}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                          <span
                            className={
                              log.riskLevel === "HIGH"
                                ? "text-rose-400 font-bold"
                                : log.riskLevel === "MEDIUM"
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }
                          >
                            {log.riskLevel} ({log.riskScore})
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-cyan-300">
                          {log.category || "-"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                          {log.user?.email || "Guest/Anonymous"}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-200 font-mono text-[11px]">
                          {log.inputContent}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-400 text-[11px]">
                          {log.reason || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Topic Governance */}
      {activeTab === "topics" && (
        <div className="space-y-6">
          {/* Create Topic Form */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Create New Discussion Topic</span>
            </h3>
            <form onSubmit={handleCreateTopic} className="flex gap-3">
              <input
                type="text"
                required
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="Topic Title (e.g. LLM Red Teaming & Jailbreak Defense)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={creatingTopic}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                {creatingTopic ? "Creating..." : "Create Topic"}
              </button>
            </form>
          </div>

          {/* Topics List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((t) => (
              <div key={t.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-purple-400">ID #{t.id}</span>
                    <button
                      onClick={() => handleDeleteTopic(t.id, t.title)}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                      title="Delete topic"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">{t.title}</h4>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Thoughts: {t._count?.thoughts ?? 0}</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Content Moderation */}
      {activeTab === "thoughts" && (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Topic</th>
                    <th className="py-3 px-4">Content</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {thoughts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No thoughts stored in database.
                      </td>
                    </tr>
                  ) : (
                    thoughts.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">#{item.id}</td>
                        <td className="py-3 px-4 text-[11px]">
                          {item.user?.name || item.user?.email || `User #${item.userId}`}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-cyan-300">
                          {item.topic?.title || `Topic #${item.topicId}`}
                        </td>
                        <td className="py-3 px-4 max-w-md truncate text-slate-200">
                          {item.content}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">
                          {item.score || 5}/5
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteThought(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                            title="Delete Thought"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
