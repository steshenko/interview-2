/** id — короткие имена для UI; skillTitle — как в `questionSkills[].title` в questions.json */
export const SKILL_FILTERS = [
    { id: 'html', label: 'HTML', skillTitle: 'HTML' },
    { id: 'css', label: 'CSS', skillTitle: 'CSS' },
    { id: 'js', label: 'JavaScript', skillTitle: 'JavaScript' },
    { id: 'ts', label: 'TypeScript', skillTitle: 'TypeScript' },
    { id: 'react', label: 'React', skillTitle: 'React' },
    { id: 'git', label: 'Git', skillTitle: 'Git' },
] as const;
