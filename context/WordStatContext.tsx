import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createContext, ReactNode, useContext } from "react";
import * as Crypto from "expo-crypto";
import {
    getDBConnection,
    getPendingStudyAttempts,
    prepareProgressForUser,
    recordStudyAttempt,
    removePendingStudyAttempts,
    replaceProgress,
} from "../db/sqlite";
import { WordStatRow } from "../types/word";
import { AuthContext } from "./AuthContext";
import { fetchProgress, uploadProgress } from "../api/progressApi";

type WordStatContextType = {
    statsMap: Record<number, WordStatRow>;
    loading: boolean;
    refreshStats: () => Promise<void>;
    updateProgress: (
        wordId: number,
        isCorrect: boolean
    ) => Promise<void>;
};

export const WordStatContext = createContext<WordStatContextType>({
    statsMap: {},
    loading: true,
    refreshStats: async () => { },
    updateProgress: async () => { },
})


export const WordStatProvider = ({ children }: { children: ReactNode; }) => {
    const { session } = useContext(AuthContext);
    const [statsMap, setStatsMap] = useState<Record<number, WordStatRow>>({});
    const [loading, setLoading] = useState(true);
    const syncInFlight = useRef<Promise<void> | null>(null);
    const syncAgain = useRef(false);

    const loadLocalStats = useCallback(async () => {
        try {
            const db = await getDBConnection();
            const rows: any[] = await db.getAllAsync("SELECT * FROM WordStats");

            const map: Record<number, WordStatRow> = {};
            for (const r of rows) {
                map[r.wordId] = {
                    id: r.id,
                    wordId: r.wordId,
                    correctCount: r.correctCount ?? 0,
                    wrongCount: r.wrongCount ?? 0,
                    lastAnsweredAt: r.lastAnsweredAt ?? null,
                    createdAt: r.createdAt,
                    updatedAt: r.updatedAt,
                }
            }

            setStatsMap(map);
        } catch (e) {
            console.error("WordStats 로드 실패", e)
        } finally {
            setLoading(false);
        }
    }, []);

    const syncStats = useCallback(async () => {
        if (!session) return;

        const pending = await getPendingStudyAttempts();
        let remoteStats: WordStatRow[];

        if (pending.length > 0) {
            remoteStats = [];
            for (let index = 0; index < pending.length; index += 500) {
                const batch = pending.slice(index, index + 500);
                remoteStats = await uploadProgress(session.token, batch);
                await removePendingStudyAttempts(batch.map((item) => item.clientEventId));
            }
        } else {
            remoteStats = await fetchProgress(session.token);
        }

        await replaceProgress(remoteStats);
        const map: Record<number, WordStatRow> = {};
        for (const stat of remoteStats) map[stat.wordId] = stat;
        setStatsMap(map);
    }, [session]);

    const requestBackgroundSync = useCallback(() => {
        if (syncInFlight.current) {
            syncAgain.current = true;
            return;
        }

        const run = async () => {
            do {
                syncAgain.current = false;
                await syncStats();
            } while (syncAgain.current);
        };

        const task = run()
            .catch((error) => {
                console.warn("학습 기록은 기기에 저장되었으며 나중에 동기화됩니다.", error);
            })
            .finally(() => {
                syncInFlight.current = null;
            });
        syncInFlight.current = task;
    }, [syncStats]);

    useEffect(() => {
        const initializeStats = async () => {
            if (!session) return;
            setLoading(true);
            try {
                await prepareProgressForUser(session.user.id);
                await loadLocalStats();
                await syncStats();
            } catch (error) {
                console.warn("학습 기록 동기화 실패, 로컬 기록을 사용합니다.", error);
                await loadLocalStats();
            } finally {
                setLoading(false);
            }
        };

        initializeStats();
    }, [session, loadLocalStats, syncStats])

    const updateProgress = useCallback(
        async (wordId: number, isCorrect: boolean) => {
            try {
                const updated = await recordStudyAttempt({
                    clientEventId: Crypto.randomUUID(),
                    wordId,
                    isCorrect,
                    answeredAt: new Date().toISOString(),
                });
                setStatsMap((prev) => ({ ...prev, [wordId]: updated }));

                requestBackgroundSync();
            } catch (e) {
                console.error("WordStats 업데이트 실패:", e)
                throw e;
            }
        }, [requestBackgroundSync]
    )

    const refreshStats = useCallback(async () => {
        try {
            await syncStats();
        } catch {
            await loadLocalStats();
        }
    }, [syncStats, loadLocalStats]);

    const value = useMemo(() => ({
        statsMap,
        loading,
        refreshStats,
        updateProgress,
    }), [statsMap, loading, refreshStats, updateProgress])

    return (
        <WordStatContext.Provider value={value}>
            {children}
        </WordStatContext.Provider>
    )

}
