import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { AuthSession } from "../types/auth";

const SESSION_KEY = "kanjicrush.auth.session.v1";

const getWebStorage = () =>
  typeof window === "undefined" ? null : window.localStorage;

export async function loadAuthSession(): Promise<AuthSession | null> {
  const raw =
    Platform.OS === "web"
      ? getWebStorage()?.getItem(SESSION_KEY) ?? null
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
    const storage = getWebStorage();
    if (!storage) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
    storage.setItem(SESSION_KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, raw);
}

export async function clearAuthSession() {
  if (Platform.OS === "web") {
    getWebStorage()?.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
