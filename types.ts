export interface Room {
    players: Array<{ user: string, role: string, uid: string }>;
    pool: Array<string>
}