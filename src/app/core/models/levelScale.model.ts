export interface LevelScaleBand {
    code: string;
    nameAz: string;
    rank: number;
    participationScore: number;
    minPercent: number;
    maxPercent: number;
}

export interface LevelScale {
    id: number;
    code: string;
    nameAz: string;
    note: string | null;
    active: boolean;
    bands: LevelScaleBand[];
}
