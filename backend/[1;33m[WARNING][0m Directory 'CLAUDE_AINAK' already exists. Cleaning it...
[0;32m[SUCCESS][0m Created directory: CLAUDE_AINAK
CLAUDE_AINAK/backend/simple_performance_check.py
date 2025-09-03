#!/usr/bin/env python3
"""
Simple PostgreSQL Performance Check
Identifies optimization opportunities without complex queries
"""

import time
import json
from datetime import datetime
from sqlalchemy import text
from app.core.database_production import db_config


def basic_performance_check():
    """Basic performance analysis that works reliably"""
    
    print("🔍 PHASE 2.2: Basic Performance Analysis")
    print("=" * 50)
    
    recommendations = []
    
    # Test basic database connectivity and speed
    print("\n⚡ Database Connection Performance:")
    start_time = time.time()
    
    with db_config.get_connection() as conn:
        result = conn.execute(text("SELECT 1"))
        result.fetchone()
    
    connection_time = round((time.time() - start_time) * 1000, 2)
    print(f"  Connection time: {connection_time}ms")
    
    if connection_time > 100:
        recommendations.append("Database connection is slow - check network/connection pooling")
    
    # Check table sizes and activity
    print("\n📊 Table Statistics:")
    with db_config.get_connection() as conn:
        table_stats = """
        SELECT 
            relname as table_name,
            n_live_tup as live_rows,
            n_dead_tup as dead_rows,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes
        FROM pg_stat_user_tables 
        ORDER BY n_live_tup DESC;
        """
        
        result = conn.execute(text(table_stats))
        tables = []
        
        for row in result:
            table_data = {
                "name": row[0],
                "live_rows": row[1],
                "dead_rows": row[2] or 0,
                "inserts": row[3] or 0,
                "updates": row[4] or 0,
                "deletes": row[5] or 0
            }
            tables.append(table_data)
            
            if table_data["live_rows"] > 0:
                print(f"  {table_data['name']:20}: {table_data['live_rows']:6} rows, {table_data['dead_rows']:3} dead")
                
                # Check for tables that might need VACUUM
                if table_data["dead_rows"] > table_data["live_rows"] * 0.2:
                    recommendations.append(f"Table {table_data['name']} has many dead tuples - consider VACUUM")
    
    # Test query performance on key operations
    print("\n🚀 Query Performance Tests:")
    
    test_queries = [
        ("Count users", "SELECT COUNT(*) FROM users"),
        ("Count game sessions", "SELECT COUNT(*) FROM game_sessions"), 
        ("Count tournaments", "SELECT COUNT(*) FROM tournaments"),
        ("User by ID", "SELECT * FROM users WHERE id = 1"),
        ("Sessions by status", "SELECT COUNT(*) FROM game_sessions WHERE status = 'active'")
    ]
    
    query_results = {}
    
    with db_config.get_connection() as conn:
        for name, query in test_queries:
            start_time = time.time()
            
            try:
                result = conn.execute(text(query))
                rows = result.fetchall()
                query_time = round((time.time() - start_time) * 1000, 2)
                
                query_results[name] = {
                    "time_ms": query_time,
                    "rows": len(rows)
                }
                
                status = "✅ GOOD" if query_time < 10 else "⚠️ SLOW" if query_time < 100 else "❌ VERY SLOW"
                print(f"  {name:20}: {query_time:6.2f}ms {status}")
                
                if query_time > 50:
                    recommendations.append(f"Query '{name}' is slow ({query_time}ms) - check indexes")
                    
            except Exception as e:
                print(f"  {name:20}: ERROR - {e}")
                query_results[name] = {"error": str(e)}
    
    # Check connection pool status
    print("\n🔗 Connection Pool Status:")
    pool_stats = db_config.get_performance_metrics().get("pool_statistics", {})
    if pool_stats:
        print(f"  Pool size: {pool_stats.get('pool_size', 'N/A')}")
        print(f"  Max overflow: {pool_stats.get('max_overflow', 'N/A')}")
        print(f"  Current connections: {pool_stats.get('current_connections', 'N/A')}")
        
        if pool_stats.get('current_connections', 0) > pool_stats.get('pool_size', 10) * 0.8:
            recommendations.append("Connection pool is getting full - consider increasing pool size")
    
    # Redis cache status
    print("\n💾 Cache Status:")
    if db_config.redis_client:
        try:
            db_config.redis_client.ping()
            print("  Redis: ✅ CONNECTED")
        except:
            print("  Redis: ❌ CONNECTION FAILED")
            recommendations.append("Redis cache is not working - implement Redis caching for performance")
    else:
        print("  Redis: ❌ NOT CONFIGURED")
        recommendations.append("Redis cache not configured - implement Redis caching for performance")
    
    # Performance recommendations
    print("\n💡 Performance Optimization Recommendations:")
    
    if not recommendations:
        recommendations = [
            "✅ Database performance looks good!",
            "Consider implementing Redis caching for frequently accessed data",
            "Monitor performance as data volume grows",
            "Enable pg_stat_statements extension for detailed query analysis"
        ]
    
    for i, rec in enumerate(recommendations, 1):
        print(f"  {i}. {rec}")
    
    # Save results
    results = {
        "timestamp": datetime.now().isoformat(),
        "connection_time_ms": connection_time,
        "table_statistics": tables,
        "query_performance": query_results,
        "recommendations": recommendations
    }
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"performance_check_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✅ Performance check saved to: {filename}")
    return results


if __name__ == "__main__":
    results = basic_performance_check()
    
    print(f"\n🎯 Performance Analysis Complete!")
    print("Next steps:")
    print("- Implement Redis caching layer")  
    print("- Add query optimization indexes if needed")
    print("- Monitor performance under load")