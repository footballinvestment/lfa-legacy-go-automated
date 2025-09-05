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

  trackComponentRender(componentName: string, renderTime: number): void {
    this.renderTimes.push(renderTime);
    this.metrics.componentRender = this.getAverageTime(this.renderTimes);
  }

  trackAPIRequest(endpoint: string, requestTime: number): void {
    this.apiTimes.push(requestTime);
    this.metrics.apiRequest = this.getAverageTime(this.apiTimes);
  }

  private getAverageTime(times: number[]): number {
    if (times.length === 0) return 0;
    const recent = times.slice(-10);
    return recent.reduce((sum, time) => sum + time, 0) / recent.length;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  startMonitoring(): void {
    if (process.env.NODE_ENV === "development") {
      // Development monitoring setup
    }
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    return `Performance Report:
- Average component render: ${metrics.componentRender.toFixed(2)}ms
- Average API request: ${metrics.apiRequest.toFixed(2)}ms
- Memory usage: ${metrics.memoryUsage.toFixed(2)}MB`;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();