export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig = {};

  async register(config: ServiceWorkerConfig = {}): Promise<ServiceWorkerRegistration | null> {
    this.config = config;

    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    if (import.meta.env.DEV) {
      console.log('Service Worker disabled in development mode');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.registration = registration;
      this.setupEventListeners(registration);

      console.log('Service Worker registered successfully');
      
      if (this.config.onSuccess) {
        this.config.onSuccess(registration);
      }

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered');
      this.registration = null;
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('No service worker registered');
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
      throw error;
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    // Send message to service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  async cleanCache(): Promise<void> {
    if (!this.registration || !this.registration.active) {
      return;
    }

    // Send message to service worker to clean old caches
    this.registration.active.postMessage({ type: 'CLEAN_CACHE' });
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  isRegistered(): boolean {
    return this.registration !== null;
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  private setupEventListeners(registration: ServiceWorkerRegistration): void {
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content is available
          console.log('New service worker content available');
          
          if (this.config.onUpdate) {
            this.config.onUpdate(registration);
          }
        }
      });
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
      // Reload the page to use the new service worker
      window.location.reload();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;
    
    switch (data?.type) {
      case 'CACHE_UPDATED':
        console.log('Service Worker: Cache updated', data.url);
        break;
      case 'OFFLINE_READY':
        console.log('Service Worker: App ready for offline use');
        break;
      case 'ERROR':
        console.error('Service Worker error:', data.error);
        break;
      default:
        console.log('Service Worker message:', data);
    }
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Convenience functions
export const registerServiceWorker = (config?: ServiceWorkerConfig) => 
  serviceWorkerManager.register(config);

export const unregisterServiceWorker = () => 
  serviceWorkerManager.unregister();

export const updateServiceWorker = () => 
  serviceWorkerManager.update();

export const isServiceWorkerSupported = () => 
  serviceWorkerManager.isSupported();