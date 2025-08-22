#!/usr/bin/env python3
"""
PostgreSQL Performance Optimization Analysis
Identifies slow queries and optimization opportunities
"""

import time
import json
from datetime import datetime, timedelta
from sqlalchemy import text
from app.core.database_production import db_config


def analyze_query_performance():
    """Analyze and optimize database query performance"""
    
    print("🔍 PHASE 2.2: PostgreSQL Performance Analysis")
    print("=" * 60)
    
    results = {
        "timestamp": datetime.utcnow().isoformat(),
        "analysis": {},
        "recommendations": []
    }
    
    with db_config.get_connection() as conn:
        
        # 1. Check query statistics
        print("\n📊 Query Performance Statistics:")
        query_stats = """
        SELECT 
            query,
            calls,
            total_time,
            mean_time,
            stddev_time,
            rows
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY total_time DESC 
        LIMIT 10;
        """
        
        try:
            result = conn.execute(text(query_stats))
            stats = []
            for row in result:
                stats.append({
                    "query": row[0][:100] + "..." if len(row[0]) > 100 else row[0],
                    "calls": row[1],
                    "total_time_ms": round(row[2], 2),
                    "mean_time_ms": round(row[3], 2),
                    "rows": row[5]
                })
            results["analysis"]["slow_queries"] = stats
            
            for stat in stats[:5]:
                print(f"  Query: {stat['query']}")
                print(f"  Calls: {stat['calls']}, Avg Time: {stat['mean_time_ms']}ms")
                print()
                
        except Exception as e:
            print(f"  ⚠️ pg_stat_statements not available: {e}")
            results["analysis"]["slow_queries"] = "Extension not available"
        
        # 2. Table scan analysis
        print("\n📋 Table Scan Analysis:")
        scan_analysis = """
        SELECT 
            schemaname,
            relname as tablename,
            seq_scan,
            seq_tup_read,
            idx_scan,
            idx_tup_fetch,
            CASE 
                WHEN seq_scan + idx_scan > 0 THEN 
                    ROUND(100.0 * seq_scan / (seq_scan + idx_scan), 2)
                ELSE 0 
            END as seq_scan_percent
        FROM pg_stat_user_tables 
        WHERE seq_scan + idx_scan > 0
        ORDER BY seq_scan DESC;
        """
        
        result = conn.execute(text(scan_analysis))
        table_scans = []
        
        for row in result:
            table_data = {
                "table": row[1],
                "sequential_scans": row[2],
                "seq_tuples_read": row[3], 
                "index_scans": row[4] or 0,
                "idx_tuples_fetch": row[5] or 0,
                "seq_scan_percentage": row[6]
            }
            table_scans.append(table_data)
            
            if table_data["seq_scan_percentage"] > 50:
                print(f"  ⚠️ {table_data['table']}: {table_data['seq_scan_percentage']}% sequential scans")
                results["recommendations"].append(
                    f"Consider adding indexes to {table_data['table']} table"
                )
        
        results["analysis"]["table_scans"] = table_scans
        
        # 3. Index usage analysis
        print("\n📇 Index Usage Analysis:")
        index_usage = """
        SELECT 
            t.relname as table_name,
            indexrelname as index_name,
            idx_scan as times_used,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
            idx_tup_read as tuples_read,
            idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        JOIN pg_stat_user_tables t ON t.relid = pg_stat_user_indexes.relid
        WHERE idx_scan = 0
        ORDER BY pg_relation_size(indexrelid) DESC;
        """
        
        result = conn.execute(text(index_usage))
        unused_indexes = []
        
        for row in result:
            unused_idx = {
                "table": row[0],
                "index_name": row[1],
                "size": row[3],
                "times_used": row[2]
            }
            unused_indexes.append(unused_idx)
            print(f"  🔍 Unused index: {unused_idx['index_name']} on {unused_idx['table']} ({unused_idx['size']})")
        
        results["analysis"]["unused_indexes"] = unused_indexes
        
        if len(unused_indexes) > 0:
            results["recommendations"].append("Review and potentially drop unused indexes")
        
        # 4. Connection and lock analysis  
        print("\n🔗 Connection & Lock Analysis:")
        connection_analysis = """
        SELECT 
            state,
            COUNT(*) as connection_count,
            AVG(EXTRACT(EPOCH FROM (now() - state_change))) as avg_duration_seconds
        FROM pg_stat_activity 
        WHERE pid != pg_backend_pid()
        GROUP BY state
        ORDER BY connection_count DESC;
        """
        
        result = conn.execute(text(connection_analysis))
        connections = []
        
        for row in result:
            conn_data = {
                "state": row[0],
                "count": row[1],
                "avg_duration": round(row[2] or 0, 2)
            }
            connections.append(conn_data)
            print(f"  {conn_data['state']}: {conn_data['count']} connections (avg: {conn_data['avg_duration']}s)")
        
        results["analysis"]["connections"] = connections
        
        # 5. Database size analysis
        print("\n💾 Database Size Analysis:")
        size_analysis = """
        SELECT 
            schemaname,
            relname as tablename,
            pg_size_pretty(pg_total_relation_size(relid)) as total_size,
            pg_size_pretty(pg_relation_size(relid)) as table_size,
            pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size,
            n_live_tup as row_count
        FROM pg_stat_user_tables 
        ORDER BY pg_total_relation_size(relid) DESC 
        LIMIT 10;
        """
        
        result = conn.execute(text(size_analysis))
        table_sizes = []
        
        for row in result:
            size_data = {
                "table": row[1],
                "total_size": row[2],
                "table_size": row[3], 
                "index_size": row[4],
                "row_count": row[5]
            }
            table_sizes.append(size_data)
            print(f"  {size_data['table']}: {size_data['total_size']} total ({size_data['row_count']} rows)")
        
        results["analysis"]["table_sizes"] = table_sizes
        
    # 6. Performance recommendations
    print("\n💡 Performance Optimization Recommendations:")
    
    if len(results["recommendations"]) == 0:
        results["recommendations"] = [
            "Database is well optimized with proper indexes",
            "Consider implementing Redis caching for frequent queries",
            "Monitor query performance as data grows",
            "Enable pg_stat_statements for detailed query analysis"
        ]
    
    for i, rec in enumerate(results["recommendations"], 1):
        print(f"  {i}. {rec}")
    
    # Save analysis results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"performance_analysis_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✅ Analysis saved to: {filename}")
    return results


def test_query_performance():
    """Test specific query performance"""
    
    print("\n⚡ Query Performance Testing:")
    
    test_queries = [
        ("User lookup by username", "SELECT * FROM users WHERE username = 'test_user'"),
        ("Active game sessions", "SELECT * FROM game_sessions WHERE status = 'active'"),
        ("User friendships", "SELECT * FROM friendships WHERE user_id = 1"),
        ("Tournament participants", "SELECT * FROM tournament_participants WHERE tournament_id = 1"),
        ("Recent game results", "SELECT * FROM game_results WHERE created_at > NOW() - INTERVAL '7 days'")
    ]
    
    results = {}
    
    with db_config.get_connection() as conn:
        for query_name, query in test_queries:
            start_time = time.time()
            
            try:
                result = conn.execute(text(query))
                rows = result.fetchall()
                
                end_time = time.time()
                duration = round((end_time - start_time) * 1000, 2)
                
                results[query_name] = {
                    "duration_ms": duration,
                    "rows_returned": len(rows),
                    "performance": "good" if duration < 10 else "needs_optimization"
                }
                
                print(f"  {query_name}: {duration}ms ({len(rows)} rows) - {results[query_name]['performance']}")
                
            except Exception as e:
                results[query_name] = {"error": str(e)}
                print(f"  {query_name}: ERROR - {e}")
    
    return results


if __name__ == "__main__":
    # Run comprehensive performance analysis
    analysis_results = analyze_query_performance()
    test_results = test_query_performance()
    
    print("\n🎯 Performance Analysis Complete!")
    print("📊 Ready for PHASE 2.3: Caching Implementation")