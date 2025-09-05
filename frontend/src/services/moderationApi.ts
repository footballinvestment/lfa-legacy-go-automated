// frontend/src/services/moderationApi.ts
// API service for moderation endpoints

import {
  AdminUser,
  Violation,
  ViolationCreate,
  BulkUserOperation,
  BulkOperationResult,
  UserReport,
} from "../types/moderation";
import config from "../config/environment";

const API_BASE = config.API_URL;

// Enhanced error types for better error handling
interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

class ModerationApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("auth_token");

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // Create enhanced error object
        const error: ApiError = new Error(
          errorData?.detail ||
            this.getStatusErrorMessage(response.status) ||
            `HTTP ${response.status}: ${response.statusText}`
        );

        error.status = response.status;
        error.code = errorData?.code;
        error.details = errorData;

        // Log error for debugging
        console.error(`API Error [${response.status}] ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
          endpoint,
          method: options.method || "GET",
        });

        throw error;
      }

      return response.json();
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkError: ApiError = new Error(
          "Network error: Please check your internet connection and try again."
        );
        networkError.code = "NETWORK_ERROR";
        throw networkError;
      }

      // Re-throw API errors
      throw error;
    }
  }

  private getStatusErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return "Bad request: Please check your input and try again.";
      case 401:
        return "Unauthorized: Please log in again.";
      case 403:
        return "Forbidden: You do not have permission to perform this action.";
      case 404:
        return "Not found: The requested resource could not be found.";
      case 409:
        return "Conflict: This operation conflicts with existing data.";
      case 422:
        return "Validation error: Please check your input data.";
      case 429:
        return "Too many requests: Please wait and try again.";
      case 500:
        return "Server error: Something went wrong on our end.";
      case 503:
        return "Service unavailable: The server is temporarily unavailable.";
      default:
        return `Request failed with status ${status}`;
    }
  }

  // User management
  async getUser(userId: number): Promise<AdminUser> {
    try {
      return await this.request<AdminUser>(`/api/admin/users/${userId}`);
    } catch (error) {
      console.error(`Failed to get user ${userId}:`, error);
      throw error;
    }
  }

  async updateUser(
    userId: number,
    updates: Partial<AdminUser>
  ): Promise<AdminUser> {
    return this.request<AdminUser>(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";

    return this.request<{
      users: AdminUser[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/admin/users${queryString ? `?${queryString}` : ""}`);
  }

  // Violation management
  async getUserViolations(userId: number): Promise<Violation[]> {
    return this.request<Violation[]>(`/api/admin/users/${userId}/violations`);
  }

  async addViolation(
    userId: number,
    violation: ViolationCreate
  ): Promise<Violation> {
    try {
      return await this.request<Violation>(
        `/api/admin/users/${userId}/violations`,
        {
          method: "POST",
          body: JSON.stringify(violation),
        }
      );
    } catch (error) {
      console.error(`Failed to add violation for user ${userId}:`, error);
      throw error;
    }
  }

  async updateViolation(
    userId: number,
    violationId: number,
    updates: Partial<Violation>
  ): Promise<Violation> {
    return this.request<Violation>(
      `/api/admin/users/${userId}/violations/${violationId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      }
    );
  }

  async deleteViolation(userId: number, violationId: number): Promise<void> {
    return this.request<void>(
      `/api/admin/users/${userId}/violations/${violationId}`,
      { method: "DELETE" }
    );
  }

  // Bulk operations
  async bulkUserOperation(
    operation: BulkUserOperation
  ): Promise<BulkOperationResult> {
    return this.request<BulkOperationResult>("/api/admin/users/bulk", {
      method: "POST",
      body: JSON.stringify(operation),
    });
  }

  // Moderation logs
  async getModerationLogs(params?: {
    page?: number;
    limit?: number;
    actor_id?: number;
    target_user_id?: number;
  }): Promise<{
    logs: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";

    return this.request<{
      logs: any[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/admin/moderation/logs${queryString ? `?${queryString}` : ""}`);
  }

  // Reports
  async getReports(status?: string): Promise<UserReport[]> {
    const queryString = status ? `?status=${status}` : "";
    return this.request<UserReport[]>(`/api/admin/reports${queryString}`);
  }

  async updateReport(
    reportId: number,
    action: "dismiss" | "create_violation" | "escalate",
    data?: any
  ): Promise<UserReport> {
    return this.request<UserReport>(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, ...data }),
    });
  }
}

export const moderationApi = new ModerationApiService();
