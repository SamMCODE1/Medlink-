import { supabase } from "../../supabase/supabase";

/**
 * Creates a throttled Supabase query that limits how often the same query can be executed
 * @param queryFn The function that performs the Supabase query
 * @param throttleMs The minimum time between identical queries in milliseconds
 * @returns A throttled version of the query function
 */
export function createThrottledQuery<T>(
  queryFn: () => Promise<T>,
  throttleMs = 2000,
): () => Promise<T> {
  let lastQueryTime = 0;
  let lastPromise: Promise<T> | null = null;

  return async function () {
    const now = Date.now();
    const timeSinceLastQuery = now - lastQueryTime;

    // If we've queried recently, return the last promise
    if (timeSinceLastQuery < throttleMs && lastPromise) {
      return lastPromise;
    }

    // Update the last query time and execute the query
    lastQueryTime = now;
    lastPromise = queryFn();
    return lastPromise;
  };
}

/**
 * Safely subscribes to a Supabase channel with error handling
 * @param channelName Unique name for the channel
 * @param table Table to subscribe to changes
 * @param onChangeCallback Function to call when changes occur
 * @returns A cleanup function to remove the channel
 */
export function safelySubscribeToTable(
  channelName: string,
  table: string,
  onChangeCallback: (payload: any) => void,
): () => void {
  let channel: any = null;

  try {
    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          console.log(`${table} change received:`, payload);
          onChangeCallback(payload);
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error(`Error connecting to ${table} channel`);
        }
      });
  } catch (error) {
    console.error(`Failed to set up ${table} subscription:`, error);
  }

  // Return cleanup function
  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Optimized fetch function with caching for Supabase queries
 * @param tableName The table to query
 * @param options Query options
 * @returns The query result
 */
export async function optimizedFetch(
  tableName: string,
  options: {
    select?: string;
    order?: { column: string; ascending?: boolean };
    filters?: { column: string; value: any }[];
    limit?: number;
  },
) {
  // Create a cache key based on the query parameters
  const cacheKey = `${tableName}:${JSON.stringify(options)}`;

  // Check if we have a cached result
  const cachedResult = sessionStorage.getItem(cacheKey);
  if (cachedResult) {
    try {
      const { data, timestamp } = JSON.parse(cachedResult);
      // Use cache if it's less than 30 seconds old
      if (Date.now() - timestamp < 30000) {
        return { data, error: null };
      }
    } catch (e) {
      // Invalid cache, continue with fetch
    }
  }

  // Build the query
  let query = supabase.from(tableName).select(options.select || "*");

  // Apply filters
  if (options.filters) {
    for (const filter of options.filters) {
      query = query.eq(filter.column, filter.value);
    }
  }

  // Apply ordering
  if (options.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending !== false,
    });
  }

  // Apply limit
  if (options.limit) {
    query = query.limit(options.limit);
  }

  // Execute the query
  const { data, error } = await query;

  // Cache the result if successful
  if (!error && data) {
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      );
    } catch (e) {
      // Ignore storage errors
    }
  }

  return { data, error };
}
