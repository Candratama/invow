"use server";

import { getSettingsPageDataForUser } from "@/lib/db/data-access/settings";

export async function getSettingsDataAction() {
  try {
    const data = await getSettingsPageDataForUser();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching settings data:", error);
    return { success: false, error: "Failed to fetch settings data" };
  }
}
