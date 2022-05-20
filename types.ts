export interface Room {
    id: string;
    //已加入玩家
    players: Array<{ user: string, role: string, uid: string }>;
    pool: Array<string>;
    mode: 'wolf' | 'undercover';
    undercover_data?: UnderCoverData;
    wolf_data?: UnderCoverData
}

export interface UnderCoverData {
    true_word: string,
    undercover_word: string,
    undercover_count: number,
    normal_count: number,
    blank_count: number
}