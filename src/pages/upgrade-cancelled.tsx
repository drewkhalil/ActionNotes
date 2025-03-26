import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { user_id } = req.query;

    if (!user_id || typeof user_id !== "string") {
      return res.status(400).json({ error: "Missing or invalid user ID" });
    }

    // 🔄 Fetch user plan from Supabase
    const { data, error } = await supabase
      .from("users")
      .select("plan")
      .eq("id", user_id)
      .single();

    if (error) {
      console.error("Failed to fetch user plan:", error);
      return res.status(500).json({ error: "Database error" });
    }

    return res.status(200).json({ plan: data.plan });
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
