// Performance monitoring utilities for LFA Legacy GO

interface PerformanceMetrics {
  componentRender: number;
  apiRequest: number;
  memoryUsage: number;
  bundleSize: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    componentRender: 0,
    apiRequest: 0,
    memoryUsage: 0,
    bundleSize: 0,
  };
  private renderTimes: number[] = [];
  private apiTimes: number[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track component render performance
  trackComponentRender(
    componentName: string,
    startTime: number,
    endTime: number
  ): void {
    const duration = endTime - startTime;
    this.renderTimes.push(duration);

    if (duration > 16) {
      // > 16ms might cause frame drops
      console.warn(
        `Slow component render: ${componentName} took ${duration.toFixed(2)}ms`
      );
    }

    // Keep only last 100 measurements
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift();
    }

    this.metrics.componentRender = this.getAverageRenderTime();
  }

  // Track API request performance
  trackAPIRequest(endpoint: string, startTime: number, endTime: number): void {
    const duration = endTime - startTime;
    this.apiTimes.push(duration);

    if (duration > 200) {
      // > 200ms is slow for API
      console.warn(
        `Slow API request: ${endpoint} took ${duration.toFixed(2)}ms`
      );
    }

    // Keep only last 50 measurements
    if (this.apiTimes.length > 50) {
      this.apiTimes.shift();
    }

    this.metrics.apiRequest = this.getAverageAPITime();
  }

  // Track memory usage
  trackMemoryUsage(): void {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB

      if (this.metrics.memoryUsage > 100) {
        console.warn(
          `High memory usage: ${this.metrics.memoryUsage.toFixed(2)}MB`
        );
      }
    }
  }

  // Track bundle size (approximate)
  trackBundleSize(): void {
    if (typeof window !== "undefined") {
      // Estimate bundle size from script tags
      const scripts = document.querySelectorAll("script[src]");
      let totalSize = 0;

      scripts.forEach((script) => {
        const src = script.getAttribute("src");
        if (src && src.includes("static/js/")) {
          // This is a rough estimate - in production you'd use real metrics
          totalSize += 500; // KB estimate per script
        }
      });

      this.metrics.bundleSize = totalSize;
    }
  }

  private getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    return (
      this.renderTimes.reduce((sum, time) => sum + time, 0) /
      this.renderTimes.length
    );
  }

  private getAverageAPITime(): number {
    if (this.apiTimes.length === 0) return 0;
    return (
      this.apiTimes.reduce((sum, time) => sum + time, 0) / this.apiTimes.length
    );
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    let score = 100;

    // Penalize slow renders
    if (this.metrics.componentRender > 16) {
      score -= Math.min(30, (this.metrics.componentRender - 16) * 2);
    }

    // Penalize slow API
    if (this.metrics.apiRequest > 200) {
      score -= Math.min(25, (this.metrics.apiRequest - 200) / 10);
    }

    // Penalize high memory usage
    if (this.metrics.memoryUsage > 50) {
      score -= Math.min(25, (this.metrics.memoryUsage - 50) / 2);
    }

    // Penalize large bundle
    if (this.metrics.bundleSize > 1000) {
      score -= Math.min(20, (this.metrics.bundleSize - 1000) / 50);
    }

    return Math.max(0, Math.round(score));
  }

  // Log performance summary
  logPerformanceSummary(): void {
    const metrics = this.getMetrics();
    const score = this.getPerformanceScore();

    console.group("🚀 Performance Summary");
    console.log(`Overall Score: ${score}/100`);
    console.log(`Average Render Time: ${metrics.componentRender.toFixed(2)}ms`);
    console.log(`Average API Time: ${metrics.apiRequest.toFixed(2)}ms`);
    console.log(`Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB`);
    console.log(`Bundle Size: ${metrics.bundleSize}KB`);
    console.groupEnd();
  }

  // Start monitoring
  startMonitoring(): void {
    // Monitor memory every 10 seconds
    setInterval(() => {
      this.trackMemoryUsage();
    }, 10000);

    // Track bundle size on load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.trackBundleSize();
      });
    } else {
      this.trackBundleSize();
    }

    // Log summary every 30 seconds in development
    if (process.env.NODE_ENV === "development") {
      setInterval(() => {
        this.logPerformanceSummary();
      }, 30000);
    }
  }
}

// React hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();

  const trackRender = (startTime?: number) => {
    const endTime = performance.now();
    const start = startTime || endTime - 1; // fallback if not provided
    monitor.trackComponentRender(componentName, start, endTime);
  };

  const trackAPI = (endpoint: string, startTime: number) => {
    const endTime = performance.now();
    monitor.trackAPIRequest(endpoint, startTime, endTime);
  };

  return { trackRender, trackAPI };
};

// HOC for automatic component performance tracking
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const TrackedComponent = (props: P) => {
    const startTime = performance.now();

    React.useEffect(() => {
      const endTime = performance.now();
      PerformanceMonitor.getInstance().trackComponentRender(
        componentName || WrappedComponent.name,
        startTime,
        endTime
      );
    });

    return React.createElement(WrappedComponent, props);
  };

  TrackedComponent.displayName = `withPerformanceTracking(${componentName || WrappedComponent.name})`;
  return TrackedComponent;
};

export const performanceMonitor = PerformanceMonitor.getInstance();
