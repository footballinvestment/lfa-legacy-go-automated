#!/usr/bin/env python3
"""
LFA Legacy GO - JAVÍTOTT Test Database Cleanup Utility
TELJES JAVÍTOTT VERZIÓ - backend/test_cleanup.py

Cleans up test data from the database with proper schema detection.
Removes test users, sessions, and related data.
"""

import os
import sys
import sqlite3
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

# Database configuration
DATABASE_PATH = "./lfa_legacy_go.db"

class DatabaseCleanup:
    """Database cleanup utility for test data with schema detection"""
    
    def __init__(self, db_path: str = DATABASE_PATH):
        self.db_path = db_path
        self.stats = {
            "users_deleted": 0,
            "sessions_deleted": 0,
            "friend_requests_deleted": 0,
            "friendships_deleted": 0,
            "bookings_deleted": 0,
            "game_results_deleted": 0,
            "challenges_deleted": 0,
            "tournaments_deleted": 0
        }
        self.table_schemas = {}
    
    def connect(self) -> sqlite3.Connection:
        """Create database connection"""
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Database file not found: {self.db_path}")
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        return conn
    
    def detect_table_schema(self, conn: sqlite3.Connection):
        """Detect table schemas to use correct column names"""
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"🔍 Detecting schema for {len(tables)} tables...")
        
        # Analyze each table's columns
        for table in tables:
            try:
                cursor.execute(f"PRAGMA table_info({table})")
                columns = [row[1] for row in cursor.fetchall()]  # row[1] is column name
                self.table_schemas[table] = columns
                print(f"   → {table}: {', '.join(columns[:5])}{'...' if len(columns) > 5 else ''}")
            except Exception as e:
                print(f"   ⚠️ Could not analyze {table}: {str(e)}")
        
        return self.table_schemas
    
    def get_test_users(self, conn: sqlite3.Connection) -> List[int]:
        """Identify test users to be deleted"""
        cursor = conn.cursor()
        
        # Test user patterns
        test_patterns = [
            "username LIKE '%test%'",
            "username LIKE '%karol%'", 
            "username LIKE '%anna%'",
            "username LIKE '%bela%'",
            "username LIKE '%_gamer%'",
            "username LIKE '%_player%'", 
            "username LIKE '%_champion%'",
            "email LIKE '%example.com%'",
            "email LIKE '%test%'",
            "full_name LIKE '%Káról%'",
            "full_name LIKE '%Anna%'",
            "full_name LIKE '%Béla%'",
            "created_at > datetime('now', '-24 hours')"  # Recent test users
        ]
        
        # Combine patterns with OR
        where_clause = " OR ".join(test_patterns)
        
        query = f"""
        SELECT id, username, email, full_name, created_at 
        FROM users 
        WHERE {where_clause}
        ORDER BY created_at DESC
        """
        
        try:
            cursor.execute(query)
            test_users = cursor.fetchall()
            
            print(f"🔍 Found {len(test_users)} test users:")
            for user in test_users:
                created_date = user['created_at'][:10] if user['created_at'] else "unknown"
                print(f"   → {user['username']} ({user['email']}) - {created_date}")
            
            return [user['id'] for user in test_users]
        except Exception as e:
            print(f"⚠️ Error finding test users: {str(e)}")
            return []
    
    def cleanup_user_sessions(self, conn: sqlite3.Connection, user_ids: List[int]) -> int:
        """Clean up user sessions for test users"""
        if not user_ids or 'user_sessions' not in self.table_schemas:
            return 0
        
        cursor = conn.cursor()
        deleted = 0
        
        # Check what columns exist in user_sessions
        session_columns = self.table_schemas['user_sessions']
        user_id_column = None
        
        # Find the correct user ID column
        possible_user_columns = ['user_id', 'id', 'owner_id', 'session_user_id']
        for col in possible_user_columns:
            if col in session_columns:
                user_id_column = col
                break
        
        if not user_id_column:
            print(f"⚠️ Could not find user ID column in user_sessions. Columns: {session_columns}")
            return 0
        
        try:
            # Delete sessions for test users
            placeholders = ','.join(['?'] * len(user_ids))
            query = f"DELETE FROM user_sessions WHERE {user_id_column} IN ({placeholders})"
            cursor.execute(query, user_ids)
            deleted = cursor.rowcount
            
            # Also clean up orphaned sessions
            cursor.execute(f"DELETE FROM user_sessions WHERE {user_id_column} NOT IN (SELECT id FROM users)")
            deleted += cursor.rowcount
            
            print(f"   → Cleaned user_sessions: {deleted} records")
            
        except Exception as e:
            print(f"⚠️ Error cleaning user_sessions: {str(e)}")
        
        return deleted
    
    def cleanup_friend_requests(self, conn: sqlite3.Connection, user_ids: List[int]) -> int:
        """Clean up friend requests involving test users"""
        if not user_ids or 'friend_requests' not in self.table_schemas:
            return 0
        
        cursor = conn.cursor()
        deleted = 0
        
        try:
            placeholders = ','.join(['?'] * len(user_ids))
            
            # Delete friend requests where test users are involved
            # Schema shows sender_id and receiver_id columns
            cursor.execute(f"DELETE FROM friend_requests WHERE sender_id IN ({placeholders})", user_ids)
            deleted += cursor.rowcount
            
            cursor.execute(f"DELETE FROM friend_requests WHERE receiver_id IN ({placeholders})", user_ids)
            deleted += cursor.rowcount
            
            # Clean up orphaned requests
            cursor.execute("""
                DELETE FROM friend_requests 
                WHERE sender_id NOT IN (SELECT id FROM users) 
                   OR receiver_id NOT IN (SELECT id FROM users)
            """)
            deleted += cursor.rowcount
            
            print(f"   → Cleaned friend_requests: {deleted} records")
            
        except Exception as e:
            print(f"⚠️ Error cleaning friend_requests: {str(e)}")
        
        return deleted
    
    def cleanup_friendships(self, conn: sqlite3.Connection, user_ids: List[int]) -> int:
        """Clean up friendships involving test users"""
        if not user_ids or 'friendships' not in self.table_schemas:
            return 0
        
        cursor = conn.cursor()
        deleted = 0
        
        try:
            placeholders = ','.join(['?'] * len(user_ids))
            
            # Schema shows user1_id and user2_id columns
            cursor.execute(f"DELETE FROM friendships WHERE user1_id IN ({placeholders})", user_ids)
            deleted += cursor.rowcount
            
            cursor.execute(f"DELETE FROM friendships WHERE user2_id IN ({placeholders})", user_ids)
            deleted += cursor.rowcount
            
            print(f"   → Cleaned friendships: {deleted} records")
            
        except Exception as e:
            print(f"⚠️ Error cleaning friendships: {str(e)}")
        
        return deleted
    
    def cleanup_game_sessions(self, conn: sqlite3.Connection, user_ids: List[int]) -> int:
        """Clean up game sessions (bookings) for test users"""
        if not user_ids or 'game_sessions' not in self.table_schemas:
            return 0
        
        cursor = conn.cursor()
        deleted = 0
        
        try:
            # Schema shows booked_by_id column (not user_id)
            placeholders = ','.join(['?'] * len(user_ids))
            cursor.execute(f"DELETE FROM game_sessions WHERE booked_by_id IN ({placeholders})", user_ids)
            deleted = cursor.rowcount
            
            # Clean up orphaned sessions
            cursor.execute("DELETE FROM game_sessions WHERE booked_by_id NOT IN (SELECT id FROM users)")
            deleted += cursor.rowcount
            
            print(f"   → Cleaned game_sessions: {deleted} records")
            
        except Exception as e:
            print(f"⚠️ Error cleaning game_sessions: {str(e)}")
        
        return deleted
    
    def cleanup_game_results(self, conn: sqlite3.Connection, user_ids: List[int]) -> int:
        """Clean up game results for test users"""
        if not user_ids or 'game_results' not in self.table_schemas:
            return 0
        
        cursor = conn.cursor()
        deleted = 0
        
        try:
            # Check if recorded_by_id column exists
            game_results_columns = self.table_schemas['game_results']
            
            placeholders = ','.join(['?'] * len(user_ids))
            
            if 'recorded_by_id' in game_results_columns:
                cursor.execute(f"DELETE FROM game_results WHERE recorded_by_id IN ({placeholders})", user_ids)
                deleted += cursor.rowcount
            
            print(f"   → Cleaned game_results: {deleted} records")
            
        except Exception as e:
            print(f"⚠️ Error cleaning game_results: {str(e)}")
        
        return deleted
    
    def cleanup_challenges(self, conn: sqlite3.Connection, user_ids: List[int]) -> int:
        """Clean up challenges involving test users"""
        if not user_ids or 'challenges' not in self.table_schemas:
            return 0
        
        cursor = conn.cursor()
        deleted = 0
        
        try:
            placeholders = ','.join(['?'] * len(user_ids))
            
            # Schema shows challenger_id and challenged_id columns
            cursor.execute(f"DELETE FROM challenges WHERE challenger_id IN ({placeholders})", user_ids)
            deleted += cursor.rowcount
            
            cursor.execute(f"DELETE FROM challenges WHERE challenged_id IN ({placeholders})", user_ids)
            deleted += cursor.rowcount
            
            print(f"   → Cleaned challenges: {deleted} records")
            
        except Exception as e:
            print(f"⚠️ Error cleaning challenges: {str(e)}")
        
        return deleted
    
    def cleanup_tournaments(self, conn: sqlite3.Connection, user_ids: List[int]) -> int:
        """Clean up tournament participations for test users"""
        if not user_ids:
            return 0
        
        cursor = conn.cursor()
        deleted = 0
        
        try:
            # Check if tournament_participants table exists
            if 'tournament_participants' in self.table_schemas:
                placeholders = ','.join(['?'] * len(user_ids))
                # Schema likely shows user_id column
                cursor.execute(f"DELETE FROM tournament_participants WHERE user_id IN ({placeholders})", user_ids)
                deleted += cursor.rowcount
            
            print(f"   → Cleaned tournament_participants: {deleted} records")
            
        except Exception as e:
            print(f"⚠️ Error cleaning tournament_participants: {str(e)}")
        
        return deleted
    
    def cleanup_users(self, conn: sqlite3.Connection, user_ids: List[int]) -> int:
        """Delete test users"""
        if not user_ids:
            return 0
        
        cursor = conn.cursor()
        try:
            placeholders = ','.join(['?'] * len(user_ids))
            query = f"DELETE FROM users WHERE id IN ({placeholders})"
            cursor.execute(query, user_ids)
            deleted = cursor.rowcount
            
            print(f"   → Cleaned users: {deleted} records")
            return deleted
            
        except Exception as e:
            print(f"⚠️ Error cleaning users: {str(e)}")
            return 0
    
    def run_cleanup(self, dry_run: bool = False) -> Dict[str, int]:
        """Run complete cleanup process with schema detection"""
        print("🧹 Starting database cleanup...")
        
        try:
            conn = self.connect()
            
            # Detect table schemas first
            self.detect_table_schema(conn)
            
            # Get test users
            test_user_ids = self.get_test_users(conn)
            
            if not test_user_ids:
                print("✅ No test users found - database is clean")
                conn.close()
                return self.stats
            
            if dry_run:
                print(f"\n🔍 DRY RUN - Would delete {len(test_user_ids)} test users and related data")
                print(f"Available tables: {list(self.table_schemas.keys())}")
                conn.close()
                return self.stats
            
            print(f"\n🗑️ Deleting {len(test_user_ids)} test users and related data...")
            
            # Clean up in order (most dependent first)
            self.stats["sessions_deleted"] = self.cleanup_user_sessions(conn, test_user_ids)
            self.stats["friend_requests_deleted"] = self.cleanup_friend_requests(conn, test_user_ids)
            self.stats["friendships_deleted"] = self.cleanup_friendships(conn, test_user_ids)
            self.stats["bookings_deleted"] = self.cleanup_game_sessions(conn, test_user_ids)
            self.stats["game_results_deleted"] = self.cleanup_game_results(conn, test_user_ids)
            self.stats["challenges_deleted"] = self.cleanup_challenges(conn, test_user_ids)
            self.stats["tournaments_deleted"] = self.cleanup_tournaments(conn, test_user_ids)
            
            # Finally delete users
            self.stats["users_deleted"] = self.cleanup_users(conn, test_user_ids)
            
            # Commit changes
            conn.commit()
            conn.close()
            
            # Print results
            print("✅ Cleanup completed successfully:")
            for key, value in self.stats.items():
                if value > 0:
                    print(f"   → {key.replace('_', ' ').title()}: {value}")
            
            return self.stats
            
        except Exception as e:
            print(f"❌ Cleanup failed: {str(e)}")
            if 'conn' in locals():
                try:
                    conn.rollback()
                    conn.close()
                except:
                    pass
            raise
    
    def vacuum_database(self):
        """Vacuum database to reclaim space"""
        print("🔧 Vacuuming database...")
        try:
            conn = self.connect()
            conn.execute("VACUUM")
            conn.close()
            print("✅ Database vacuumed successfully")
        except Exception as e:
            print(f"⚠️ Vacuum failed: {str(e)}")

def reset_auto_increment(db_path: str = DATABASE_PATH):
    """Reset auto-increment counters for clean test IDs"""
    print("🔄 Resetting auto-increment counters...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Reset auto-increment for main tables
        tables_to_reset = [
            'users', 'user_sessions', 'friend_requests', 'friendships',
            'game_sessions', 'game_results', 'challenges', 'tournaments'
        ]
        
        reset_count = 0
        for table in tables_to_reset:
            try:
                # Check if table exists
                cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
                if cursor.fetchone():
                    # Reset auto-increment
                    cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}'")
                    reset_count += 1
                    print(f"   → Reset {table}")
            except Exception as e:
                # Skip if table doesn't exist or doesn't have auto-increment
                pass
        
        conn.commit()
        conn.close()
        print(f"✅ Auto-increment counters reset for {reset_count} tables")
        
    except Exception as e:
        print(f"⚠️ Auto-increment reset failed: {str(e)}")

def show_database_info(db_path: str = DATABASE_PATH):
    """Show database information for debugging"""
    print("📊 Database Information:")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"   Total tables: {len(tables)}")
        
        # Show user count
        try:
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            print(f"   Total users: {user_count}")
        except:
            print("   Users table: not found or error")
        
        # Show recent activity
        try:
            cursor.execute("SELECT COUNT(*) FROM users WHERE created_at > datetime('now', '-24 hours')")
            recent_users = cursor.fetchone()[0]
            print(f"   Recent users (24h): {recent_users}")
        except:
            print("   Recent users: could not determine")
        
        conn.close()
        
    except Exception as e:
        print(f"   Error: {str(e)}")

def main():
    """Main cleanup execution"""
    parser = argparse.ArgumentParser(description="Clean up test data from LFA Legacy GO database")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be deleted without actually deleting")
    parser.add_argument("--vacuum", action="store_true", help="Vacuum database after cleanup")
    parser.add_argument("--reset-counters", action="store_true", help="Reset auto-increment counters")
    parser.add_argument("--info", action="store_true", help="Show database information")
    parser.add_argument("--db-path", default=DATABASE_PATH, help="Path to database file")
    
    args = parser.parse_args()
    
    print("🗃️ LFA Legacy GO - Test Database Cleanup")
    print("=" * 50)
    
    # Show database info if requested
    if args.info:
        show_database_info(args.db_path)
        return 0
    
    # Initialize cleanup
    cleanup = DatabaseCleanup(args.db_path)
    
    try:
        # Run cleanup
        stats = cleanup.run_cleanup(dry_run=args.dry_run)
        
        if not args.dry_run:
            # Reset auto-increment if requested
            if args.reset_counters:
                reset_auto_increment(args.db_path)
            
            # Vacuum database if requested
            if args.vacuum:
                cleanup.vacuum_database()
            
            print(f"\n🎯 Summary: Cleaned {stats['users_deleted']} test users and related data")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Cleanup failed: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)