import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Plus, RefreshCw, Send, CheckCircle2, Layers } from "lucide-react";
import { api } from "../services/api";
import type { Topic, Thought } from "../types";
import { useAuth } from "../context/AuthContext";

interface ThoughtFeedProps {
  openAuthModal: () => void;
}

export const ThoughtFeed: React.FC<ThoughtFeedProps> = ({ openAuthModal }) => {
  const { user } = useAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New Thought form
  const [content, setContent] = useState("");
  const [targetTopicId, setTargetTopicId] = useState<number | undefined>(undefined);

  // Feedback notifications
  const [blockError, setBlockError] = useState<{ message: string; reason: string; auditId?: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedTopics, fetchedThoughts] = await Promise.all([
        api.topics.getAll(),
        api.thoughts.getAll(selectedTopicId),
      ]);
      setTopics(fetchedTopics);
      setThoughts(fetchedThoughts);
      if (fetchedTopics.length > 0 && targetTopicId === undefined) {
        setTargetTopicId(fetchedTopics[0].id);
      }
    } catch (err) {
      console.error("Failed to load feed data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTopicId]);

  const handleSubmitThought = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    if (!content.trim() || !targetTopicId) return;

    setSubmitting(true);
    setBlockError(null);
    setSuccessMessage(null);

    try {
      const res = await api.thoughts.create(targetTopicId, content);
      setSuccessMessage("Approved! Your thought has been verified and posted.");
      setContent("");
      // Prepend to thoughts
      setThoughts([res.data, ...thoughts]);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      if (err.status === 403) {
        setBlockError({
          message: err.data?.message || "Blocked by VERIDIX AI Gatekeeper",
          reason: err.data?.evaluation?.reason || err.data?.reason || "Policy violation detected.",
          auditId: err.data?.auditId,
        });
      } else {
        setBlockError({
          message: "Submission failed",
          reason: err.message || "An unexpected error occurred.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Feed Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Verified Thoughts</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              🛡️ Gatekeeper Enforced
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Incoming payloads pass through real-time adversarial evaluation before storage.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-center flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Submission Panel */}
      <div className="glass-panel-glow rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Plus className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Post a Protected Thought</h2>
        </div>

        {/* Feedback Alerts */}
        {blockError && (
          <div className="mb-4 p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs space-y-1 animate-fade-in">
            <div className="flex items-center space-x-2 font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{blockError.message}</span>
            </div>
            <p className="pl-6 text-rose-300/90 leading-relaxed font-sans">{blockError.reason}</p>
            {blockError.auditId && (
              <div className="pl-6 text-[11px] font-mono text-rose-400/80 pt-1">
                Audit Record ID: #{blockError.auditId} (Incident logged for compliance review)
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitThought} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Topic</label>
              <select
                value={targetTopicId || ""}
                onChange={(e) => setTargetTopicId(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Content Payload (Evaluated by AI Gatekeeper)
              </label>
              <textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share technical insights, queries, or test benign/adversarial payloads..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-y"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-tier filtering active: Delimiter isolation, prompt injection screening</span>
            </div>

            {user ? (
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit via Gatekeeper</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 hover:bg-cyan-900/60 transition cursor-pointer"
              >
                <span>Sign In to Post</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Topic Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedTopicId(undefined)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
            selectedTopicId === undefined
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          All Topics ({thoughts.length})
        </button>

        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopicId(topic.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              selectedTopicId === topic.id
                ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {topic.title}
          </button>
        ))}
      </div>

      {/* Thoughts Feed List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <p className="text-sm text-slate-400">Loading verified thought feed...</p>
        </div>
      ) : thoughts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3 border border-slate-800">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No thoughts found in this topic</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first to submit a verified thought using the form above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {thoughts.map((thought) => (
            <div
              key={thought.id}
              className="glass-panel hover:border-slate-700/80 rounded-2xl p-5 border border-slate-800/80 transition shadow-lg group"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                    {thought.user?.name ? thought.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-200">
                        {thought.user?.name || thought.user?.email || "Anonymous"}
                      </span>
                      {thought.user?.role?.toLowerCase() === "admin" && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(thought.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                    {thought.topic?.title || "Topic"}
                  </span>
                  <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              {/* Thought Content */}
              <p className="text-sm text-slate-200 leading-relaxed font-sans">{thought.content}</p>

              {/* Card Footer */}
              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">Category: {thought.category || "General"}</span>
                <span className="font-mono">Safety Score: {thought.score ? `${thought.score}/5` : "5/5"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
