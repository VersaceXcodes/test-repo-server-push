import React, { useEffect, useRef } from "react";
import { useAppStore } from "@/store/main";

const GV_Notifications: React.FC = () => {
  // Get notifications array and remove_notification action from global store
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useAppStore((state) => state.remove_notification);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Set a removal timeout for each new notification that does not already have a timer
  useEffect(() => {
    notifications.forEach((notification) => {
      if (!timersRef.current[notification.id]) {
        timersRef.current[notification.id] = setTimeout(() => {
          removeNotification(notification.id);
          delete timersRef.current[notification.id];
        }, 5000);
      }
    });
    // Cleanup effect: on unmount clear all timers
    return () => {
      Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  const handleRemoveNotification = (id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    removeNotification(id);
  };

  // Determine background color based on notification type
  const getBgColor = (type: string) => {
    if (type === "error") return "bg-red-500";
    if (type === "success") return "bg-green-500";
    if (type === "warning") return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="fixed top-16 left-0 right-0 flex flex-col items-center gap-2 z-50 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          role="button"
          tabIndex={0}
          onClick={() => handleRemoveNotification(n.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleRemoveNotification(n.id);
            }
          }}
          className={`pointer-events-auto max-w-md w-auto rounded-md px-4 py-2 text-white shadow-lg transition-opacity duration-500 ${getBgColor(n.type)}`}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
};

export default GV_Notifications;