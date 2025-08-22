// frontend/src/types/moderation.ts
// TypeScript interfaces for moderation system

export interface Violation {
  id: number;
  user_id: number;
  type: string;
  reason?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
  status: string;
}

export interface ViolationCreate {
  type: string;
  reason?: string;
  notes?: string;
  created_by: number;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  roles: string[];
  status: "active" | "suspended" | "banned" | "pending";
  created_at: string;
  last_login?: string;
  profile?: {
    bio?: string;
    location?: string;
    phone?: string;
  };
  game_stats?: {
    tournaments_played: number;
    wins: number;
    losses: number;
    win_rate: number;
    total_points: number;
    rank: number;
  };
  violations?: Violation[];
}

export interface ModerationLog {
  id: number;
  actor_id: number;
  target_user_id?: number;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface BulkUserOperation {
  action:
    | "suspend"
    | "unsuspend"
    | "add_role"
    | "remove_role"
    | "ban"
    | "unban"
    | "delete";
  user_ids: number[];
  params?: {
    role?: string;
    reason?: string;
  };
}

export interface BulkOperationResult {
  results: {
    [user_id: string]: {
      status: "ok" | "failed";
      message: string;
    };
  };
  summary: {
    total: number;
    success_count: number;
    error_count: number;
  };
}

export interface UserReport {
  id: number;
  reporter_id: number;
  reported_user_id: number;
  type: string;
  description: string;
  evidence?: string;
  status: "open" | "dismissed" | "resolved";
  assigned_to?: number;
  resolution_notes?: string;
  created_at: string;
  updated_at?: string;
}
