# === backend/app/services/game_result_service.py ===
# Game Result Service - Business Logic for Result Tracking - JAVÍTOTT VERZIÓ

from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging

from ..models.game_results import (
    GameResult,
    PlayerStatistics,
    Leaderboard,
    GameResultStatus,
    PerformanceLevel,
    SkillCategory,
)
from ..models.user import User
from ..models.location import GameSession, GameDefinition

logger = logging.getLogger(__name__)


class GameResultService:
    """
    Service for managing game results and performance tracking
    """

    def __init__(self, db: Session):
        self.db = db

    # === RESULT RECORDING ===

    def record_game_result(
        self,
        session_id: str,
        user_id: int,
        result_data: Dict,
        recorded_by_id: Optional[int] = None,
    ) -> GameResult:
        """
        Record a game result with comprehensive performance tracking
        """
        try:
            # Validate session exists and is completed
            session = (
                self.db.query(GameSession)
                .filter(GameSession.session_id == session_id)
                .first()
            )

            if not session:
                raise ValueError(f"Game session {session_id} not found")

            if session.status != "completed":
                raise ValueError(
                    f"Cannot record results for session with status: {session.status}"
                )

            # Get game definition for XP calculation
            game_definition = (
                self.db.query(GameDefinition)
                .filter(GameDefinition.id == session.game_definition_id)
                .first()
            )

            if not game_definition:
                raise ValueError(f"Game definition not found for session {session_id}")

            # Check if result already exists
            existing_result = (
                self.db.query(GameResult)
                .filter(
                    GameResult.session_id == session_id, GameResult.user_id == user_id
                )
                .first()
            )

            if existing_result:
                raise ValueError(
                    f"Result already recorded for user {user_id} in session {session_id}"
                )

            # Calculate performance percentage
            final_score = float(result_data.get("final_score", 0))
            max_possible = float(result_data.get("max_possible_score", 100))
            performance_percentage = (
                (final_score / max_possible) * 100 if max_possible > 0 else 0
            )

            # Create game result
            game_result = GameResult(
                session_id=session_id,
                user_id=user_id,
                final_score=final_score,
                max_possible_score=max_possible,
                performance_percentage=performance_percentage,
                recorded_by_id=recorded_by_id,
                game_completed_at=session.end_time or datetime.utcnow(),
            )

            # Set game-specific scores
            game_result.accuracy_score = result_data.get("accuracy_score")
            game_result.speed_score = result_data.get("speed_score")
            game_result.technique_score = result_data.get("technique_score")
            game_result.consistency_score = result_data.get("consistency_score")

            # Set attempt data
            game_result.attempts_made = result_data.get("attempts_made", 0)
            game_result.successful_attempts = result_data.get("successful_attempts", 0)
            game_result.time_taken_seconds = result_data.get("time_taken_seconds")

            # Set detailed metrics
            game_result.detailed_metrics = result_data.get("detailed_metrics", {})

            # Calculate performance level
            game_result.performance_level = game_result.calculate_performance_level()

            # Set skills demonstrated based on scores
            skills_demonstrated = []
            if game_result.accuracy_score and game_result.accuracy_score >= 70:
                skills_demonstrated.append(SkillCategory.ACCURACY.value)
            if game_result.speed_score and game_result.speed_score >= 70:
                skills_demonstrated.append(SkillCategory.SPEED.value)
            if game_result.technique_score and game_result.technique_score >= 70:
                skills_demonstrated.append(SkillCategory.TECHNIQUE.value)
            if game_result.consistency_score and game_result.consistency_score >= 70:
                skills_demonstrated.append(SkillCategory.CONSISTENCY.value)

            game_result.skills_demonstrated = skills_demonstrated

            # Identify areas for improvement
            areas_for_improvement = []
            if game_result.accuracy_score and game_result.accuracy_score < 60:
                areas_for_improvement.append("accuracy")
            if game_result.speed_score and game_result.speed_score < 60:
                areas_for_improvement.append("speed")
            if game_result.technique_score and game_result.technique_score < 60:
                areas_for_improvement.append("technique")
            if game_result.consistency_score and game_result.consistency_score < 60:
                areas_for_improvement.append("consistency")

            game_result.areas_for_improvement = areas_for_improvement

            # Calculate XP reward
            xp_earned = game_result.calculate_xp_reward(game_definition)

            # Set coach notes
            game_result.coach_notes = result_data.get("coach_notes")

            # Set status
            game_result.status = GameResultStatus.RECORDED

            # Save result
            self.db.add(game_result)
            self.db.commit()
            self.db.refresh(game_result)

            logger.info(
                f"Game result recorded: Session {session_id}, User {user_id}, Score {final_score}, XP {xp_earned}"
            )

            # Update player statistics
            self._update_player_statistics(user_id, game_result, game_definition)

            # Award XP to user
            self._award_xp_to_user(user_id, xp_earned)

            return game_result

        except Exception as e:
            logger.error(f"Error recording game result: {str(e)}")
            self.db.rollback()
            raise

    def update_game_result(
        self, result_id: int, update_data: Dict, updated_by_id: int
    ) -> GameResult:
        """
        Update an existing game result
        """
        result = self.db.query(GameResult).filter(GameResult.id == result_id).first()
        if not result:
            raise ValueError(f"Game result {result_id} not found")

        # Update fields
        for field, value in update_data.items():
            if hasattr(result, field) and field not in ["id", "session_id", "user_id"]:
                setattr(result, field, value)

        # Recalculate derived fields
        if "final_score" in update_data or "max_possible_score" in update_data:
            result.performance_percentage = (
                result.final_score / result.max_possible_score
            ) * 100
            result.performance_level = result.calculate_performance_level()

        result.last_updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(result)

        logger.info(f"Game result updated: ID {result_id} by user {updated_by_id}")

        return result

    # === STATISTICS MANAGEMENT ===

    def _update_player_statistics(
        self, user_id: int, game_result: GameResult, game_definition: GameDefinition
    ):
        """
        Update player statistics with new game result
        """
        # Get or create player statistics
        stats = (
            self.db.query(PlayerStatistics)
            .filter(PlayerStatistics.user_id == user_id)
            .first()
        )

        if not stats:
            stats = PlayerStatistics(user_id=user_id)
            self.db.add(stats)

        # Update statistics
        stats.update_with_new_result(game_result, game_definition)

        self.db.commit()
        logger.info(f"Player statistics updated for user {user_id}")

    def _award_xp_to_user(self, user_id: int, xp_amount: int):
        """
        Award XP to user and handle level progression
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return

        # Award XP and check for level up
        old_level = user.level
        level_up_info = user.add_xp(xp_amount)

        # Update game counts
        user.games_played = (user.games_played or 0) + 1

        self.db.commit()

        if level_up_info["level_up"]:
            logger.info(f"User {user_id} leveled up: {old_level} -> {user.level}")

        logger.info(f"Awarded {xp_amount} XP to user {user_id} (Total: {user.xp})")

    # === RESULT RETRIEVAL ===

    def get_user_results(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        game_type: Optional[str] = None,
    ) -> List[GameResult]:
        """
        Get game results for a specific user
        """
        query = self.db.query(GameResult).filter(GameResult.user_id == user_id)

        if game_type:
            query = (
                query.join(GameSession)
                .join(GameDefinition)
                .filter(GameDefinition.game_type == game_type)
            )

        results = (
            query.order_by(desc(GameResult.game_completed_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return results

    def get_session_results(self, session_id: str) -> List[GameResult]:
        """
        Get all results for a specific game session
        """
        return (
            self.db.query(GameResult)
            .filter(GameResult.session_id == session_id)
            .order_by(desc(GameResult.final_score))
            .all()
        )

    def get_user_statistics(self, user_id: int) -> Optional[PlayerStatistics]:
        """
        Get comprehensive statistics for a user
        """
        return (
            self.db.query(PlayerStatistics)
            .filter(PlayerStatistics.user_id == user_id)
            .first()
        )

    # === LEADERBOARDS ===

    def generate_leaderboards(self):
        """
        Generate/update all leaderboard categories
        """
        categories = [
            ("overall", "average_score"),
            ("overall", "total_xp_earned_from_games"),
            ("game1", "avg_score"),
            ("game2", "avg_score"),
            ("game3", "avg_score"),
            ("accuracy", "accuracy_average"),
            ("speed", "speed_average"),
            ("technique", "technique_average"),
        ]

        for category, metric in categories:
            self._generate_category_leaderboard(category, metric)

    def _generate_category_leaderboard(self, category: str, metric: str):
        """
        Generate leaderboard for specific category
        """
        # Mark old entries as not current
        self.db.query(Leaderboard).filter(
            Leaderboard.category == category,
            Leaderboard.period == "all_time",
            Leaderboard.is_current == True,
        ).update({Leaderboard.is_current: False})

        # Get top performers
        if category == "overall":
            if metric == "average_score":
                query = (
                    self.db.query(PlayerStatistics, User)
                    .join(User)
                    .filter(PlayerStatistics.total_games_completed >= 5)
                    .order_by(desc(PlayerStatistics.average_score))
                    .limit(100)
                )
            else:  # total_xp_earned_from_games
                query = (
                    self.db.query(PlayerStatistics, User)
                    .join(User)
                    .order_by(desc(PlayerStatistics.total_xp_earned_from_games))
                    .limit(100)
                )
        else:
            # Game-specific or skill-specific leaderboards
            if category.startswith("game"):
                game_field = f"{category}_stats"
                query = (
                    self.db.query(PlayerStatistics, User)
                    .join(User)
                    .filter(
                        func.json_extract(
                            getattr(PlayerStatistics, game_field), "$.games_played"
                        )
                        >= 3
                    )
                    .order_by(
                        desc(
                            func.json_extract(
                                getattr(PlayerStatistics, game_field), "$.avg_score"
                            )
                        )
                    )
                    .limit(50)
                )
            else:  # skill-specific
                skill_field = f"{category}_average"
                query = (
                    self.db.query(PlayerStatistics, User)
                    .join(User)
                    .filter(getattr(PlayerStatistics, skill_field) > 0)
                    .order_by(desc(getattr(PlayerStatistics, skill_field)))
                    .limit(50)
                )

        # Create leaderboard entries
        rank = 1
        for stats, user in query.all():
            if category == "overall":
                score = getattr(stats, metric)
            elif category.startswith("game"):
                game_stats = getattr(stats, f"{category}_stats") or {}
                score = game_stats.get("avg_score", 0)
            else:  # skill
                score = getattr(stats, f"{category}_average", 0)

            leaderboard_entry = Leaderboard(
                user_id=user.id,
                category=category,
                period="all_time",
                rank=rank,
                score=score,
                metric_name=metric,
                games_considered=stats.total_games_completed,
                is_current=True,
            )

            self.db.add(leaderboard_entry)
            rank += 1

        self.db.commit()
        logger.info(f"Generated leaderboard for category: {category}")

    def get_leaderboard(
        self, category: str = "overall", period: str = "all_time", limit: int = 50
    ) -> List[Leaderboard]:
        """
        Get leaderboard for specific category and period
        """
        return (
            self.db.query(Leaderboard)
            .filter(
                Leaderboard.category == category,
                Leaderboard.period == period,
                Leaderboard.is_current == True,
            )
            .order_by(asc(Leaderboard.rank))
            .limit(limit)
            .all()
        )

    def get_user_rank(
        self, user_id: int, category: str = "overall", period: str = "all_time"
    ) -> Optional[int]:
        """
        Get user's rank in specific category
        """
        entry = (
            self.db.query(Leaderboard)
            .filter(
                Leaderboard.user_id == user_id,
                Leaderboard.category == category,
                Leaderboard.period == period,
                Leaderboard.is_current == True,
            )
            .first()
        )

        return entry.rank if entry else None

    # === ANALYTICS ===

    def get_performance_analytics(
        self, user_id: Optional[int] = None, days: int = 30
    ) -> Dict:
        """
        Get performance analytics for user or overall system
        """
        start_date = datetime.utcnow() - timedelta(days=days)

        query = self.db.query(GameResult).filter(
            GameResult.game_completed_at >= start_date
        )

        if user_id:
            query = query.filter(GameResult.user_id == user_id)

        results = query.all()

        if not results:
            return {"message": "No data available for the specified period"}

        # Calculate analytics
        total_games = len(results)
        avg_score = sum(r.final_score for r in results) / total_games
        avg_performance = sum(r.performance_percentage for r in results) / total_games

        performance_distribution = {}
        for level in PerformanceLevel:
            count = len([r for r in results if r.performance_level == level])
            performance_distribution[level.value] = {
                "count": count,
                "percentage": round((count / total_games) * 100, 1),
            }

        # Skill analytics
        skill_scores = {}
        for skill in [
            "accuracy_score",
            "speed_score",
            "technique_score",
            "consistency_score",
        ]:
            scores = [
                getattr(r, skill) for r in results if getattr(r, skill) is not None
            ]
            if scores:
                skill_scores[skill.replace("_score", "")] = {
                    "average": round(sum(scores) / len(scores), 1),
                    "count": len(scores),
                }

        return {
            "period_days": days,
            "total_games": total_games,
            "average_score": round(avg_score, 1),
            "average_performance_percentage": round(avg_performance, 1),
            "performance_distribution": performance_distribution,
            "skill_averages": skill_scores,
            "user_id": user_id,
        }


class LeaderboardService:
    """
    Specialized service for leaderboard management
    """

    def __init__(self, db: Session):
        self.db = db

    def get_top_performers(
        self, category: str = "overall", limit: int = 10
    ) -> List[Dict]:
        """
        Get top performers in a category with user details
        """
        leaderboard_entries = (
            self.db.query(Leaderboard, User)
            .join(User)
            .filter(
                Leaderboard.category == category,
                Leaderboard.period == "all_time",
                Leaderboard.is_current == True,
            )
            .order_by(asc(Leaderboard.rank))
            .limit(limit)
            .all()
        )

        top_performers = []
        for entry, user in leaderboard_entries:
            # Get recent game count
            recent_games = (
                self.db.query(GameResult)
                .filter(
                    GameResult.user_id == user.id,
                    GameResult.game_completed_at
                    >= datetime.utcnow() - timedelta(days=30),
                )
                .count()
            )

            top_performers.append(
                {
                    "rank": entry.rank,
                    "user_id": user.id,
                    "username": user.username,
                    "display_name": user.display_name or user.username,
                    "level": user.level,
                    "score": entry.score,
                    "metric": entry.metric_name,
                    "games_played": entry.games_considered,
                    "recent_activity": recent_games,
                    "category": category,
                }
            )

        return top_performers

    def get_user_leaderboard_position(self, user_id: int) -> Dict:
        """
        Get user's position across all leaderboard categories
        """
        positions = {}

        categories = [
            "overall",
            "game1",
            "game2",
            "game3",
            "accuracy",
            "speed",
            "technique",
        ]

        for category in categories:
            entry = (
                self.db.query(Leaderboard)
                .filter(
                    Leaderboard.user_id == user_id,
                    Leaderboard.category == category,
                    Leaderboard.period == "all_time",
                    Leaderboard.is_current == True,
                )
                .first()
            )

            if entry:
                # Get total participants in this category
                total_participants = (
                    self.db.query(Leaderboard)
                    .filter(
                        Leaderboard.category == category,
                        Leaderboard.period == "all_time",
                        Leaderboard.is_current == True,
                    )
                    .count()
                )

                positions[category] = {
                    "rank": entry.rank,
                    "score": entry.score,
                    "total_participants": total_participants,
                    "percentile": round(
                        (1 - (entry.rank - 1) / total_participants) * 100, 1
                    ),
                }

        return positions
