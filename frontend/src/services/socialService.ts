import { apiService } from './apiService';

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  level: number;
  credits: number;
  is_online: boolean;
  last_seen?: string;
  profile_picture?: string;
  stats?: {
    games_played: number;
    games_won: number;
    win_rate: number;
  };
}

export interface Friend {
  id: number;
  user: User;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface FriendRequest {
  id: number;
  sender: User;
  recipient: User;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface Challenge {
  id: number;
  challenger: User;
  challenged: User;
  game_type: string;
  location_id?: number;
  location_name?: string;
  scheduled_time?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  created_at: string;
}

export const socialService = {
  // Friends management
  async getFriends(): Promise<Friend[]> {
    const response = await apiService.get('/social/friends/');
    return response.data;
  },

  async removeFriend(friendId: number): Promise<void> {
    await apiService.delete(`/social/friends/${friendId}/`);
  },

  // User search and discovery
  async searchUsers(query: string, page = 1): Promise<{ results: User[]; total: number; page: number; totalPages: number }> {
    const response = await apiService.get('/social/users/search/', {
      params: { q: query, page }
    });
    return response.data;
  },

  async getUserProfile(userId: number): Promise<User> {
    const response = await apiService.get(`/users/${userId}/`);
    return response.data;
  },

  // Friend requests
  async getFriendRequests(type: 'sent' | 'received' | 'all' = 'all'): Promise<FriendRequest[]> {
    const response = await apiService.get('/social/friend-requests/', {
      params: { type }
    });
    return response.data;
  },

  async sendFriendRequest(userId: number, message?: string): Promise<FriendRequest> {
    const response = await apiService.post('/social/friend-requests/', {
      recipient_id: userId,
      message
    });
    return response.data;
  },

  async respondToFriendRequest(requestId: number, action: 'accept' | 'decline'): Promise<void> {
    await apiService.patch(`/social/friend-requests/${requestId}/`, {
      status: action === 'accept' ? 'accepted' : 'declined'
    });
  },

  async cancelFriendRequest(requestId: number): Promise<void> {
    await apiService.delete(`/social/friend-requests/${requestId}/`);
  },

  // Challenges
  async getChallenges(type: 'sent' | 'received' | 'all' = 'all'): Promise<Challenge[]> {
    const response = await apiService.get('/social/challenges/', {
      params: { type }
    });
    return response.data;
  },

  async sendChallenge(data: {
    challenged_user_id: number;
    game_type: string;
    location_id?: number;
    scheduled_time?: string;
    message?: string;
  }): Promise<Challenge> {
    const response = await apiService.post('/social/challenges/', data);
    return response.data;
  },

  async respondToChallenge(challengeId: number, action: 'accept' | 'decline'): Promise<void> {
    await apiService.patch(`/social/challenges/${challengeId}/`, {
      status: action === 'accept' ? 'accepted' : 'declined'
    });
  },

  async cancelChallenge(challengeId: number): Promise<void> {
    await apiService.delete(`/social/challenges/${challengeId}/`);
  },

  // Utility functions
  async checkFriendshipStatus(userId: number): Promise<'none' | 'pending' | 'friends' | 'blocked'> {
    const response = await apiService.get(`/social/friendship-status/${userId}/`);
    return response.data.status;
  },

  async blockUser(userId: number): Promise<void> {
    await apiService.post(`/social/block/${userId}/`);
  },

  async unblockUser(userId: number): Promise<void> {
    await apiService.delete(`/social/block/${userId}/`);
  },

  async getOnlineFriends(): Promise<User[]> {
    const response = await apiService.get('/social/friends/online/');
    return response.data;
  },

  async updateOnlineStatus(isOnline: boolean): Promise<void> {
    await apiService.patch('/social/status/', { is_online: isOnline });
  },
};