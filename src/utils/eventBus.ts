type EventMap = {
  workoutSessionDeleted: {
    sessionId?: string | number | null;
    exerciseName?: string | null;
    workoutDate?: string | null;
  };
};

type EventKey = keyof EventMap;

type EventListener<K extends EventKey> = (payload: EventMap[K]) => void;

class EventBus {
  private listeners: {
    [K in EventKey]?: Set<EventListener<K>>;
  } = {};

  on<K extends EventKey>(event: K, listener: EventListener<K>) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends EventKey>(event: K, listener: EventListener<K>) {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends EventKey>(event: K, payload: EventMap[K]) {
    this.listeners[event]?.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        if (__DEV__) {
          console.warn(`[EventBus] listener for ${event} failed`, error);
        }
      }
    });
  }
}

export const eventBus = new EventBus();


