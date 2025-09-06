// frontend/src/services/__tests__/moderationApi.test.ts
// Unit tests for moderation API service
import { moderationApi } from "../moderationApi";
import type {
  ViolationCreate,
  ViolationUpdate,
  BulkUserOperation,
  AdminUserUpdate,
} from "../../types/moderation";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

// Mock localStorage for token storage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe("ModerationApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue("mock-jwt-token");
  });

  // Helper function to create mock response
  const createMockResponse = (data: any, status: number = 200) => {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    } as Response);
  };

  describe("Authentication", () => {
    it("includes authorization header when token exists", async () => {
      const mockUserData = { id: 1, name: "Test User" };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockUserData));

      await moderationApi.getUser(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/1"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-token",
          }),
        })
      );
    });

    it("works without token when not available", async () => {
      localStorageMock.getItem.mockReturnValue(null);
      const mockUserData = { id: 1, name: "Test User" };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockUserData));

      await moderationApi.getUser(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/1"),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
    });
  });

  describe("User Management", () => {
    it("gets user details successfully", async () => {
      const mockUser = {
        id: 123,
        name: "Test User",
        email: "test@example.com",
        status: "active",
        violations: [],
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockUser));

      const result = await moderationApi.getUser(123);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/123"),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result).toEqual(mockUser);
    });

    it("updates user successfully", async () => {
      const updateData: AdminUserUpdate = {
        name: "Updated Name",
        email: "updated@example.com",
        status: "suspended",
      };

      const mockUpdatedUser = { id: 123, ...updateData };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockUpdatedUser));

      const result = await moderationApi.updateUser(123, updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/123"),
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it("handles user not found error", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: "User not found" }, 404)
      );

      await expect(moderationApi.getUser(999)).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("Violation Management", () => {
    it("gets user violations successfully", async () => {
      const mockViolations = {
        items: [
          {
            id: 1,
            user_id: 123,
            type: "warning",
            reason: "Test violation",
            status: "active",
          },
        ],
        total: 1,
        page: 1,
        limit: 25,
        total_pages: 1,
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockViolations));

      const result = await moderationApi.getUserViolations(123);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/admin/users/123/violations?page=1&limit=25"
        ),
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockViolations);
    });

    it("gets violations with filters", async () => {
      const mockViolations = {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        total_pages: 0,
      };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockViolations));

      await moderationApi.getUserViolations(123, {
        status: "active",
        page: 2,
        limit: 10,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=active&page=2&limit=10"),
        expect.anything()
      );
    });

    it("creates violation successfully", async () => {
      const violationData: ViolationCreate = {
        type: "warning",
        reason: "Test violation",
        notes: "Test notes",
        created_by: 1,
      };

      const mockCreatedViolation = {
        id: 1,
        user_id: 123,
        ...violationData,
        created_at: "2024-01-15T10:00:00Z",
        status: "active",
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockCreatedViolation));

      const result = await moderationApi.createViolation(123, violationData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/123/violations"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(violationData),
        })
      );
      expect(result).toEqual(mockCreatedViolation);
    });

    it("updates violation successfully", async () => {
      const updateData: ViolationUpdate = {
        reason: "Updated reason",
        status: "resolved",
      };

      const mockUpdatedViolation = {
        id: 1,
        user_id: 123,
        type: "warning",
        reason: "Updated reason",
        status: "resolved",
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockUpdatedViolation));

      const result = await moderationApi.updateViolation(123, 1, updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/123/violations/1"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(mockUpdatedViolation);
    });

    it("deletes violation successfully", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: "Violation deleted successfully" })
      );

      await moderationApi.deleteViolation(123, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/123/violations/1"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("Bulk Operations", () => {
    it("performs bulk user operation successfully", async () => {
      const bulkOperation: BulkUserOperation = {
        action: "suspend",
        user_ids: [1, 2, 3],
        params: { reason: "Bulk test" },
      };

      const mockResult = {
        results: {
          "1": {
            status: "ok" as const,
            message: "User suspended successfully",
          },
          "2": {
            status: "ok" as const,
            message: "User suspended successfully",
          },
          "3": { status: "failed" as const, message: "User not found" },
        },
        summary: {
          total: 3,
          success_count: 2,
          error_count: 1,
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResult));

      const result = await moderationApi.bulkUserOperation(bulkOperation);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/bulk"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(bulkOperation),
        })
      );
      expect(result).toEqual(mockResult);
    });

    it("handles bulk operation with all failures", async () => {
      const bulkOperation: BulkUserOperation = {
        action: "ban",
        user_ids: [999],
        params: { reason: "Test ban" },
      };

      const mockResult = {
        results: {
          "999": { status: "failed" as const, message: "User not found" },
        },
        summary: {
          total: 1,
          success_count: 0,
          error_count: 1,
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResult));

      const result = await moderationApi.bulkUserOperation(bulkOperation);
      expect(result.summary.error_count).toBe(1);
      expect(result.summary.success_count).toBe(0);
    });
  });

  describe("Reports Management", () => {
    it("gets reports successfully", async () => {
      const mockReports = [
        {
          id: 1,
          reporter_id: 10,
          reported_user_id: 20,
          type: "harassment",
          description: "Test report",
          status: "open",
          created_at: "2024-01-15T10:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce(createMockResponse(mockReports));

      const result = await moderationApi.getReports();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/reports"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockReports);
    });

    it("gets reports with status filter", async () => {
      const mockReports = [];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockReports));

      await moderationApi.getReports("open");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=open"),
        expect.anything()
      );
    });

    it("updates report successfully", async () => {
      const mockUpdatedReport = {
        id: 1,
        status: "dismissed",
        resolution_notes: "Test dismissal",
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockUpdatedReport));

      const result = await moderationApi.updateReport(1, "dismiss", {
        notes: "Test dismissal",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/reports/1?action=dismiss"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ notes: "Test dismissal" }),
        })
      );
      expect(result).toEqual(mockUpdatedReport);
    });
  });

  describe("Moderation Logs", () => {
    it("gets moderation logs successfully", async () => {
      const mockLogs = {
        logs: [
          {
            id: 1,
            actor_id: 1,
            target_user_id: 123,
            action: "violation_created",
            details: { violation_type: "warning" },
            created_at: "2024-01-15T10:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 25,
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockLogs));

      const result = await moderationApi.getModerationLogs();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/moderation/logs?page=1&limit=25"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockLogs);
    });

    it("gets logs with filters", async () => {
      const mockLogs = { logs: [], total: 0, page: 1, limit: 25 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockLogs));

      await moderationApi.getModerationLogs({
        page: 2,
        limit: 10,
        actor_id: 1,
        target_user_id: 123,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "page=2&limit=10&actor_id=1&target_user_id=123"
        ),
        expect.anything()
      );
    });
  });

  describe("Error Handling", () => {
    it("throws error on HTTP 400 response", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: "Bad request" }, 400)
      );

      await expect(moderationApi.getUser(123)).rejects.toThrow("Bad request");
    });

    it("throws error on HTTP 500 response", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: "Internal server error" }, 500)
      );

      await expect(moderationApi.getUser(123)).rejects.toThrow(
        "Internal server error"
      );
    });

    it("handles network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(moderationApi.getUser(123)).rejects.toThrow("Network error");
    });

    it("handles malformed JSON response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Invalid JSON")),
        text: () => Promise.resolve("Invalid JSON response"),
      } as Response);

      await expect(moderationApi.getUser(123)).rejects.toThrow("Invalid JSON");
    });

    it("provides generic error message when detail is missing", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 404));

      await expect(moderationApi.getUser(123)).rejects.toThrow(
        "Request failed with status 404"
      );
    });
  });

  describe("Request Configuration", () => {
    it("sets correct content type for POST requests", async () => {
      const violationData: ViolationCreate = {
        type: "warning",
        reason: "Test",
        notes: "Notes",
        created_by: 1,
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await moderationApi.createViolation(123, violationData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("constructs URLs correctly", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await moderationApi.getUser(123);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/admin\/users\/123$/),
        expect.anything()
      );
    });

    it("handles query parameters correctly", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ logs: [], total: 0, page: 1, limit: 25 })
      );

      await moderationApi.getModerationLogs({
        page: 2,
        limit: 50,
        actor_id: 1,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2&limit=50&actor_id=1"),
        expect.anything()
      );
    });
  });
});
