import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Update network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-pulse">
      <Badge
        variant="destructive"
        className="flex items-center gap-1 px-3 py-1.5"
      >
        <WifiOff className="h-3.5 w-3.5" />
        <span>You are offline</span>
      </Badge>
    </div>
  );
}
