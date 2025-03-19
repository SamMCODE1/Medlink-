// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase-functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateNotificationPayload {
  userId?: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Get the request payload
    const payload: CreateNotificationPayload = await req.json();
    const { userId, title, message } = payload;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // If userId is provided, create notification for that user only
    if (userId) {
      const { data, error } = await supabaseClient
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          message,
          is_read: false,
          related_entity_type: relatedEntityType || null,
          related_entity_id: relatedEntityId || null,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    // Otherwise, create notifications for all staff
    else {
      // Get all staff user IDs
      const { data: staffData, error: staffError } = await supabaseClient
        .from("staff")
        .select("user_id")
        .not("user_id", "is", null);

      if (staffError) throw staffError;

      if (staffData && staffData.length > 0) {
        // Create notifications in batches to avoid overwhelming the database
        const batchSize = 10;
        const batches = [];

        for (let i = 0; i < staffData.length; i += batchSize) {
          const batch = staffData.slice(i, i + batchSize).map((staff) => ({
            user_id: staff.user_id,
            title,
            message,
            is_read: false,
            related_entity_type: relatedEntityType || null,
            related_entity_id: relatedEntityId || null,
          }));

          batches.push(batch);
        }

        // Process each batch sequentially
        for (const batch of batches) {
          const { error } = await supabaseClient
            .from("notifications")
            .insert(batch);

          if (error) {
            console.error("Error creating notifications batch:", error);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, count: staffData?.length || 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
