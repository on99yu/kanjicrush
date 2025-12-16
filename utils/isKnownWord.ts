import { WordStatRow } from "../types/word";
import { getAccuracy } from "./CalAccuracy";

export const isKnownWord = (stats?:WordStatRow) =>{
    if(!stats) return false;
    return stats.correctCount >= 5 && getAccuracy(stats) >= 85;
}