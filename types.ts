import WebSocket from "ws";

export interface Room {
    id: string;
    //已加入玩家
    players: Array<{ user: string, role: string, uid: string }>;
    pool: Array<string>;
    mode: 'wolf' | 'undercover';
    config?: RoomCreateConfig;
    undercover_data?: UnderCoverData;
    sockets?: WebSocket[],
    create_time:number
}

export interface UnderCoverData {
    true_word: string,
    undercover_word: string,
    undercover_count: number,
    normal_count: number,
    blank_count: number
}

export interface RoomCreateConfig {
    mode: 'wolf' | 'undercover',
    wolf?: { pool: string[] },
    undercover?: { human: number, undercover: number, blank: number },
    broadcast: boolean
}