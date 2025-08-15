// src/services/api.ts
// LFA Legacy GO - Complete API Service with Tournament Integration

// Base API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export class ApiService {
  protected baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // FIXED: Changed from private to protected so it can be used in subclasses
  protected getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("auth_token"); // Fixed: use correct token key
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  protected async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // FIXED: Added uploadFile method with proper file handling
  protected async uploadFile<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        ...this.getAuthHeaders(),
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }
}

// === AUTHENTICATION API ===
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  full_name: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  display_name?: string;
  level: number;
  xp: number;
  credits: number;
  bio?: string;
  skills: Record<string, number>;
  games_played: number;
  games_won: number;
  games_lost?: number;
  friend_count: number;
  challenge_wins?: number;
  challenge_losses?: number;
  total_achievements: number;
  is_premium: boolean;
  premium_expires_at?: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  last_activity?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export class AuthService extends ApiService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Send JSON data instead of FormData
    return this.post("/api/auth/login", credentials);
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.post("/api/auth/register", userData);
  }

  async getCurrentUser(): Promise<User> {
    return this.get("/api/auth/me");
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.post("/api/auth/refresh");
  }

  async logout(): Promise<void> {
    return this.post("/api/auth/logout");
  }

  // FIXED: Remove clearAuth method since it doesn't exist
  // async clearAuth(): Promise<void> {
  //   localStorage.removeItem("auth_token");
  // }
}

// === TOURNAMENT API ===
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

export interface TournamentDetails {
  tournament: Tournament;
  participants: any[];
  bracket?: any;
  current_round: number;
  total_rounds: number;
  user_participation?: any;
  can_register: boolean;
  can_withdraw: boolean;
  upcoming_matches: any[];
  completed_matches: any[];
  tournament_rules: any;
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

export class TournamentService extends ApiService {
  async getTournaments(): Promise<Tournament[]> {
    return this.get("/api/tournaments");
  }

  async getTournamentDetails(tournamentId: number): Promise<TournamentDetails> {
    return this.get(`/api/tournaments/${tournamentId}`);
  }

  async createTournament(
    tournament: CreateTournamentRequest
  ): Promise<Tournament> {
    return this.post("/api/tournaments", tournament);
  }

  async registerForTournament(
    tournamentId: number
  ): Promise<{ message: string }> {
    return this.post(`/api/tournaments/${tournamentId}/register`);
  }

  async withdrawFromTournament(
    tournamentId: number
  ): Promise<{ message: string }> {
    return this.delete(`/api/tournaments/${tournamentId}/register`);
  }

  async getTournamentBracket(tournamentId: number): Promise<any> {
    return this.get(`/api/tournaments/${tournamentId}/bracket`);
  }

  async getTournamentMatches(tournamentId: number): Promise<any[]> {
    return this.get(`/api/tournaments/${tournamentId}/matches`);
  }

  async updateMatchStatus(
    tournamentId: number,
    matchId: string,
    status: string
  ): Promise<any> {
    return this.put(
      `/api/tournaments/${tournamentId}/matches/${matchId}/status`,
      { status }
    );
  }

  async submitMatchResult(
    tournamentId: number,
    matchId: string,
    result: any
  ): Promise<any> {
    return this.post(
      `/api/tournaments/${tournamentId}/matches/${matchId}/result`,
      result
    );
  }
}

// === WEATHER API ===
export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  feels_like: number;
  visibility: number;
  uv_index: number;
  timestamp: string;
}

export class WeatherService extends ApiService {
  async getCurrentWeather(lat?: number, lon?: number): Promise<WeatherData> {
    const params = lat && lon ? `?lat=${lat}&lon=${lon}` : "";
    return this.get(`/api/weather/current${params}`);
  }

  async getForecast(
    lat?: number,
    lon?: number,
    days?: number
  ): Promise<{
    location: string;
    forecast: Array<{
      date: string;
      temperature_max: number;
      temperature_min: number;
      humidity: number;
      wind_speed: number;
      description: string;
      icon: string;
      precipitation_chance: number;
    }>;
  }> {
    const params = new URLSearchParams();
    if (lat) params.append("lat", lat.toString());
    if (lon) params.append("lon", lon.toString());
    if (days) params.append("days", days.toString());

    return this.get(`/api/weather/forecast?${params.toString()}`);
  }
}

// === BOOKING API ===
export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  price_per_hour: number;
  rating: number;
  amenities: string[];
  available_slots: string[];
  image_url?: string;
  latitude?: number;
  longitude?: number;
  weather_data?: WeatherData;
}

export interface BookingRequest {
  location_id: number;
  scheduled_time: string;
  duration_hours: number;
  notes?: string;
}

export interface Booking {
  id: number;
  location: Location;
  scheduled_time: string;
  duration_hours: number;
  total_cost: number;
  status: string;
  created_at: string;
  notes?: string;
}

export class BookingService extends ApiService {
  async getLocations(): Promise<Location[]> {
    return this.get("/api/locations");
  }

  async getLocationById(id: number): Promise<Location> {
    return this.get(`/api/locations/${id}`);
  }

  async createBooking(booking: BookingRequest): Promise<Booking> {
    return this.post("/api/booking/create", booking);
  }

  async getUserBookings(): Promise<Booking[]> {
    return this.get("/api/booking/my-bookings");
  }

  async cancelBooking(bookingId: number): Promise<{ message: string }> {
    return this.delete(`/api/booking/${bookingId}/cancel`);
  }
}

// === SOCIAL API ===
export interface Friend {
  id: number;
  username: string;
  full_name: string;
  level: number;
  is_online: boolean;
  last_seen?: string;
}

export interface FriendRequest {
  id: number;
  from_user: Friend;
  to_user: Friend;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export class SocialService extends ApiService {
  async getFriends(): Promise<Friend[]> {
    return this.get("/api/social/friends");
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    return this.get("/api/social/friend-requests");
  }

  async sendFriendRequest(username: string): Promise<{ message: string }> {
    return this.post("/api/social/friend-request", { username });
  }

  async respondToFriendRequest(
    requestId: number,
    accept: boolean
  ): Promise<{ message: string }> {
    return this.post(`/api/social/friend-request/${requestId}/respond`, {
      accept,
    });
  }

  async removeFriend(friendId: number): Promise<{ message: string }> {
    return this.delete(`/api/social/friends/${friendId}`);
  }

  async searchUsers(query: string): Promise<
    Array<{
      id: number;
      username: string;
      full_name: string;
      level: number;
    }>
  > {
    return this.get(`/api/social/search?q=${encodeURIComponent(query)}`);
  }
}

// === CREDITS API ===
export interface CreditTransaction {
  id: number;
  amount: number;
  transaction_type: "purchase" | "spent" | "earned" | "refund";
  description: string;
  created_at: string;
}

export interface CreditPurchaseRequest {
  package_type: "small" | "medium" | "large" | "premium";
  payment_method: string;
}

export class CreditService extends ApiService {
  async getCreditBalance(): Promise<{ credits: number }> {
    return this.get("/api/credits/balance");
  }

  async getCreditHistory(): Promise<CreditTransaction[]> {
    return this.get("/api/credits/history");
  }

  async purchaseCredits(purchase: CreditPurchaseRequest): Promise<{
    message: string;
    transaction_id: string;
    credits_added: number;
    new_balance: number;
  }> {
    return this.post("/api/credits/purchase", purchase);
  }

  async getCreditPackages(): Promise<
    Array<{
      type: string;
      credits: number;
      price: number;
      bonus_credits: number;
      description: string;
    }>
  > {
    return this.get("/api/credits/packages");
  }
}

// === GAME RESULTS API ===
export interface GameResultSubmission {
  session_id?: string;
  game_type: string;
  score: number;
  completion_time_seconds: number;
  skill_scores: Record<string, number>;
  achievements_unlocked: string[];
  game_data: any;
  duration_seconds?: number;
}

export interface UserStatistics {
  user_id: number;
  total_games_played: number;
  total_games_completed: number;
  win_rate: number;
  average_score: number;
  best_score: number;
  current_win_streak: number;
  skill_averages: Record<string, number>;
  game_stats: Record<string, any>;
}

export class GameResultService extends ApiService {
  async submitResult(
    result: GameResultSubmission
  ): Promise<{ message: string }> {
    return this.post("/api/game-results/submit", result);
  }

  async getUserStatistics(userId?: number): Promise<UserStatistics> {
    const endpoint = userId
      ? `/api/game-results/statistics/${userId}`
      : "/api/game-results/statistics/me";
    return this.get(endpoint);
  }

  async getUserAchievements(userId?: number): Promise<{
    user_id: number;
    total_achievements: number;
    total_points: number;
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      earned_at: string;
      points: number;
    }>;
  }> {
    const endpoint = userId
      ? `/api/game-results/achievements/${userId}`
      : "/api/game-results/achievements/me";
    return this.get(endpoint);
  }
}

// === SYSTEM API ===
export class SystemService extends ApiService {
  async getHealth(): Promise<{
    status: string;
    version: string;
    components: any;
    weather_system: any;
    timestamp: string;
  }> {
    return this.get("/health");
  }

  async getVersion(): Promise<{
    version: string;
    build: string;
    environment: any;
    components: any;
  }> {
    return this.get("/version");
  }
}

// Export service instances
export const authService = new AuthService();
export const tournamentService = new TournamentService();
export const weatherService = new WeatherService();
export const bookingService = new BookingService();
export const socialService = new SocialService();
export const creditService = new CreditService();
export const gameResultService = new GameResultService();
export const systemService = new SystemService();

// Export default API instance for custom requests
const defaultApiService = new ApiService();
export default defaultApiService;
