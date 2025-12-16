  import { WordStatRow } from "../types/word";
  export const getAccuracy = (stats?: WordStatRow) =>{
    const c = stats?.correctCount ?? 0;
    const w = stats?.wrongCount ?? 0;
    const total = c + w
    return total === 0 ? 0 : Math.round((c/total)*100)
  }