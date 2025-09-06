// === frontend/src/services/api.ts ===
// TELJES JAVÍTOTT API SZOLGÁLTATÁS - 422 HIBA MEGOLDÁS

import config from "../config/environment.js";

const API_BASE_URL = config.API_URL;

export class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = `HTTP ${response.status}`;

        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.detail || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorData || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Handle empty responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// === AUTHENTICATION INTERFACES ===

export interface LoginRequest {
  username: string;
  password: string;
}

// ✅ JAVÍTOTT: full_name hozzáadva
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  full_name: string; // ✅ KÖTELEZŐ MEZŐ - backend kompatibilitás
  name?: string; // Optional backward compatibility
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string; // ✅ JAVÍTOTT: full_name használata
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
  is_admin?: boolean;
  mfa_enabled?: boolean;
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
    return this.post("/api/auth/login", credentials);
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // ✅ JAVÍTOTT: Full validation
    if (!userData.full_name || userData.full_name.trim().length === 0) {
      throw new Error("Full name is required");
    }

    // ✅ JAVÍTOTT: Ensure full_name is sent
    const payload = {
      username: userData.username,
      password: userData.password,
      email: userData.email,
      full_name: userData.full_name.trim(),
      name: userData.name || userData.full_name, // Backward compatibility
    };

    return this.post("/api/auth/register", payload);
  }

  async getCurrentUser(): Promise<User> {
    try {
      return await this.get("/api/auth/me");
    } catch (error) {
      // ✅ CRITICAL FIX: Clear invalid token on auth failure
      if (
        error instanceof Error &&
        (error.message.includes("401") ||
          error.message.includes("403") ||
          error.message.includes("Unauthorized"))
      ) {
        console.warn("🔑 Clearing invalid auth token");
        localStorage.removeItem("auth_token");
      }
      throw error;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.post("/api/auth/refresh");
  }

  async logout(): Promise<void> {
    return this.post("/api/auth/logout");
  }
}

// === TOURNAMENT INTERFACES ===

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
  rules?: Record<string, any>;
}

export class TournamentService extends ApiService {
  async getTournaments(): Promise<Tournament[]> {
    return this.get("/api/tournaments");
  }

  async getTournament(id: number): Promise<TournamentDetails> {
    return this.get(`/api/tournaments/${id}`);
  }

  async createTournament(data: CreateTournamentRequest): Promise<Tournament> {
    return this.post("/api/tournaments", data);
  }

  async registerForTournament(tournamentId: number): Promise<void> {
    return this.post(`/api/tournaments/${tournamentId}/register`);
  }

  async withdrawFromTournament(tournamentId: number): Promise<void> {
    return this.delete(`/api/tournaments/${tournamentId}/register`);
  }
}

// === CREDIT INTERFACES ===

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonus_credits: number;
  price_huf: number;
  price_usd: number;
  discount_percentage?: number;
  popular: boolean;
  description: string;
}

export interface CreditTransaction {
  id: string;
  transaction_id: string;
  user_id: number;
  package_id: string;
  credits_purchased: number;
  bonus_credits: number;
  total_credits: number;
  price_paid: number;
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
  stripe_payment_intent_id?: string;
}

export interface PurchaseRequest {
  package_id: string;
  payment_method: string;
}

// === COUPON INTERFACES ===

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string;
  coupon_type: "fixed" | "percentage";
  credits_reward: number;
  discount_percentage?: number;
  is_active: boolean;
  expires_at?: string;
  max_uses?: number;
  current_uses: number;
  per_user_limit: number;
  created_at: string;
}

export interface CouponRedemptionRequest {
  coupon_code: string;
}

export interface CouponRedemptionResponse {
  success: boolean;
  message: string;
  credits_awarded: number;
  new_balance: number;
  coupon_name: string;
  coupon_description: string;
}

export interface CouponUsage {
  id: number;
  coupon_id: number;
  user_id: number;
  credits_awarded: number;
  ip_address: string;
  user_agent: string;
  redeemed_at: string;
  coupon: {
    code: string;
    name: string;
    description: string;
  };
}

export class CreditService extends ApiService {
  async getPackages(): Promise<CreditPackage[]> {
    return this.get("/api/credits/packages");
  }

  async getCurrentBalance(): Promise<{ credits: number }> {
    return this.get("/api/credits/balance");
  }

  async getTransactionHistory(): Promise<CreditTransaction[]> {
    return this.get("/api/credits/history");
  }

  async purchaseCredits(data: PurchaseRequest): Promise<CreditTransaction> {
    return this.post("/api/credits/purchase", data);
  }

  // === COUPON METHODS ===

  async redeemCoupon(couponCode: string): Promise<CouponRedemptionResponse> {
    return this.post("/api/credits/redeem-coupon", { coupon_code: couponCode });
  }

  async getAvailableCoupons(): Promise<Coupon[]> {
    try {
      // Use the primary user endpoint
      return await this.get("/api/credits/coupons/available");
    } catch (error) {
      console.error("Failed to fetch available coupons:", error);
      throw error;
    }
  }

  async getCouponUsageHistory(): Promise<CouponUsage[]> {
    return this.get("/api/credits/coupons/my-usage");
  }

  async validateCoupon(
    couponCode: string
  ): Promise<{ valid: boolean; message: string; coupon?: Coupon }> {
    try {
      const response = await this.get(
        `/api/credits/validate-coupon?code=${encodeURIComponent(couponCode)}`
      );
      return response;
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : "Validation failed",
      };
    }
  }

  // Admin-specific coupon methods
  async getAdminCoupons(): Promise<Coupon[]> {
    try {
      return await this.get("/api/credits/admin/coupons");
    } catch (error) {
      console.error("Failed to fetch admin coupons:", error);
      throw error;
    }
  }
}

// === SOCIAL INTERFACES ===

export interface FriendRequest {
  id: number;
  from_user_id: number;
  to_user_id: number;
  from_user: {
    username: string;
    full_name: string;
    level: number;
  };
  to_user: {
    username: string;
    full_name: string;
    level: number;
  };
  status: string;
  created_at: string;
}

export interface Friend {
  user_id: number;
  username: string;
  full_name: string;
  level: number;
  is_online: boolean;
  last_active: string;
  games_played: number;
  win_rate: number;
}

export interface Challenge {
  id: number;
  challenger_id: number;
  challenged_id: number;
  game_type: string;
  location_id?: number;
  status: string;
  created_at: string;
  expires_at: string;
  challenger: {
    username: string;
    full_name: string;
    level: number;
  };
  challenged: {
    username: string;
    full_name: string;
    level: number;
  };
}

export class SocialService extends ApiService {
  async searchUsers(query: string): Promise<User[]> {
    return this.get(`/api/social/search-users?q=${encodeURIComponent(query)}`);
  }

  async sendFriendRequest(userId: number): Promise<void> {
    return this.post(`/api/social/friend-request/${userId}`);
  }

  async respondToFriendRequest(
    requestId: number,
    accept: boolean
  ): Promise<void> {
    return this.post(`/api/social/friend-request/${requestId}/respond`, {
      accept,
    });
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    console.log('🔍 Fetching INCOMING friend requests...');
    return this.get("/api/social/friend-requests");
  }

  async getSentFriendRequests(): Promise<FriendRequest[]> {
    console.log('🔍 Fetching SENT friend requests...');
    return this.get("/api/social/friend-requests/sent");
  }

  async getFriends(): Promise<Friend[]> {
    return this.get("/api/social/friends");
  }

  async removeFriend(userId: number): Promise<void> {
    return this.delete(`/api/social/friends/${userId}`);
  }

  async sendChallenge(
    userId: number,
    gameType: string,
    locationId?: number
  ): Promise<Challenge> {
    return this.post("/api/social/challenge", {
      challenged_user_id: userId,
      game_type: gameType,
      location_id: locationId,
    });
  }

  async respondToChallenge(
    challengeId: number,
    accept: boolean
  ): Promise<void> {
    return this.post(`/api/social/challenge/${challengeId}/respond`, {
      accept,
    });
  }

  async getChallenges(): Promise<Challenge[]> {
    return this.get("/api/social/challenges");
  }
}

// === LOCATION INTERFACES ===

export interface Location {
  id: number;
  name: string;
  address: string;
  city?: string; // ✅ HOZZÁADVA
  capacity: number;
  price_per_hour: number;
  rating: number;
  amenities: string[];
  available_slots: string[];
  image_url?: string;
  latitude?: number;
  longitude?: number;
}

export class LocationService extends ApiService {
  async getLocations(): Promise<Location[]> {
    return this.get("/api/locations");
  }

  async getLocation(id: number): Promise<Location> {
    return this.get(`/api/locations/${id}`);
  }

  async checkAvailability(locationId: number, date: string): Promise<any> {
    return this.get(
      `/api/booking/availability?location_id=${locationId}&date=${date}`
    );
  }
}

// === EXPORT SERVICES ===

export const authService = new AuthService();
export const tournamentService = new TournamentService();
export const creditService = new CreditService();
export const socialService = new SocialService();
export const locationService = new LocationService();

// ✅ TYPE ALIASES for backward compatibility
export type RegisterData = RegisterRequest;
export type LoginData = LoginRequest;
