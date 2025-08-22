// Tournament-related type definitions for LFA Legacy GO

export type TournamentStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled";
export type TournamentFormat =
  | "single_elimination"
  | "double_elimination"
  | "round_robin"
  | "swiss";
export type MatchStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Tournament {
  id: number;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool?: number;
  status: TournamentStatus;
  organizerId: number;
  organizerName: string;
  rules: string;
  format: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  tags?: string[];
  isPublic?: boolean;
  registrationDeadline?: string;
  minParticipants?: number;
  ageRestriction?: {
    min?: number;
    max?: number;
  };
  skillLevel?: "beginner" | "intermediate" | "advanced" | "professional";
  weatherConditions?: {
    indoor: boolean;
    allowedWeather?: string[];
  };
}

export interface TournamentParticipant {
  id: number;
  tournamentId: number;
  userId: number;
  userName: string;
  userEmail: string;
  registrationDate: string;
  status: "registered" | "confirmed" | "withdrew" | "disqualified";
  seedNumber?: number;
  teamName?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface Match {
  id: number;
  tournamentId: number;
  roundNumber: number;
  matchNumber: number;
  participant1Id?: number;
  participant2Id?: number;
  participant1Name?: string;
  participant2Name?: string;
  participant1Score?: number;
  participant2Score?: number;
  winnerId?: number;
  status: MatchStatus;
  scheduledTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  location?: string;
  field?: string;
  referee?: string;
  notes?: string;
  liveScore?: {
    participant1: number;
    participant2: number;
    period: number;
    timeElapsed: number;
    events: MatchEvent[];
  };
}

export interface MatchEvent {
  id: number;
  matchId: number;
  participantId: number;
  eventType:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "timeout"
    | "injury";
  timestamp: number; // seconds from match start
  description?: string;
  playerName?: string;
}

export interface TournamentBracket {
  tournamentId: number;
  format: TournamentFormat;
  rounds: BracketRound[];
  finalStandings?: TournamentStanding[];
}

export interface BracketRound {
  roundNumber: number;
  roundName: string;
  matches: Match[];
  isCompleted: boolean;
}

export interface TournamentStanding {
  rank: number;
  participantId: number;
  participantName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  prizeAmount?: number;
}

export interface TournamentInvitation {
  id: number;
  tournamentId: number;
  inviterId: number;
  inviterName: string;
  inviteeEmail: string;
  inviteeId?: number;
  status: "pending" | "accepted" | "declined" | "expired";
  invitedAt: string;
  respondedAt?: string;
  expiresAt: string;
  personalMessage?: string;
}

export interface TournamentStats {
  tournamentId: number;
  totalMatches: number;
  completedMatches: number;
  averageMatchDuration: number;
  totalGoals: number;
  topScorer?: {
    participantId: number;
    participantName: string;
    goals: number;
  };
  mostYellowCards?: {
    participantId: number;
    participantName: string;
    cards: number;
  };
  fairPlayAward?: {
    participantId: number;
    participantName: string;
    score: number;
  };
}

export interface TournamentCreateRequest {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  maxParticipants: number;
  entryFee: number;
  prizePool?: number;
  rules: string;
  format: TournamentFormat;
  isPublic: boolean;
  registrationDeadline?: string;
  minParticipants?: number;
  ageRestriction?: {
    min?: number;
    max?: number;
  };
  skillLevel?: "beginner" | "intermediate" | "advanced" | "professional";
  tags?: string[];
  imageUrl?: string;
}

export interface TournamentUpdateRequest {
  name?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  entryFee?: number;
  prizePool?: number;
  rules?: string;
  registrationDeadline?: string;
  isPublic?: boolean;
  tags?: string[];
  imageUrl?: string;
}

export interface TournamentJoinRequest {
  tournamentId: number;
  teamName?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  agreedToTerms: boolean;
  paymentConfirmation?: string;
}

export interface TournamentSearchFilters {
  status?: TournamentStatus[];
  location?: string;
  maxEntryFee?: number;
  minPrizePool?: number;
  skillLevel?: string[];
  format?: TournamentFormat[];
  startDateFrom?: string;
  startDateTo?: string;
  tags?: string[];
  hasAvailableSpots?: boolean;
  sortBy?: "startDate" | "entryFee" | "prizePool" | "participants" | "created";
  sortOrder?: "asc" | "desc";
}

export interface TournamentListResponse {
  tournaments: Tournament[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Mobile-specific interfaces
export interface MobileTournamentCard {
  tournament: Tournament;
  isJoined: boolean;
  isWatchlisted: boolean;
  userRank?: number;
  nextMatchTime?: string;
  qrCodeUrl?: string;
}

export interface QRCodeTournamentData {
  tournamentId: number;
  name: string;
  startDate: string;
  location: string;
  entryFee: number;
  joinUrl: string;
  expiresAt: string;
}

export interface PushNotificationPreferences {
  tournamentReminders: boolean;
  matchUpdates: boolean;
  resultNotifications: boolean;
  invitations: boolean;
  scheduleChanges: boolean;
  prizeAnnouncements: boolean;
}

export interface OfflineCapability {
  tournamentData: Tournament[];
  matchData: Match[];
  participantData: TournamentParticipant[];
  lastSyncTimestamp: string;
  pendingActions: OfflineAction[];
}

export interface OfflineAction {
  id: string;
  type: "join_tournament" | "update_match_score" | "submit_result";
  data: any;
  timestamp: string;
  retryCount: number;
}

export interface TouchGesture {
  type: "swipe" | "pinch" | "tap" | "long_press";
  direction?: "left" | "right" | "up" | "down";
  target: "tournament_card" | "match_card" | "bracket_node";
  action: string;
}

export interface MobileViewport {
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  isDarkMode: boolean;
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// PWA-specific types
export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
  orientation: "portrait" | "landscape" | "any";
  theme_color: string;
  background_color: string;
  icons: PWAIcon[];
  categories: string[];
  screenshots: PWAScreenshot[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: "any" | "maskable" | "monochrome";
}

export interface PWAScreenshot {
  src: string;
  sizes: string;
  type: string;
  platform?: "wide" | "narrow";
  label?: string;
}

export interface ServiceWorkerConfig {
  enabled: boolean;
  cachingStrategy: "cache_first" | "network_first" | "stale_while_revalidate";
  offlinePages: string[];
  backgroundSync: boolean;
  pushNotifications: boolean;
}

// Tournament interface already exported as named export
// TypeScript interfaces cannot be default exported for React components
