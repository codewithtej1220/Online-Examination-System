import { Bell, CheckCheck, Clock, AlertCircle, Info, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

const notificationIcons = {
  info: Info,
  success: CheckCheck,
  warning: AlertCircle,
  error: AlertCircle,
};

const notificationColors = {
  info: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  success: "text-green-600 dark:text-green-400 bg-green-500/10",
  warning: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  error: "text-red-600 dark:text-red-400 bg-red-500/10",
};

// Mock notifications - Replace with real data
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "info",
    title: "New Exam Assigned",
    description: "DBMS Final Exam has been assigned to you",
    timestamp: new Date(Date.now() - 5 * 60000),
    read: false,
  },
  {
    id: "2",
    type: "success",
    title: "Results Published",
    description: "Your results for Data Structures exam are now available",
    timestamp: new Date(Date.now() - 60 * 60000),
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Exam Reminder",
    description: "Algorithm Analysis exam starts in 2 hours",
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    read: true,
  },
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const formatTimestamp = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 z-50 w-96 max-h-[600px] overflow-hidden"
            >
              <Card className="shadow-2xl border-2">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <h3 className="font-semibold text-lg">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map((notification) => {
                        const Icon = notificationIcons[notification.type];
                        return (
                          <motion.div
                            key={notification.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={cn(
                              "p-4 hover:bg-muted/50 transition-colors relative group",
                              !notification.read && "bg-primary/5"
                            )}
                          >
                            {!notification.read && (
                              <span className="absolute left-2 top-6 h-2 w-2 rounded-full bg-primary" />
                            )}

                            <div className="flex gap-3 pl-4">
                              <div
                                className={cn(
                                  "grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg",
                                  notificationColors[notification.type]
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-medium text-sm">
                                    {notification.title}
                                  </p>
                                  <button
                                    onClick={() => removeNotification(notification.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                  </button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                  {!notification.read && (
                                    <button
                                      onClick={() => markAsRead(notification.id)}
                                      className="ml-auto text-xs text-primary hover:underline"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
