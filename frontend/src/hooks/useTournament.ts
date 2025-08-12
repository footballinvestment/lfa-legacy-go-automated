// src/hooks/useTournament.ts
// LFA Legacy GO - React Hooks for Tournament Management

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  tournamentService,
  Tournament,
  TournamentDetails,
  CreateTournamentRequest,
} from "../services/api";

// Tournament List Hook
export const useTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tournamentService.getTournaments();
      setTournaments(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch tournaments"
      );
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const refetch = useCallback(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  return {
    tournaments,
    loading,
    error,
    refetch,
  };
};

// Tournament Details Hook
export const useTournamentDetails = (tournamentId: number) => {
  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournamentDetails = useCallback(async () => {
    if (!tournamentId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await tournamentService.getTournamentDetails(tournamentId);
      setTournament(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch tournament details"
      );
      console.error("Error fetching tournament details:", err);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournamentDetails();
  }, [fetchTournamentDetails]);

  const refetch = useCallback(() => {
    fetchTournamentDetails();
  }, [fetchTournamentDetails]);

  return {
    tournament,
    loading,
    error,
    refetch,
  };
};

// Tournament Registration Hook
export const useTournamentRegistration = (tournamentId: number) => {
  const { state: authState } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async () => {
    if (!authState.isAuthenticated || !tournamentId) return false;

    try {
      setIsRegistering(true);
      setError(null);
      await tournamentService.registerForTournament(tournamentId);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to register for tournament"
      );
      console.error("Error registering for tournament:", err);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [authState.isAuthenticated, tournamentId]);

  const withdraw = useCallback(async () => {
    if (!authState.isAuthenticated || !tournamentId) return false;

    try {
      setIsWithdrawing(true);
      setError(null);
      await tournamentService.withdrawFromTournament(tournamentId);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to withdraw from tournament"
      );
      console.error("Error withdrawing from tournament:", err);
      return false;
    } finally {
      setIsWithdrawing(false);
    }
  }, [authState.isAuthenticated, tournamentId]);

  return {
    register,
    withdraw,
    isRegistering,
    isWithdrawing,
    error,
  };
};

// Tournament Creation Hook
export const useTournamentCreation = () => {
  const { state: authState } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTournament = useCallback(
    async (tournamentData: CreateTournamentRequest) => {
      if (!authState.isAuthenticated) return null;

      try {
        setIsCreating(true);
        setError(null);
        const tournament = await tournamentService.createTournament(
          tournamentData
        );
        return tournament;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create tournament"
        );
        console.error("Error creating tournament:", err);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [authState.isAuthenticated]
  );

  return {
    createTournament,
    isCreating,
    error,
  };
};

// Tournament Bracket Hook
export const useTournamentBracket = (tournamentId: number) => {
  const [bracket, setBracket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBracket = useCallback(async () => {
    if (!tournamentId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await tournamentService.getTournamentBracket(tournamentId);
      setBracket(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch tournament bracket"
      );
      console.error("Error fetching tournament bracket:", err);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchBracket();
  }, [fetchBracket]);

  const refetch = useCallback(() => {
    fetchBracket();
  }, [fetchBracket]);

  return {
    bracket,
    loading,
    error,
    refetch,
  };
};

// Tournament Matches Hook
export const useTournamentMatches = (tournamentId: number) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!tournamentId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await tournamentService.getTournamentMatches(tournamentId);
      setMatches(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch tournament matches"
      );
      console.error("Error fetching tournament matches:", err);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const updateMatchStatus = useCallback(
    async (matchId: string, status: string) => {
      try {
        await tournamentService.updateMatchStatus(
          tournamentId,
          matchId,
          status
        );
        fetchMatches(); // Refresh matches after update
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update match status"
        );
        console.error("Error updating match status:", err);
        return false;
      }
    },
    [tournamentId, fetchMatches]
  );

  const submitMatchResult = useCallback(
    async (matchId: string, result: any) => {
      try {
        await tournamentService.submitMatchResult(
          tournamentId,
          matchId,
          result
        );
        fetchMatches(); // Refresh matches after result submission
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to submit match result"
        );
        console.error("Error submitting match result:", err);
        return false;
      }
    },
    [tournamentId, fetchMatches]
  );

  const refetch = useCallback(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    loading,
    error,
    updateMatchStatus,
    submitMatchResult,
    refetch,
  };
};

// Tournament Statistics Hook
export const useTournamentStatistics = (tournamentId: number) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!tournamentId) return;

    try {
      setLoading(true);
      setError(null);
      // Note: This would use a statistics endpoint when available
      // const data = await tournamentService.getTournamentStatistics(tournamentId);
      // setStatistics(data);

      // For now, we'll use mock data
      setTimeout(() => {
        setStatistics({
          tournament_id: tournamentId,
          total_matches: 15,
          completed_matches: 8,
          average_match_duration: 25,
          average_competitiveness: 7.5,
          participant_stats: [],
        });
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch tournament statistics"
      );
      console.error("Error fetching tournament statistics:", err);
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const refetch = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch,
  };
};

// Tournament Filter Hook
export const useTournamentFilters = (tournaments: Tournament[]) => {
  const [filters, setFilters] = useState({
    status: "all",
    tournamentType: "all",
    format: "all",
    search: "",
  });

  const filteredTournaments = useCallback(() => {
    let filtered = tournaments;

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (tournament) =>
          tournament.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Filter by tournament type
    if (filters.tournamentType !== "all") {
      filtered = filtered.filter(
        (tournament) => tournament.tournament_type === filters.tournamentType
      );
    }

    // Filter by format
    if (filters.format !== "all") {
      filtered = filtered.filter(
        (tournament) => tournament.format === filters.format
      );
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (tournament) =>
          tournament.name.toLowerCase().includes(searchLower) ||
          tournament.description?.toLowerCase().includes(searchLower) ||
          tournament.organizer_username.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [tournaments, filters]);

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: "all",
      tournamentType: "all",
      format: "all",
      search: "",
    });
  }, []);

  return {
    filters,
    filteredTournaments: filteredTournaments(),
    updateFilter,
    resetFilters,
  };
};

// Tournament User Permissions Hook
export const useTournamentPermissions = (tournament: Tournament | null) => {
  const { state: authState } = useAuth();

  const permissions = useCallback(() => {
    if (!tournament || !authState.user) {
      return {
        canView: true,
        canRegister: false,
        canWithdraw: false,
        canEdit: false,
        canManageMatches: false,
        canViewBracket: false,
        isOrganizer: false,
        isParticipant: false,
      };
    }

    const isOrganizer = tournament.organizer_id === authState.user.id;
    const isParticipant = false; // Would need to check participants list
    const canRegister =
      tournament.is_registration_open &&
      !tournament.is_full &&
      !isParticipant &&
      authState.user.level >= tournament.min_level &&
      (!tournament.max_level || authState.user.level <= tournament.max_level);

    return {
      canView: true,
      canRegister,
      canWithdraw: isParticipant && tournament.status === "registration",
      canEdit: isOrganizer,
      canManageMatches: isOrganizer,
      canViewBracket: tournament.current_participants >= 2,
      isOrganizer,
      isParticipant,
    };
  }, [tournament, authState.user]);

  return permissions();
};

// Tournament Real-time Updates Hook (for future WebSocket integration)
export const useTournamentUpdates = (tournamentId: number) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);

  // Placeholder for WebSocket connection
  useEffect(() => {
    if (!tournamentId) return;

    // TODO: Implement WebSocket connection for real-time updates
    // const ws = new WebSocket(`ws://localhost:8000/api/tournaments/${tournamentId}/updates`);
    // ws.onopen = () => setIsConnected(true);
    // ws.onclose = () => setIsConnected(false);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   setLastUpdate(new Date());
    //   // Handle different types of updates (match results, registrations, etc.)
    // };

    // For now, simulate periodic updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(interval);
      // ws.close();
    };
  }, [tournamentId]);

  return {
    lastUpdate,
    isConnected,
  };
};

// Tournament Validation Hook
export const useTournamentValidation = () => {
  const validateTournamentData = useCallback(
    (data: CreateTournamentRequest) => {
      const errors: Record<string, string> = {};

      if (!data.name || data.name.trim().length < 3) {
        errors.name = "Tournament name must be at least 3 characters long";
      }

      if (!data.start_time) {
        errors.start_time = "Start time is required";
      }

      if (!data.registration_deadline) {
        errors.registration_deadline = "Registration deadline is required";
      }

      if (
        data.registration_deadline &&
        data.start_time &&
        new Date(data.registration_deadline) >= new Date(data.start_time)
      ) {
        errors.registration_deadline =
          "Registration deadline must be before start time";
      }

      if (data.min_participants < 2) {
        errors.min_participants = "Minimum participants must be at least 2";
      }

      if (data.max_participants < data.min_participants) {
        errors.max_participants =
          "Maximum participants must be greater than minimum participants";
      }

      if (data.entry_fee_credits < 0) {
        errors.entry_fee_credits = "Entry fee cannot be negative";
      }

      if (data.min_level < 1 || data.min_level > 10) {
        errors.min_level = "Minimum level must be between 1 and 10";
      }

      if (data.max_level && data.max_level < data.min_level) {
        errors.max_level = "Maximum level must be greater than minimum level";
      }

      return {
        errors,
        isValid: Object.keys(errors).length === 0,
      };
    },
    []
  );

  return {
    validateTournamentData,
  };
};

export default {
  useTournaments,
  useTournamentDetails,
  useTournamentRegistration,
  useTournamentCreation,
  useTournamentBracket,
  useTournamentMatches,
  useTournamentStatistics,
  useTournamentFilters,
  useTournamentPermissions,
  useTournamentUpdates,
  useTournamentValidation,
};
