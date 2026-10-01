import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { AuthSession } from "../types/auth";

const SESSION_KEY = "kanjicrush.auth.session.v1";

export async function loadAuthSession(): Promise<AuthSession | null> {
  const raw =
    Platform.OS === "web"
      ? globalThis.localStorage?.getItem(SESSION_KEY) ?? null
      : await SecureStore.getItemAsync(SESSION_KEY);

  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (
      typeof session.token !== "string" ||
      typeof session.expiresAt !== "string" ||
      typeof session.user?.id !== "number"
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function saveAuthSession(session: AuthSession) {
  const raw = JSON.stringify(session);
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(SESSION_KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, raw);
}

export async function clearAuthSession() {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
