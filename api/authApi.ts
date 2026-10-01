import axios from "axios";
import { API_BASE_URL } from "./config";
import { AuthSession } from "../types/auth";

export async function loginToApp(email: string, password: string) {
  const response = await axios.post<AuthSession>(
    `${API_BASE_URL}/api/app/auth/login`,
    { email, password },
    { timeout: 30_000 }
  );
  return response.data;
}

export async function logoutFromApp(token: string) {
  await axios.post(
    `${API_BASE_URL}/api/app/auth/logout`,
    {},
    {
      timeout: 15_000,
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}
