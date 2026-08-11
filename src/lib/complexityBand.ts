/** Четыре диапазона сложности, как в исходном UI (Question Difficulty: 1–3, 4–6, 7–8, 9–10) */
export type DifficultyTier = 'd13' | 'd46' | 'd78' | 'd910';

export function difficultyTier(complexity: number | undefined): DifficultyTier {
    const c = complexity == null ? 5 : Math.min(10, Math.max(1, complexity));
    if (c <= 3) return 'd13';
    if (c <= 6) return 'd46';
    if (c <= 8) return 'd78';
    return 'd910';
}

export const DIFFICULTY_RANGE_LABEL: Record<DifficultyTier, string> = {
    d13: '1–3',
    d46: '4–6',
    d78: '7–8',
    d910: '9–10',
};

export const DIFFICULTY_FILTERS: { id: DifficultyTier; label: string }[] = (
    ['d13', 'd46', 'd78', 'd910'] as const
).map((id) => ({ id, label: DIFFICULTY_RANGE_LABEL[id] }));

/** Уровень 1–4 для точек-индикатора сложности (закрашено/пусто, не завязано на цвет) */
export const DIFFICULTY_LEVEL: Record<DifficultyTier, number> = {
    d13: 1,
    d46: 2,
    d78: 3,
    d910: 4,
};
