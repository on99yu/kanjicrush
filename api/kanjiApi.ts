import axios from "axios";

export const fetchKanjiData = async ()=>{
    try{
        const res = await axios.get("https://kanjicruch-admin.vercel.app/api/kanji");
        return res.data;
    }catch(error){
        console.error("Error fetching kanji data:", error);
        throw error;
    }
}