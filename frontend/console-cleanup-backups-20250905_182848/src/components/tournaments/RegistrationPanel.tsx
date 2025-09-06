import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from "@mui/material";
import {
  PersonAdd,
  PersonRemove,
  Warning,
  AccessTime,
  AccountBalanceWallet,
  EmojiEvents,
} from "@mui/icons-material";
import { formatDistanceToNow, isBefore } from "date-fns";
import { useSafeAuth } from "../../SafeAuthContext";
import { tournamentService, Tournament } from "../../services/api";

interface RegistrationPanelProps {
  tournament: Tournament;
  canRegister: boolean;
  canWithdraw: boolean;
  userParticipation?: any;
  onRegistrationChange: () => void;
}

const RegistrationPanel: React.FC<RegistrationPanelProps> = ({
  tournament,
  canRegister,
  canWithdraw,
  userParticipation,
  onRegistrationChange,
}) => {
  const { state } = useSafeAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "register" | "withdraw" | null;
  }>({
    open: false,
    action: null,
  });

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      await tournamentService.registerForTournament(tournament.id);
      setConfirmDialog({ open: false, action: null });
      onRegistrationChange();
    } catch (err: any) {
      setError(err.message || "Failed to register for tournament");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    setError(null);
    try {
      await tournamentService.withdrawFromTournament(tournament.id);
      setConfirmDialog({ open: false, action: null });
      onRegistrationChange();
    } catch (err: any) {
      setError(err.message || "Failed to withdraw from tournament");
    } finally {
      setLoading(false);
    }
  };

  const hasEnoughCredits =
    (state.user?.credits || 0) >= tournament.entry_fee_credits;
  const isRegistrationOpen = tournament.is_registration_open;
  const isDeadlinePassed = isBefore(
    new Date(tournament.registration_deadline),
    new Date()
  );
  const isTournamentFull = tournament.is_full;
  const isLevelEligible =
    (state.user?.level || 1) >= tournament.min_level &&
    (!tournament.max_level || (state.user?.level || 1) <= tournament.max_level);

  const getRegistrationStatus = () => {
    if (userParticipation) {
      return {
        status: "registered",
        message: "You are registered for this tournament",
        color: "success" as const,
        icon: <EmojiEvents />,
      };
    }

    if (!isRegistrationOpen) {
      return {
        status: "closed",
        message: "Registration is closed",
        color: "error" as const,
        icon: <Warning />,
      };
    }

    if (isDeadlinePassed) {
      return {
        status: "deadline_passed",
        message: "Registration deadline has passed",
        color: "error" as const,
        icon: <AccessTime />,
      };
    }

    if (isTournamentFull) {
      return {
        status: "full",
        message: "Tournament is full",
        color: "error" as const,
        icon: <Warning />,
      };
    }

    if (!isLevelEligible) {
      return {
        status: "level_ineligible",
        message: `Level ${tournament.min_level}${tournament.max_level ? `-${tournament.max_level}` : "+"} required`,
        color: "warning" as const,
        icon: <Warning />,
      };
    }

    if (!hasEnoughCredits) {
      return {
        status: "insufficient_credits",
        message: `Need ${tournament.entry_fee_credits} credits (you have ${state.user?.credits || 0})`,
        color: "warning" as const,
        icon: <AccountBalanceWallet />,
      };
    }

    return {
      status: "available",
      message: "Registration available",
      color: "success" as const,
      icon: <PersonAdd />,
    };
  };

  const registrationStatus = getRegistrationStatus();

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Registration Status
          </Typography>

          {/* Status Chip */}
          <Box sx={{ mb: 2 }}>
            <Chip
              label={registrationStatus.message}
              color={registrationStatus.color}
              icon={registrationStatus.icon}
              sx={{ width: "100%", justifyContent: "flex-start" }}
            />
          </Box>

          {/* Tournament Details */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Entry Fee: {tournament.entry_fee_credits} credits
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Your Credits: {state.user?.credits || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Deadline:{" "}
              {formatDistanceToNow(new Date(tournament.registration_deadline), {
                addSuffix: true,
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Spots: {tournament.current_participants}/
              {tournament.max_participants}
            </Typography>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Tournament Capacity
            </Typography>
            <LinearProgress
              variant="determinate"
              value={
                (tournament.current_participants /
                  tournament.max_participants) *
                100
              }
              color={isTournamentFull ? "error" : "primary"}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {userParticipation ? (
              // User is registered - show withdraw option
              <Button
                variant="outlined"
                color="error"
                startIcon={<PersonRemove />}
                onClick={() =>
                  setConfirmDialog({ open: true, action: "withdraw" })
                }
                disabled={loading || !canWithdraw}
                fullWidth
              >
                Withdraw from Tournament
              </Button>
            ) : (
              // User is not registered - show register option
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() =>
                  setConfirmDialog({ open: true, action: "register" })
                }
                disabled={
                  loading ||
                  !canRegister ||
                  registrationStatus.status !== "available"
                }
                fullWidth
              >
                Register for Tournament
              </Button>
            )}

            {/* Credit Purchase Button (if insufficient credits) */}
            {!hasEnoughCredits && !userParticipation && (
              <Button
                variant="outlined"
                startIcon={<AccountBalanceWallet />}
                onClick={() => window.open("/credits", "_blank")}
                fullWidth
                size="small"
              >
                Get More Credits
              </Button>
            )}
          </Box>

          {/* Additional Info */}
          {tournament.status === "in_progress" && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Tournament is currently in progress. Check the bracket for match
              updates.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.action === "register"
            ? "Register for Tournament"
            : "Withdraw from Tournament"}
        </DialogTitle>
        <DialogContent>
          {confirmDialog.action === "register" ? (
            <Box>
              <Typography paragraph>
                Are you sure you want to register for "{tournament.name}"?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Entry fee: {tournament.entry_fee_credits} credits will be
                deducted
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • You will be committed to participate in the tournament
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Withdrawal may have penalties depending on timing
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography paragraph>
                Are you sure you want to withdraw from "{tournament.name}"?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • You may not receive a full refund of your entry fee
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Your spot will be made available to other players
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, action: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={
              confirmDialog.action === "register"
                ? handleRegister
                : handleWithdraw
            }
            variant="contained"
            color={confirmDialog.action === "register" ? "primary" : "error"}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : confirmDialog.action === "register"
                ? "Register"
                : "Withdraw"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegistrationPanel;
