export interface DeviceCapabilities {
  memory: number; // GB
  cores: number;
  gpu: string;
  maxTouchPoints: number;
  connectionType: string;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface PerformanceProfile {
  level: 'low' | 'medium' | 'high';
  score: number; // 0-100
  capabilities: DeviceCapabilities;
  recommendations: {
    maxParticles: number;
    targetFPS: number;
    enableShadows: boolean;
    enableBloom: boolean;
    textureQuality: 'low' | 'medium' | 'high';
    audioQuality: 'compressed' | 'standard' | 'high';
  };
}

export class DevicePerformance {
  private static instance: DevicePerformance | null = null;
  private profile: PerformanceProfile | null = null;
  private benchmarkResults: { fps: number; renderTime: number } | null = null;

  static getInstance(): DevicePerformance {
    if (!DevicePerformance.instance) {
      DevicePerformance.instance = new DevicePerformance();
    }
    return DevicePerformance.instance;
  }

  /**
   * Get device performance profile
   */
  async getPerformanceProfile(): Promise<PerformanceProfile> {
    if (this.profile) {
      return this.profile;
    }

    const capabilities = await this.detectCapabilities();
    const benchmarkScore = await this.runBenchmark();
    
    this.profile = this.calculateProfile(capabilities, benchmarkScore);
    return this.profile;
  }

  /**
   * Run a quick performance benchmark
   */
  async runBenchmark(): Promise<number> {
    if (this.benchmarkResults) {
      return this.calculateBenchmarkScore(this.benchmarkResults);
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      canvas.style.position = 'absolute';
      canvas.style.left = '-9999px';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        document.body.removeChild(canvas);
        resolve(50); // Default score
        return;
      }

      let frameCount = 0;
      const startTime = performance.now();
      const targetFrames = 60; // Test for 1 second at 60fps

      const animate = () => {
        const currentTime = performance.now();
        
        // Simple rendering test
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw multiple shapes to stress test
        for (let i = 0; i < 50; i++) {
          ctx.fillStyle = `hsl(${i * 7}, 70%, 50%)`;
          ctx.fillRect(
            Math.sin(currentTime * 0.01 + i) * 100 + 150,
            Math.cos(currentTime * 0.01 + i) * 100 + 150,
            20,
            20
          );
        }

        frameCount++;

        if (frameCount < targetFrames) {
          requestAnimationFrame(animate);
        } else {
          const endTime = performance.now();
          const totalTime = endTime - startTime;
          const fps = (frameCount / totalTime) * 1000;
          const avgRenderTime = totalTime / frameCount;

          this.benchmarkResults = { fps, renderTime: avgRenderTime };
          
          document.body.removeChild(canvas);
          resolve(this.calculateBenchmarkScore(this.benchmarkResults));
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Detect device capabilities
   */
  private async detectCapabilities(): Promise<DeviceCapabilities> {
    const nav = navigator as any;
    
    // Memory detection
    const memory = nav.deviceMemory || this.estimateMemory();
    
    // CPU cores
    const cores = nav.hardwareConcurrency || 2;
    
    // GPU detection (basic)
    const gpu = this.detectGPU();
    
    // Touch capabilities
    const maxTouchPoints = nav.maxTouchPoints || 0;
    
    // Connection type
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const connectionType = connection ? connection.effectiveType || connection.type || 'unknown' : 'unknown';
    
    // Battery info (if available)
    let batteryLevel: number | undefined;
    let isCharging: boolean | undefined;
    
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        batteryLevel = battery.level;
        isCharging = battery.charging;
      }
    } catch (error) {
      // Battery API not available or blocked
    }

    return {
      memory,
      cores,
      gpu,
      maxTouchPoints,
      connectionType,
      batteryLevel,
      isCharging,
    };
  }

  /**
   * Estimate memory based on other factors
   */
  private estimateMemory(): number {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Very rough estimation based on user agent
    if (userAgent.includes('mobile') || userAgent.includes('android')) {
      if (userAgent.includes('low-end') || userAgent.includes('lite')) {
        return 2; // Low-end mobile
      }
      return 4; // Average mobile
    }
    
    if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      return 6; // Tablets typically have more RAM
    }
    
    return 8; // Desktop default
  }

  /**
   * Detect GPU information
   */
  private detectGPU(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return 'unknown';
      }
      
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        return renderer || 'webgl-capable';
      }
      
      return 'webgl-capable';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Calculate benchmark score from results
   */
  private calculateBenchmarkScore(results: { fps: number; renderTime: number }): number {
    const { fps, renderTime } = results;
    
    // Score based on FPS (60fps = 100 points, 30fps = 50 points, etc.)
    const fpsScore = Math.min(100, (fps / 60) * 100);
    
    // Score based on render time (lower is better)
    const renderScore = Math.max(0, 100 - (renderTime - 16) * 2); // 16ms = 60fps target
    
    // Weighted average
    return Math.round((fpsScore * 0.7) + (renderScore * 0.3));
  }

  /**
   * Calculate overall performance profile
   */
  private calculateProfile(capabilities: DeviceCapabilities, benchmarkScore: number): PerformanceProfile {
    let score = benchmarkScore;
    
    // Adjust score based on hardware capabilities
    if (capabilities.memory >= 8) {
      score += 10;
    } else if (capabilities.memory <= 2) {
      score -= 20;
    }
    
    if (capabilities.cores >= 4) {
      score += 5;
    } else if (capabilities.cores <= 2) {
      score -= 10;
    }
    
    // GPU considerations
    if (capabilities.gpu.toLowerCase().includes('intel')) {
      score -= 5; // Integrated graphics typically slower
    } else if (capabilities.gpu.toLowerCase().includes('nvidia') || 
               capabilities.gpu.toLowerCase().includes('amd')) {
      score += 5; // Dedicated graphics
    }
    
    // Connection quality
    if (capabilities.connectionType === 'slow-2g' || capabilities.connectionType === '2g') {
      score -= 15;
    } else if (capabilities.connectionType === '4g' || capabilities.connectionType === '5g') {
      score += 5;
    }
    
    // Battery considerations
    if (capabilities.batteryLevel !== undefined && capabilities.batteryLevel < 0.2 && !capabilities.isCharging) {
      score -= 10; // Low battery, reduce performance to save power
    }
    
    // Clamp score
    score = Math.max(0, Math.min(100, score));
    
    // Determine performance level
    let level: 'low' | 'medium' | 'high';
    if (score >= 70) {
      level = 'high';
    } else if (score >= 40) {
      level = 'medium';
    } else {
      level = 'low';
    }
    
    return {
      level,
      score,
      capabilities,
      recommendations: this.generateRecommendations(level, capabilities),
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(level: 'low' | 'medium' | 'high', capabilities: DeviceCapabilities) {
    const baseRecommendations = {
      low: {
        maxParticles: 50,
        targetFPS: 30,
        enableShadows: false,
        enableBloom: false,
        textureQuality: 'low' as const,
        audioQuality: 'compressed' as const,
      },
      medium: {
        maxParticles: 100,
        targetFPS: 45,
        enableShadows: false,
        enableBloom: true,
        textureQuality: 'medium' as const,
        audioQuality: 'standard' as const,
      },
      high: {
        maxParticles: 200,
        targetFPS: 60,
        enableShadows: true,
        enableBloom: true,
        textureQuality: 'high' as const,
        audioQuality: 'high' as const,
      },
    };
    
    const recommendations = { ...baseRecommendations[level] };
    
    // Adjust based on specific capabilities
    if (capabilities.memory <= 2) {
      recommendations.maxParticles = Math.min(recommendations.maxParticles, 30);
      recommendations.textureQuality = 'low';
    }
    
    if (capabilities.connectionType === 'slow-2g' || capabilities.connectionType === '2g') {
      recommendations.audioQuality = 'compressed';
    }
    
    return recommendations;
  }

  /**
   * Get cached profile without running benchmark
   */
  getCachedProfile(): PerformanceProfile | null {
    return this.profile;
  }

  /**
   * Clear cached results to force re-detection
   */
  clearCache(): void {
    this.profile = null;
    this.benchmarkResults = null;
  }
}