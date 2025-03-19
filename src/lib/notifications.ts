import { supabase } from "../../supabase/supabase";

export type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type?: string;
};

export async function fetchNotifications(
  userId: string | undefined,
): Promise<Notification[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

export async function markAllNotificationsAsRead(
  userId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-create-notification",
      {
        body: { userId, title, message },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}
