export interface Room {
    players: Array<{ user: string, role: string }>;
    pool: Array<string>
}