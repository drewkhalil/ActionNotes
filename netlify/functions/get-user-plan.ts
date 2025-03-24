import { Handler } from "@netlify/functions";
import { supabase } from "../../src/lib/supabase";

export const handler: Handler = async (event) => {
  try {
    const userId = event.queryStringParameters?.user_id;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing user ID" }),
      };
    }

    // 🔄 Fetch user plan from Supabase
    const { data, error } = await supabase
      .from("users")
      .select("plan")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch user plan:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database error" }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ plan: data.plan }) };
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
