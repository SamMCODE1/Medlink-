import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { supabase } from "../../../supabase/supabase";

export default function RealtimeStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const channelRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<any>(null);
  const connectionCheckRef = useRef<any>(null);

  // Use useCallback to prevent recreation of this function on each render
  const updateConnectionStatus = useCallback((status: boolean) => {
    setIsConnected(status);
    if (status) {
      setLastUpdate(new Date());
    }
  }, []);

  useEffect(() => {
    // Set up a ping channel to monitor connection status
    const channel = supabase.channel("realtime-status", {
      config: {
        presence: {
          key: crypto.randomUUID(), // Ensure unique presence key
        },
      },
    });

    channelRef.current = channel;

    // Handle presence events
    channel
      .on("presence", { event: "sync" }, () => {
        updateConnectionStatus(true);
      })
      .on("presence", { event: "join" }, () => {
        updateConnectionStatus(true);
      })
      .on("presence", { event: "leave" }, () => {
        // Only mark as disconnected if we don't rejoin quickly
        setTimeout(() => {
          const timeSinceLastUpdate = lastUpdate
            ? new Date().getTime() - lastUpdate.getTime()
            : 0;
          if (timeSinceLastUpdate > 5000) {
            // 5 seconds threshold
            updateConnectionStatus(false);
          }
        }, 2000);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.track({ online_at: new Date().toISOString() });
            updateConnectionStatus(true);
          } catch (error) {
            console.error("Error tracking presence:", error);
            updateConnectionStatus(false);
          }
        } else if (status === "CHANNEL_ERROR") {
          updateConnectionStatus(false);
        }
      });

    // Set up a heartbeat to track connection status (less frequent)
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        if (channel && channelRef.current) {
          await channel.track({ online_at: new Date().toISOString() });
          updateConnectionStatus(true);
        }
      } catch (error) {
        console.error("Realtime heartbeat error:", error);
        updateConnectionStatus(false);
      }
    }, 60000); // Every 60 seconds (reduced from 30s)

    // Also check for connection status changes
    connectionCheckRef.current = setInterval(() => {
      const timeSinceLastUpdate = lastUpdate
        ? new Date().getTime() - lastUpdate.getTime()
        : 0;
      if (timeSinceLastUpdate > 120000) {
        // 2 minutes (increased from 1 min)
        updateConnectionStatus(false);
      }
    }, 30000); // Check every 30 seconds (reduced frequency)

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
        connectionCheckRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  return (
    <div className="flex items-center">
      <Badge
        variant="outline"
        className={`flex items-center gap-1 ${isConnected ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Live Updates</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </>
        )}
      </Badge>
    </div>
  );
}
