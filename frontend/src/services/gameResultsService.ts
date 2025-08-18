// src/services/gameResultsService.ts
// CLEAN Game Results Service - REAL API ONLY

import { apiService } from "./apiService";

export interface GameResult {
  id: number;
  game_type: string;
  opponent: {
    id: number;
    username: string;
    full_name: string;
    level: number;
  };
  result: "win" | "loss" | "draw";
  score: string;
  my_score: number;
  opponent_score: number;
  played_at: string;
  duration: number;
  tournament_id?: number;
  tournament_name?: string;
  location: string;
  notes?: string;
  can_edit: boolean;
}

export interface GameStatistics {
  overall: {
    games_played: number;
    games_won: number;
    games_lost: number;
    games_drawn: number;
    win_rate: number;
    goals_scored: number;
    goals_conceded: number;
    goal_difference: number;
    average_game_duration: number;
    favorite_location: string;
    total_playtime: number;
  };
  by_game_type: Record<
    string,
    {
      games: number;
      wins: number;
      win_rate: number;
    }
  >;
  recent_performance: {
    last_5_games: string[];
    trend: "improving" | "declining" | "stable";
  };
  achievements: Array<{
    id: number;
    name: string;
    description: string;
    earned_at: string;
  }>;
}

export interface CreateGameResultData {
  opponent_id: number;
  game_type: string;
  result: "win" | "loss" | "draw";
  my_score: number;
  opponent_score: number;
  duration: number;
  location: string;
  tournament_id?: number;
  notes?: string;
  played_at?: string;
}

export const gameResultsService = {
  // Game history
  async getGameHistory(
    page = 1,
    limit = 10,
    filters: {
      search?: string;
      game_type?: string;
      result?: string;
      opponent_id?: number;
      tournament_id?: number;
      date_from?: string;
      date_to?: string;
    } = {}
  ): Promise<{
    results: GameResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await apiService.get("/game-results/", {
        params: {
          page,
          limit,
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      console.warn("Game results API failed:", error);
      // Return empty data structure instead of throwing
      return {
        results: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  },

  async getGameResult(gameId: number): Promise<GameResult> {
    const response = await apiService.get(`/game-results/${gameId}/`);
    return response.data;
  },

  // Recent results
  async getRecentResults(limit = 5): Promise<GameResult[]> {
    try {
      const response = await apiService.get("/game-results/recent/", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.warn("Recent results API failed:", error);
      return [];
    }
  },

  // ✅ CLEAN: Statistics - ONLY REAL API CALLS
  async getStatistics(
    timeframe: "all" | "30days" | "7days" = "all"
  ): Promise<GameStatistics> {
    try {
      const response = await apiService.get("/game-results/statistics/", {
        params: { timeframe },
      });
      return response.data;
    } catch (error) {
      console.warn("Statistics API failed:", error);

      // ✅ Return default structure if API fails
      // This will be caught by Dashboard and handled appropriately
      throw error; // Let Dashboard handle the fallback
    }
  },

  async getOpponentStats(opponentId: number): Promise<{
    games_played: number;
    wins: number;
    losses: number;
    draws: number;
    last_game?: GameResult;
  }> {
    try {
      const response = await apiService.get(
        `/game-results/opponent/${opponentId}/stats/`
      );
      return response.data;
    } catch (error) {
      console.warn("Opponent stats API failed:", error);
      return {
        games_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      };
    }
  },

  // Create new game result
  async createGameResult(data: CreateGameResultData): Promise<GameResult> {
    const response = await apiService.post("/game-results/", data);
    return response.data;
  },

  // Update game result
  async updateGameResult(
    gameId: number,
    data: Partial<CreateGameResultData>
  ): Promise<GameResult> {
    const response = await apiService.put(`/game-results/${gameId}/`, data);
    return response.data;
  },

  // Delete game result
  async deleteGameResult(gameId: number): Promise<void> {
    await apiService.delete(`/game-results/${gameId}/`);
  },

  // Get user achievements
  async getUserAchievements(userId?: number): Promise<any[]> {
    try {
      const endpoint = userId
        ? `/game-results/achievements/${userId}`
        : "/game-results/achievements/me";
      const response = await apiService.get(endpoint);
      return response.data;
    } catch (error) {
      console.warn("Achievements API failed:", error);
      return [];
    }
  },
};
