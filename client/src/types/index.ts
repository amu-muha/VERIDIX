export interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
}

export interface Topic {
  id: number;
  title: string;
  createdAt: string;
  _count?: {
    thoughts: number;
  };
}

export interface Thought {
  id: number;
  content: string;
  score: number | null;
  category: string | null;
  flagged: boolean;
  userId: number;
  topicId: number;
  createdAt: string;
  user?: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  };
  topic?: {
    id: number;
    title: string;
  };
}

export interface GatekeeperEvaluation {
  decision: "SAFE" | "BLOCK";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskScore: number;
  category: string;
  reason: string;
  engineUsed?: "gemini" | "openai" | "heuristic";
}

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  inputContent: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskScore: number;
  decision: "SAFE" | "BLOCK";
  category: string | null;
  reason: string | null;
  ipAddress: string | null;
  timestamp: string;
  user?: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  };
}

export interface AdminStats {
  totalVerifications: number;
  approvedCount: number;
  blockedCount: number;
  approvalRate: number;
  blockRate: number;
  totalThoughts: number;
  totalUsers: number;
  totalTopics: number;
  topViolations: Array<{ category: string; count: number }>;
}
