// Memory monitoring and leak detection for React applications
import * as React from "react";

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ComponentMemoryInfo {
  componentName: string;
  mountTime: number;
  unmountTime?: number;
  memoryGrowth: number;
}

class MemoryMonitor {
  private static instance: MemoryMonitor;
  private snapshots: MemorySnapshot[] = [];
  private componentMemoryMap: Map<string, ComponentMemoryInfo> = new Map();
  private intervalId?: NodeJS.Timeout;
  private isMonitoring = false;
  private readonly maxSnapshots = 1000;
  private readonly memoryThreshold = 100 * 1024 * 1024; // 100MB
  private readonly leakThreshold = 50 * 1024 * 1024; // 50MB growth

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      console.warn("Memory monitoring is already active");
      return;
    }

    if (!this.isMemoryAPISupported()) {
      console.warn("Memory API not supported in this browser");
      return;
    }

    this.isMonitoring = true;
    this.takeSnapshot(); // Initial snapshot

    this.intervalId = setInterval(() => {
      this.takeSnapshot();
      this.analyzeMemoryTrends();
    }, intervalMs);

    console.log("🧠 Memory monitoring started");
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isMonitoring = false;
    console.log("🧠 Memory monitoring stopped");
  }

  private isMemoryAPISupported(): boolean {
    return (
      "memory" in performance && typeof (performance as any).memory === "object"
    );
  }

  private takeSnapshot(): void {
    if (!this.isMemoryAPISupported()) return;

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };

    this.snapshots.push(snapshot);

    // Keep only the last N snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    // Check for immediate memory issues
    if (snapshot.usedJSHeapSize > this.memoryThreshold) {
      console.warn(
        `High memory usage detected: ${this.formatBytes(snapshot.usedJSHeapSize)}`
      );
    }
  }

  private analyzeMemoryTrends(): void {
    if (this.snapshots.length < 10) return; // Need at least 10 snapshots

    const recent = this.snapshots.slice(-10);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    const memoryGrowth = newest.usedJSHeapSize - oldest.usedJSHeapSize;
    const timeSpan = newest.timestamp - oldest.timestamp;
    const growthRate = memoryGrowth / (timeSpan / 1000); // bytes per second

    // Detect potential memory leaks
    if (memoryGrowth > this.leakThreshold && growthRate > 10000) {
      // 10KB/s growth
      console.warn("🚨 Potential memory leak detected!", {
        memoryGrowth: this.formatBytes(memoryGrowth),
        growthRate: `${this.formatBytes(growthRate)}/s`,
        timeSpan: `${(timeSpan / 1000).toFixed(1)}s`,
        currentUsage: this.formatBytes(newest.usedJSHeapSize),
      });

      this.logMemoryLeakSuspects();
    }
  }

  private logMemoryLeakSuspects(): void {
    // Check for components that have been mounted for a long time
    const longRunningComponents = Array.from(this.componentMemoryMap.values())
      .filter(
        (info) => !info.unmountTime && Date.now() - info.mountTime > 300000
      ) // 5 minutes
      .sort((a, b) => b.memoryGrowth - a.memoryGrowth);

    if (longRunningComponents.length > 0) {
      console.warn(
        "Components that might be causing memory leaks:",
        longRunningComponents
      );
    }
  }

  trackComponentMount(componentName: string): void {
    if (!this.isMemoryAPISupported()) return;

    const memory = (performance as any).memory;
    const info: ComponentMemoryInfo = {
      componentName,
      mountTime: Date.now(),
      memoryGrowth: memory.usedJSHeapSize,
    };

    this.componentMemoryMap.set(componentName, info);
  }

  trackComponentUnmount(componentName: string): void {
    if (!this.isMemoryAPISupported()) return;

    const info = this.componentMemoryMap.get(componentName);
    if (info) {
      const memory = (performance as any).memory;
      info.unmountTime = Date.now();
      info.memoryGrowth = memory.usedJSHeapSize - info.memoryGrowth;

      // Log if component caused significant memory growth
      if (info.memoryGrowth > 10 * 1024 * 1024) {
        // 10MB
        console.warn(
          `Component ${componentName} may have caused memory growth:`,
          {
            growth: this.formatBytes(info.memoryGrowth),
            lifetime: `${((info.unmountTime - info.mountTime) / 1000).toFixed(1)}s`,
          }
        );
      }
    }
  }

  getMemoryStats(): {
    current: MemorySnapshot | null;
    peak: MemorySnapshot | null;
    growth: number;
    averageGrowthRate: number;
    suspiciousComponents: ComponentMemoryInfo[];
  } {
    if (this.snapshots.length === 0) {
      return {
        current: null,
        peak: null,
        growth: 0,
        averageGrowthRate: 0,
        suspiciousComponents: [],
      };
    }

    const current = this.snapshots[this.snapshots.length - 1];
    const peak = this.snapshots.reduce((max, snapshot) =>
      snapshot.usedJSHeapSize > max.usedJSHeapSize ? snapshot : max
    );

    const first = this.snapshots[0];
    const growth = current.usedJSHeapSize - first.usedJSHeapSize;
    const timeSpan = current.timestamp - first.timestamp;
    const averageGrowthRate = timeSpan > 0 ? growth / (timeSpan / 1000) : 0;

    const suspiciousComponents = Array.from(this.componentMemoryMap.values())
      .filter((info) => info.memoryGrowth > 5 * 1024 * 1024) // 5MB threshold
      .sort((a, b) => b.memoryGrowth - a.memoryGrowth);

    return {
      current,
      peak,
      growth,
      averageGrowthRate,
      suspiciousComponents,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Method to force garbage collection (only works in development)
  forceGarbageCollection(): void {
    if (process.env.NODE_ENV === "development" && "gc" in window) {
      (window as any).gc();
      console.log("🗑️ Forced garbage collection");
      this.takeSnapshot();
    } else {
      console.warn(
        'Garbage collection not available. Run Chrome with --js-flags="--expose-gc"'
      );
    }
  }

  // Clean up resources to prevent own memory leaks
  cleanup(): void {
    this.stopMonitoring();
    this.snapshots = [];
    this.componentMemoryMap.clear();
  }

  // Generate memory report
  generateReport(): string {
    const stats = this.getMemoryStats();

    if (!stats.current) {
      return "No memory data available";
    }

    const report = [
      "🧠 Memory Usage Report",
      "═".repeat(40),
      `Current Usage: ${this.formatBytes(stats.current.usedJSHeapSize)}`,
      `Peak Usage: ${this.formatBytes(stats.peak?.usedJSHeapSize || 0)}`,
      `Total Growth: ${this.formatBytes(stats.growth)}`,
      `Growth Rate: ${this.formatBytes(stats.averageGrowthRate)}/s`,
      `Heap Limit: ${this.formatBytes(stats.current.jsHeapSizeLimit)}`,
      "",
      `Snapshots Collected: ${this.snapshots.length}`,
      `Components Tracked: ${this.componentMemoryMap.size}`,
      "",
    ];

    if (stats.suspiciousComponents.length > 0) {
      report.push("⚠️ Suspicious Components (High Memory Growth):");
      report.push("-".repeat(40));

      stats.suspiciousComponents.slice(0, 5).forEach((comp) => {
        const lifetime = comp.unmountTime
          ? ((comp.unmountTime - comp.mountTime) / 1000).toFixed(1) + "s"
          : "still mounted";

        report.push(
          `${comp.componentName}: ${this.formatBytes(comp.memoryGrowth)} (${lifetime})`
        );
      });

      report.push("");
    }

    // Memory health assessment
    const usagePercentage =
      (stats.current.usedJSHeapSize / stats.current.jsHeapSizeLimit) * 100;

    if (usagePercentage > 80) {
      report.push("🚨 CRITICAL: Memory usage > 80% of limit!");
    } else if (usagePercentage > 60) {
      report.push("⚠️ WARNING: Memory usage > 60% of limit");
    } else if (stats.averageGrowthRate > 50000) {
      // 50KB/s
      report.push("⚠️ WARNING: High memory growth rate detected");
    } else {
      report.push("✅ Memory usage appears healthy");
    }

    return report.join("\n");
  }
}

// React hook for component memory tracking
export const useMemoryTracking = (componentName: string) => {
  const monitor = MemoryMonitor.getInstance();

  React.useEffect(() => {
    monitor.trackComponentMount(componentName);

    return () => {
      monitor.trackComponentUnmount(componentName);
    };
  }, [componentName]);
};

// HOC for automatic memory tracking
export const withMemoryTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const TrackedComponent = (props: P) => {
    const name = componentName || WrappedComponent.name;
    useMemoryTracking(name);

    return React.createElement(WrappedComponent, props);
  };

  TrackedComponent.displayName = `withMemoryTracking(${componentName || WrappedComponent.name})`;
  return TrackedComponent;
};

// Component for displaying memory stats in development
export const MemoryStatsDisplay: React.FC = () => {
  const [stats, setStats] = React.useState<ReturnType<
    MemoryMonitor["getMemoryStats"]
  > | null>(null);
  const monitor = MemoryMonitor.getInstance();

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const updateStats = () => setStats(monitor.getMemoryStats());

    updateStats(); // Initial update
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== "development" || !stats?.current) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999,
        minWidth: "200px",
      }}
    >
      <div>🧠 Memory: {formatBytes(stats.current.usedJSHeapSize)}</div>
      <div>📈 Peak: {formatBytes(stats.peak?.usedJSHeapSize || 0)}</div>
      <div>🔄 Growth: {formatBytes(stats.growth)}</div>
      {stats.suspiciousComponents.length > 0 && (
        <div style={{ color: "orange" }}>
          ⚠️ {stats.suspiciousComponents.length} suspicious components
        </div>
      )}
    </div>
  );
};

export const memoryMonitor = MemoryMonitor.getInstance();
export default MemoryMonitor;
