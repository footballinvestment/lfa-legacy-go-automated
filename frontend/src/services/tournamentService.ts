// src/services/tournamentService.ts
// LFA Legacy GO - Tournament Service for API Integration

import { ApiService } from "./api";

// Tournament Types
export interface Tournament {
  id: number;
  tournament_id: string;
  name: string;
  description?: string;
  tournament_type: string;
  game_type: string;
  format: string;
  status: string;
  location_id: number;
  location_name: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  min_participants: number;
  max_participants: number;
  current_participants: number;
  entry_fee_credits: number;
  prize_pool_credits: number;
  min_level: number;
  max_level?: number;
  organizer_id: number;
  organizer_username: string;
  winner_id?: number;
  winner_username?: string;
  is_registration_open: boolean;
  is_full: boolean;
  can_start: boolean;
  created_at: string;
}

export interface Participant {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  level: number;
  registration_time: string;
  status: string;
  current_round: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  total_score: number;
  average_score: number;
  points: number;
  final_position?: number;
  prize_won: number;
  performance_rating: number;
}

export interface Match {
  id: string;
  match_id: string;
  round_number: number;
  match_number: number;
  tournament_id: number;
  player1_id: number;
  player1_username: string;
  player1_full_name: string;
  player2_id?: number;
  player2_username?: string;
  player2_full_name?: string;
  status: "scheduled" | "in_progress" | "completed" | "pending";
  player1_score?: number;
  player2_score?: number;
  winner_id?: number;
  scheduled_time: string;
  actual_start_time?: string;
  completed_at?: string;
  duration_minutes?: number;
  match_notes?: string;
  competitiveness_score?: number;
}

export interface TournamentDetails {
  tournament: Tournament;
  participants: Participant[];
  bracket?: any;
  current_round: number;
  total_rounds: number;
  user_participation?: Participant;
  can_register: boolean;
  can_withdraw: boolean;
  upcoming_matches: Match[];
  completed_matches: Match[];
  tournament_rules: {
    format: string;
    entry_fee: number;
    min_participants: number;
    max_participants: number;
    prize_distribution: Record<string, number>;
    level_requirements: {
      min_level: number;
      max_level?: number;
    };
  };
}

export interface CreateTournamentRequest {
  name: string;
  description?: string;
  tournament_type: string;
  game_type: string;
  format: string;
  location_id: number;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  min_participants: number;
  max_participants: number;
  entry_fee_credits: number;
  prize_distribution: Record<string, number>;
  min_level: number;
  max_level?: number;
}

export interface MatchResultSubmission {
  player1_score: number;
  player2_score: number;
  winner_id: number;
  actual_start_time?: string;
  actual_end_time?: string;
  match_notes?: string;
  duration_minutes?: number;
  competitiveness_score?: number;
}

export class TournamentService extends ApiService {
  private readonly baseUrl = "/api/tournaments";

  // Tournament Management
  async getAllTournaments(): Promise<Tournament[]> {
    return this.get(this.baseUrl);
  }

  async getTournamentById(tournamentId: number): Promise<TournamentDetails> {
    return this.get(`${this.baseUrl}/${tournamentId}`);
  }

  async createTournament(
    tournament: CreateTournamentRequest
  ): Promise<Tournament> {
    return this.post(this.baseUrl, tournament);
  }

  async updateTournament(
    tournamentId: number,
    updates: Partial<Tournament>
  ): Promise<Tournament> {
    return this.put(`${this.baseUrl}/${tournamentId}`, updates);
  }

  async deleteTournament(tournamentId: number): Promise<{ message: string }> {
    return this.delete(`${this.baseUrl}/${tournamentId}`);
  }

  // Registration Management
  async registerForTournament(
    tournamentId: number
  ): Promise<{ message: string; participant: Participant }> {
    return this.post(`${this.baseUrl}/${tournamentId}/register`);
  }

  async withdrawFromTournament(
    tournamentId: number
  ): Promise<{ message: string }> {
    return this.delete(`${this.baseUrl}/${tournamentId}/register`);
  }

  async getTournamentParticipants(
    tournamentId: number
  ): Promise<Participant[]> {
    return this.get(`${this.baseUrl}/${tournamentId}/participants`);
  }

  // Bracket & Match Management
  async getTournamentBracket(tournamentId: number): Promise<{
    tournament_id: number;
    rounds: Array<{
      round_number: number;
      matches: Match[];
    }>;
    current_round: number;
    total_rounds: number;
  }> {
    return this.get(`${this.baseUrl}/${tournamentId}/bracket`);
  }

  async getTournamentMatches(
    tournamentId: number,
    status?: string
  ): Promise<Match[]> {
    const params = status ? `?status=${status}` : "";
    return this.get(`${this.baseUrl}/${tournamentId}/matches${params}`);
  }

  async getMatchDetails(tournamentId: number, matchId: string): Promise<Match> {
    return this.get(`${this.baseUrl}/${tournamentId}/matches/${matchId}`);
  }

  async updateMatchStatus(
    tournamentId: number,
    matchId: string,
    status: "scheduled" | "in_progress" | "completed"
  ): Promise<Match> {
    return this.put(
      `${this.baseUrl}/${tournamentId}/matches/${matchId}/status`,
      { status }
    );
  }

  async submitMatchResult(
    tournamentId: number,
    matchId: string,
    result: MatchResultSubmission
  ): Promise<Match> {
    return this.post(
      `${this.baseUrl}/${tournamentId}/matches/${matchId}/result`,
      result
    );
  }

  async rescheduleMatch(
    tournamentId: number,
    matchId: string,
    newTime: string
  ): Promise<Match> {
    return this.put(
      `${this.baseUrl}/${tournamentId}/matches/${matchId}/schedule`,
      {
        scheduled_time: newTime,
      }
    );
  }

  // Tournament Control (Organizer only)
  async startTournament(
    tournamentId: number
  ): Promise<{ message: string; tournament: Tournament }> {
    return this.post(`${this.baseUrl}/${tournamentId}/start`);
  }

  async endTournament(
    tournamentId: number
  ): Promise<{ message: string; tournament: Tournament }> {
    return this.post(`${this.baseUrl}/${tournamentId}/end`);
  }

  async cancelTournament(
    tournamentId: number,
    reason?: string
  ): Promise<{ message: string }> {
    return this.post(`${this.baseUrl}/${tournamentId}/cancel`, { reason });
  }

  async generateBracket(
    tournamentId: number
  ): Promise<{ message: string; bracket: any }> {
    return this.post(`${this.baseUrl}/${tournamentId}/generate-bracket`);
  }

  // Statistics & Analytics
  async getTournamentStatistics(tournamentId: number): Promise<{
    tournament_id: number;
    total_matches: number;
    completed_matches: number;
    average_match_duration: number;
    average_competitiveness: number;
    participant_stats: Array<{
      user_id: number;
      username: string;
      full_name: string;
      matches_played: number;
      matches_won: number;
      win_rate: number;
      average_score: number;
      performance_rating: number;
    }>;
  }> {
    return this.get(`${this.baseUrl}/${tournamentId}/statistics`);
  }

  async getUserTournamentHistory(userId?: number): Promise<{
    user_id: number;
    tournaments_participated: number;
    tournaments_won: number;
    tournaments_organized: number;
    total_matches_played: number;
    total_matches_won: number;
    win_rate: number;
    average_placement: number;
    total_credits_earned: number;
    total_credits_spent: number;
    favorite_tournament_type: string;
    recent_tournaments: Tournament[];
  }> {
    const endpoint = userId
      ? `${this.baseUrl}/user/${userId}/history`
      : `${this.baseUrl}/user/me/history`;
    return this.get(endpoint);
  }

  // Search & Filtering
  async searchTournaments(params: {
    search?: string;
    status?: string;
    tournament_type?: string;
    format?: string;
    location_id?: number;
    min_level?: number;
    max_level?: number;
    entry_fee_min?: number;
    entry_fee_max?: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    tournaments: Tournament[];
    total_count: number;
    page: number;
    total_pages: number;
  }> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    return this.get(`${this.baseUrl}/search?${queryParams.toString()}`);
  }

  // Leaderboards
  async getTournamentLeaderboard(tournamentId: number): Promise<{
    tournament_id: number;
    leaderboard: Array<{
      position: number;
      user_id: number;
      username: string;
      full_name: string;
      points: number;
      matches_won: number;
      matches_played: number;
      win_rate: number;
      average_score: number;
      prize_won: number;
    }>;
  }> {
    return this.get(`${this.baseUrl}/${tournamentId}/leaderboard`);
  }

  async getGlobalTournamentLeaderboard(params?: {
    tournament_type?: string;
    time_period?: "week" | "month" | "year" | "all";
    limit?: number;
  }): Promise<{
    leaderboard: Array<{
      position: number;
      user_id: number;
      username: string;
      full_name: string;
      tournaments_won: number;
      total_tournaments: number;
      win_rate: number;
      total_credits_earned: number;
      performance_rating: number;
    }>;
    time_period: string;
    updated_at: string;
  }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return this.get(`${this.baseUrl}/leaderboard?${queryParams.toString()}`);
  }

  // Template Management
  async getTournamentTemplates(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      tournament_type: string;
      format: string;
      min_participants: number;
      max_participants: number;
      entry_fee_credits: number;
      prize_distribution: Record<string, number>;
      level_requirements: {
        min_level: number;
        max_level?: number;
      };
    }>
  > {
    return this.get(`${this.baseUrl}/templates`);
  }

  async createTournamentFromTemplate(
    templateId: string,
    overrides: {
      name: string;
      description?: string;
      location_id: number;
      start_time: string;
      registration_deadline: string;
    }
  ): Promise<Tournament> {
    return this.post(
      `${this.baseUrl}/templates/${templateId}/create`,
      overrides
    );
  }

  // Notifications & Events
  async subscribeTournamentUpdates(
    tournamentId: number
  ): Promise<{ message: string }> {
    return this.post(`${this.baseUrl}/${tournamentId}/subscribe`);
  }

  async unsubscribeTournamentUpdates(
    tournamentId: number
  ): Promise<{ message: string }> {
    return this.delete(`${this.baseUrl}/${tournamentId}/subscribe`);
  }

  // Validation & Helper Methods
  validateTournamentData(tournament: CreateTournamentRequest): string[] {
    const errors: string[] = [];

    if (!tournament.name || tournament.name.trim().length < 3) {
      errors.push("Tournament name must be at least 3 characters long");
    }

    if (!tournament.start_time) {
      errors.push("Start time is required");
    }

    if (!tournament.registration_deadline) {
      errors.push("Registration deadline is required");
    }

    if (
      new Date(tournament.registration_deadline) >=
      new Date(tournament.start_time)
    ) {
      errors.push("Registration deadline must be before start time");
    }

    if (tournament.min_participants < 2) {
      errors.push("Minimum participants must be at least 2");
    }

    if (tournament.max_participants < tournament.min_participants) {
      errors.push(
        "Maximum participants must be greater than minimum participants"
      );
    }

    if (tournament.entry_fee_credits < 0) {
      errors.push("Entry fee cannot be negative");
    }

    if (tournament.min_level < 1 || tournament.min_level > 10) {
      errors.push("Minimum level must be between 1 and 10");
    }

    if (tournament.max_level && tournament.max_level < tournament.min_level) {
      errors.push("Maximum level must be greater than minimum level");
    }

    return errors;
  }

  formatTournamentTime(dateString: string): string {
    return new Date(dateString).toLocaleString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  calculateTournamentDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  }

  getTournamentStatusDisplayName(status: string): string {
    switch (status) {
      case "registration":
        return "Registration Open";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status.replace("_", " ");
    }
  }

  getTournamentTypeDisplayName(type: string): string {
    switch (type) {
      case "daily_challenge":
        return "Daily Challenge";
      case "weekly_challenge":
        return "Weekly Challenge";
      case "championship":
        return "Championship";
      case "beginner_friendly":
        return "Beginner Friendly";
      case "elite_series":
        return "Elite Series";
      default:
        return type.replace("_", " ");
    }
  }

  getFormatDisplayName(format: string): string {
    switch (format) {
      case "single_elimination":
        return "Single Elimination";
      case "double_elimination":
        return "Double Elimination";
      case "round_robin":
        return "Round Robin";
      case "swiss_system":
        return "Swiss System";
      default:
        return format.replace("_", " ");
    }
  }
}

// Export service instance
export const tournamentService = new TournamentService();

// Export default for convenience
export default tournamentService;
