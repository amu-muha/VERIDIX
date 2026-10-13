import type { User, Topic, Thought, GatekeeperEvaluation, AuditLog, AdminStats } from "../types";

const API_BASE = "/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("veridix_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${response.status}`;
    const err: any = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      return request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    register: async (name: string, email: string, password: string) => {
      return request<User>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
    },
    getMe: async () => {
      return request<{ user: User }>("/auth/me");
    },
    forgotPassword: async (email: string) => {
      return request<{ message: string; token?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    resetPassword: async (token: string, newPassword: string) => {
      return request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
    },
  },

  // Topics
  topics: {
    getAll: async () => {
      return request<Topic[]>("/topics");
    },
    create: async (title: string) => {
      return request<Topic>("/topics", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
    },
  },

  // Thoughts
  thoughts: {
    getAll: async (topicId?: number) => {
      const query = topicId ? `?topicId=${topicId}` : "";
      return request<Thought[]>(`/thoughts${query}`);
    },
    create: async (topicId: number, content: string) => {
      return request<{
        statusCode: number;
        message: string;
        evaluation: GatekeeperEvaluation;
        data: Thought;
      }>("/thoughts", {
        method: "POST",
        body: JSON.stringify({ topicId, content }),
      });
    },
  },

  // Gatekeeper Test Workbench
  gatekeeper: {
    testAi: async (prompt: string) => {
      return request<{ success: boolean; evaluation: GatekeeperEvaluation }>("/test-ai", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
    },
  },

  // Admin
  admin: {
    getStats: async () => {
      return request<AdminStats>("/admin/stats");
    },
    getAuditLogs: async (decision?: string, riskLevel?: string) => {
      const params = new URLSearchParams();
      if (decision && decision !== "ALL") params.append("decision", decision);
      if (riskLevel && riskLevel !== "ALL") params.append("riskLevel", riskLevel);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<AuditLog[]>(`/admin/audit-logs${query}`);
    },
    getTopics: async () => {
      return request<Topic[]>("/admin/topics");
    },
    createTopic: async (title: string) => {
      return request<Topic>("/admin/topics", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
    },
    deleteTopic: async (id: number) => {
      return request<{ message: string; topic: Topic }>(`/admin/topics/${id}`, {
        method: "DELETE",
      });
    },
    getThoughts: async () => {
      return request<Thought[]>("/admin/thoughts");
    },
    deleteThought: async (id: number) => {
      return request<{ message: string; thought: Thought }>(`/admin/thoughts/${id}`, {
        method: "DELETE",
      });
    },
  },
};
