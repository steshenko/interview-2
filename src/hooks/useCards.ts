import { useQuery } from '@tanstack/react-query';

export interface QuestionSkill {
    id: number;
    title: string;
}

export interface Question {
    id: number;
    title: string;
    shortAnswer?: string;
    /** 1–10, диапазоны как в Question Difficulty: 1–3, 4–6, 7–8, 9–10 */
    complexity?: number;
    /** 1–5, Question Rating */
    rate?: number;
    questionSkills?: QuestionSkill[];
}

async function fetchQuestions(): Promise<Question[]> {
    const res = await fetch('/questions.json');
    if (!res.ok) {
        throw new Error('Не удалось загрузить вопросы');
    }
    return res.json();
}

export function useCards() {
    return useQuery({
        queryKey: ['questions'],
        queryFn: fetchQuestions,
    });
}
