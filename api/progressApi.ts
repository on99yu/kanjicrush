import axios from "axios";
import { API_BASE_URL } from "./config";
import { PendingStudyAttempt, WordStatRow } from "../types/word";

type RemoteProgress = {
  wordId: number;
  correctCount: number;
  wrongCount: number;
  lastResult: boolean | null;
  lastAnsweredAt: number | null;
};

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

const toWordStats = (items: RemoteProgress[]): WordStatRow[] =>
  items.map((item) => ({
    id: 0,
    ...item,
    createdAt: "",
    updatedAt: "",
  }));

export async function fetchProgress(token: string) {
  const response = await axios.get<{ progress: RemoteProgress[] }>(
    `${API_BASE_URL}/api/app/progress`,
    { timeout: 30_000, headers: headers(token) }
  );
  return toWordStats(response.data.progress);
}

export async function uploadProgress(
  token: string,
  attempts: PendingStudyAttempt[]
) {
  const response = await axios.post<{ progress: RemoteProgress[] }>(
    `${API_BASE_URL}/api/app/progress`,
    { attempts },
    { timeout: 30_000, headers: headers(token) }
  );
  return toWordStats(response.data.progress);
}

export async function deleteProgress(token: string) {
  await axios.delete(`${API_BASE_URL}/api/app/progress`, {
    timeout: 30_000,
    headers: headers(token),
  });
}
