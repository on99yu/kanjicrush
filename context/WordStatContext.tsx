import { useState, useCallback, useEffect,useMemo } from "react";
import { createContext, ReactNode } from "react";
import { getDBConnection } from "../db/sqlite";
import { WordStatRow } from "../types/word";

type WordStatContextType = {
    statsMap: Record<number, WordStatRow>;
    loading: boolean;
    refreshStats: () => Promise<void>;
    updateProgress: (
        wordId: number,
        isCorrect: boolean
    ) => Promise<void>;
    resetStats: (wordId: number) => Promise<void>;
};

export const WordStatContext = createContext<WordStatContextType>({
    statsMap: {},
    loading: true,
    refreshStats: async () => { },
    updateProgress: async () => { },
    resetStats: async () => { },
})


export const WordStatProvider = ({ children }: { children: ReactNode; }) => {
    const [statsMap, setStatsMap] = useState<Record<number, WordStatRow>>({});
    const [loading, setLoading] = useState(true);

    const loadStats = useCallback(async () => {
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

    useEffect(() => {
        loadStats();
    }, [loadStats])

    const updateProgress = useCallback(
        async (wordId: number, isCorrect: boolean) => {
            const db = await getDBConnection();

            const current = statsMap[wordId];
            const nextCorrect = (current?.correctCount ?? 0) + (isCorrect ? 1 : 0);
            const nextWrong = (current?.wrongCount ?? 0) + (isCorrect ? 0 : 1);
            const nextLastAnsweredAt = Date.now();

            try {
                if (current) {
                    await db.runAsync(
                        `UPDATE WordStats 
                        SET correctCount = ?, wrongCount = ?, lastAnsweredAt = ?, updateAt = datetime('now')
                        WHERE wordId = ?`,
                        [nextCorrect, nextWrong, nextLastAnsweredAt, wordId]
                    );
                } else {
                    await db.runAsync(
                        `INSERT INTO WordStats (wordId, correctCount, wrongCount, lastAnsweredAt)
                        VALUES (?, ?, ?, ?)`,
                        [wordId, nextCorrect, nextWrong, nextLastAnsweredAt]
                    );
                }

                setStatsMap((prev) => {
                    const prevRow = prev[wordId]

                    const nextRow: WordStatRow = {
                        id: prevRow?.id ?? Date.now(),
                        wordId,
                        correctCount: nextCorrect,
                        wrongCount: nextWrong,
                        lastAnsweredAt: nextLastAnsweredAt,
                        createdAt: prevRow?.createdAt ?? new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    return { ...prev, [wordId]: nextRow };
                })

            } catch (e) {
                console.error("WordStats 업데이트 실패:", e)
            }
        }, [statsMap]
    )

    const resetStats = useCallback(async (wordId: number)=>{
        try{
            const db = await getDBConnection();
            await db.runAsync("DELETE FROM WordStats WHERE wordId = ?",[wordId]);

            setStatsMap((prev)=>{
                const copied = {...prev};
                delete copied[wordId];
                return copied;
            })
        }catch(e){
            console.error("WordStats 리셋 실패",e);
        }
    },[]);

    const value = useMemo(()=>({
        statsMap,
        loading,
        refreshStats: loadStats,
        updateProgress,
        resetStats,
    }),[statsMap, loading, loadStats, updateProgress, resetStats])

    return (
        <WordStatContext.Provider value={value}>
            {children}
        </WordStatContext.Provider>
    )

}

