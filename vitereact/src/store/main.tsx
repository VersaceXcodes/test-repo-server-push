import create from 'zustand';
import { persist } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

// Define the User interface matching backend user schema
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Define the Notification interface 
export interface Notification {
  id: string;       // unique id for notification
  type: string;     // e.g., "error", "success"
  message: string;
}

// Define the AppStore state interface
interface AppStore {
  auth_token: string | null;
  auth_user: User | null;
  notifications: Notification[];
  is_loading: boolean;
  socket: Socket | null;

  // Action to set auth details after login
  set_auth_details: (token: string, user: User) => void;
  // Action to clear auth details on logout
  clear_auth: () => void;
  // Action to update global loading state
  set_loading: (loading: boolean) => void;
  // Actions to handle notifications
  add_notification: (notification: Notification) => void;
  remove_notification: (id: string) => void;
  clear_notifications: () => void;
  // Action to initialize the realtime socket connection
  init_socket: () => Promise<void>;
  // Action to disconnect the realtime socket connection
  disconnect_socket: () => void;
  // Optional manual setting of the socket
  set_socket: (socket: Socket) => void;
}

export const use_app_store = create<AppStore>()(
  persist(
    (set, get) => ({
      auth_token: null,
      auth_user: null,
      notifications: [],
      is_loading: false,
      socket: null,

      set_auth_details: (token: string, user: User) =>
        set({ auth_token: token, auth_user: user }),

      clear_auth: () => {
        const sock = get().socket;
        if (sock) {
          sock.disconnect();
        }
        set({ auth_token: null, auth_user: null, socket: null });
      },

      set_loading: (loading: boolean) => set({ is_loading: loading }),

      add_notification: (notification: Notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),

      remove_notification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clear_notifications: () => set({ notifications: [] }),

      init_socket: async () => {
        // Use VITE_API_BASE_URL environment variable or fallback to localhost
        const base_url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        let sock = get().socket;
        if (!sock) {
          sock = io(base_url);
          // Optionally add event listeners, for example:
          sock.on('connect', () => {
            console.log('Socket connected:', sock?.id);
          });
          sock.on('disconnect', () => {
            console.log('Socket disconnected');
          });
          set({ socket: sock });
        }
      },

      disconnect_socket: () => {
        const sock = get().socket;
        if (sock) {
          sock.disconnect();
          set({ socket: null });
        }
      },

      set_socket: (socket: Socket) => set({ socket }),
    }),
    {
      name: 'app_store',
      // Persist only auth_token, auth_user, and notifications.
      partialize: (state) => ({
        auth_token: state.auth_token,
        auth_user: state.auth_user,
        notifications: state.notifications,
      }),
      // By default, Zustand uses localStorage.
    }
  )
);