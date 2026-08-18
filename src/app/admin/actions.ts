"use server";

import { redirect } from "next/navigation";

import {
  clearAdminSession,
  createAdminSession,
  isAdminConfigured,
  validateAdminCredentials,
} from "@/lib/admin-auth";

export async function loginAdmin(formData: FormData) {
  const username = String(formData.get("username") ?? "").slice(0, 120);
  const password = String(formData.get("password") ?? "").slice(0, 500);

  if (!isAdminConfigured()) {
    redirect("/admin/login?error=config");
  }

  const valid = validateAdminCredentials(username, password);
  await new Promise((resolve) => setTimeout(resolve, 450));
  if (!valid) {
    redirect("/admin/login?error=invalid");
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}
