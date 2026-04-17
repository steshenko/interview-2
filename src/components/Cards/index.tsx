import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '../Card';
import { useCards, type Question } from '../../hooks/useCards.js';
import { difficultyTier, type DifficultyTier, DIFFICULTY_RANGE_LABEL } from '../../lib/complexityBand.js';
import { seededShuffle } from '../../lib/seededShuffle.js';
import './Cards.css';

const PAGE_SIZE = 50;

/** Стабильная ссылка, чтобы useMemo / useEffect не срабатывали на каждом рендере */
const EMPTY_POOL: Question[] = [];

type SampleMode = 'all' | 'random50' | 'random100';

/** id — ваши короткие имена; skillTitle — как в `questionSkills[].title` в questions.json */
const SKILL_FILTERS = [
    { id: 'html', label: 'HTML', skillTitle: 'HTML' },
    { id: 'css', label: 'CSS', skillTitle: 'CSS' },
    { id: 'js', label: 'JS', skillTitle: 'JavaScript' },
    { id: 'ts', label: 'TS', skillTitle: 'TypeScript' },
    { id: 'react', label: 'React', skillTitle: 'React' },
    { id: 'git', label: 'Git', skillTitle: 'Git' },
] as const;

const DIFFICULTY_FILTERS: { id: DifficultyTier; label: string }[] = (
    ['d13', 'd46', 'd78', 'd910'] as const
).map((id) => ({ id, label: DIFFICULTY_RANGE_LABEL[id] }));

const RATING_FILTERS = [1, 2, 3, 4, 5] as const;

function filterBySkills(data: Question[], selected: ReadonlySet<string>): Question[] {
    if (selected.size === 0) return [];
    const titles = new Set<string>(
        SKILL_FILTERS.filter((f) => selected.has(f.id)).map((f) => f.skillTitle),
    );
    return data.filter((q) => q.questionSkills?.some((s) => titles.has(s.title)));
}

function filterByDifficulty(data: Question[], selected: ReadonlySet<DifficultyTier>): Question[] {
    if (selected.size === 0) return data;
    return data.filter((q) => selected.has(difficultyTier(q.complexity)));
}

function filterByRating(data: Question[], selected: ReadonlySet<number>): Question[] {
    if (selected.size === 0) return data;
    return data.filter((q) => q.rate != null && selected.has(q.rate));
}

function buildVisibleList(
    pool: Question[],
    mode: SampleMode,
    shuffleKey: number,
): Question[] {
    if (pool.length === 0) return [];
    if (mode === 'all') return pool;
    const cap = mode === 'random50' ? 50 : 100;
    const seed = shuffleKey * 1_000_003 + pool.length;
    const shuffled = seededShuffle(pool, seed);
    return shuffled.slice(0, Math.min(cap, shuffled.length));
}

export const Cards = () => {
    const { data, isLoading, isError, error } = useCards();
    const parentRef = useRef<HTMLDivElement>(null);
    const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(() => new Set());
    const [selectedDifficulty, setSelectedDifficulty] = useState<Set<DifficultyTier>>(
        () => new Set(),
    );
    const [selectedRating, setSelectedRating] = useState<Set<number>>(() => new Set());
    const [sampleMode, setSampleMode] = useState<SampleMode>('all');
    const [shuffleKey, setShuffleKey] = useState(0);

    const filteredPool = useMemo(() => {
        if (!data) return EMPTY_POOL;
        if (selectedSkills.size === 0) return EMPTY_POOL;
        const bySkills = filterBySkills(data, selectedSkills);
        const byDiff = filterByDifficulty(bySkills, selectedDifficulty);
        const result = filterByRating(byDiff, selectedRating);
        return result.length === 0 ? EMPTY_POOL : result;
    }, [data, selectedSkills, selectedDifficulty, selectedRating]);

    const visibleList = useMemo(
        () => buildVisibleList(filteredPool, sampleMode, shuffleKey),
        [filteredPool, sampleMode, shuffleKey],
    );

    const toggleSkill = useCallback((id: string) => {
        setSelectedSkills((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleDifficulty = useCallback((id: DifficultyTier) => {
        setSelectedDifficulty((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleRating = useCallback((rating: number) => {
        setSelectedRating((prev) => {
            const next = new Set(prev);
            if (next.has(rating)) next.delete(rating);
            else next.add(rating);
            return next;
        });
    }, []);

    /** Новая перетасовка при изменении отфильтрованного пула (фильтры / данные) */
    useEffect(() => {
        setShuffleKey((k) => k + 1);
    }, [filteredPool]);

    useEffect(() => {
        setLoadedCount(PAGE_SIZE);
        parentRef.current?.scrollTo({ top: 0 });
    }, [filteredPool, sampleMode, shuffleKey]);

    const reshuffle = useCallback(() => {
        setShuffleKey((k) => k + 1);
    }, []);

    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const el = parentRef.current;
        if (!el || selectedSkills.size === 0 || visibleList.length === 0) {
            setShowScrollTop(false);
            return;
        }
        const threshold = 320;
        const onScroll = () => {
            setShowScrollTop(el.scrollTop > threshold);
        };
        onScroll();
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [selectedSkills.size, visibleList.length]);

    const scrollToTop = useCallback(() => {
        const el = parentRef.current;
        if (!el) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }, []);

    const totalLoaded = Math.min(loadedCount, visibleList.length);

    const virtualizer = useVirtualizer({
        count: totalLoaded,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64,
        overscan: 5,
    });

    const virtualItems = virtualizer.getVirtualItems();
    const lastItem = virtualItems[virtualItems.length - 1];

    useEffect(() => {
        if (!lastItem || !visibleList.length) return;
        if (lastItem.index >= totalLoaded - 1 && totalLoaded < visibleList.length) {
            setLoadedCount((prev) => prev + PAGE_SIZE);
        }
    }, [lastItem?.index, totalLoaded, visibleList.length]);

    if (isLoading) return <div className="cards-state">Загрузка...</div>;
    if (isError) return <div className="cards-state cards-state--error">Ошибка: {error?.message}</div>;

    return (
        <div className="cards-layout">
            <div className="cards-toolbar">
                <span className="cards-toolbar__hint">
                    Навыки: хотя бы один из отмеченных. Сложность и рейтинг: пустой фильтр — все значения. Подборка: «50 / 100
                    случайных» — новый набор без прокрутки всего списка; «Новый набор» — другие вопросы при тех же фильтрах.
                </span>
                <div className="cards-filters" role="group" aria-label="Фильтр по навыкам">
                    {SKILL_FILTERS.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            className={`cards-filter${selectedSkills.has(id) ? ' cards-filter--active' : ''}`}
                            aria-pressed={selectedSkills.has(id)}
                            onClick={() => toggleSkill(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div
                    className="cards-toolbar__row cards-toolbar__row--complexity"
                    role="group"
                    aria-label="Question Difficulty"
                >
                    <span className="cards-toolbar__subhint">Question Difficulty</span>
                    <div className="cards-filters cards-filters--complexity">
                        {DIFFICULTY_FILTERS.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                className={`cards-filter cards-filter--complexity cards-filter--${id}${selectedDifficulty.has(id) ? ' cards-filter--active' : ''}`}
                                aria-pressed={selectedDifficulty.has(id)}
                                onClick={() => toggleDifficulty(id)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="cards-toolbar__row" role="group" aria-label="Question Rating">
                    <span className="cards-toolbar__subhint">Question Rating</span>
                    <div className="cards-filters cards-filters--rating">
                        {RATING_FILTERS.map((n) => (
                            <button
                                key={n}
                                type="button"
                                className={`cards-filter cards-filter--rating${selectedRating.has(n) ? ' cards-filter--active' : ''}`}
                                aria-pressed={selectedRating.has(n)}
                                onClick={() => toggleRating(n)}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="cards-toolbar__row cards-toolbar__row--sample" role="group" aria-label="Подборка вопросов">
                    <span className="cards-toolbar__subhint">Подборка</span>
                    <div className="cards-sample">
                        <div className="cards-filters cards-filters--sample">
                            <button
                                type="button"
                                className={`cards-filter cards-filter--sample${sampleMode === 'all' ? ' cards-filter--active' : ''}`}
                                aria-pressed={sampleMode === 'all'}
                                onClick={() => setSampleMode('all')}
                            >
                                Все
                            </button>
                            <button
                                type="button"
                                className={`cards-filter cards-filter--sample${sampleMode === 'random50' ? ' cards-filter--active' : ''}`}
                                aria-pressed={sampleMode === 'random50'}
                                onClick={() => setSampleMode('random50')}
                            >
                                50 случайных
                            </button>
                            <button
                                type="button"
                                className={`cards-filter cards-filter--sample${sampleMode === 'random100' ? ' cards-filter--active' : ''}`}
                                aria-pressed={sampleMode === 'random100'}
                                onClick={() => setSampleMode('random100')}
                            >
                                100 случайных
                            </button>
                        </div>
                        {sampleMode !== 'all' && (
                            <button
                                type="button"
                                className="cards-sample-refresh"
                                onClick={reshuffle}
                            >
                                Новый набор
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div ref={parentRef} className="cards-container">
                {selectedSkills.size === 0 ? (
                    <div className="cards-state">Включите хотя бы один навык</div>
                ) : visibleList.length === 0 ? (
                    <div className="cards-state">Нет карточек по выбранным фильтрам</div>
                ) : (
                    <ul
                        className="cards-list"
                        style={{ height: `${virtualizer.getTotalSize()}px` }}
                    >
                        {virtualizer.getVirtualItems().map((virtualRow) => (
                            <li
                                key={visibleList[virtualRow.index].id}
                                data-index={virtualRow.index}
                                ref={virtualizer.measureElement}
                                className="cards-item"
                                style={{ transform: `translateY(${virtualRow.start}px)` }}
                            >
                                <Card card={visibleList[virtualRow.index]} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {showScrollTop && (
                <button
                    type="button"
                    className="cards-scroll-top"
                    onClick={scrollToTop}
                    aria-label="Прокрутить список вверх"
                    title="Наверх"
                >
                    <svg
                        className="cards-scroll-top__icon"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
};
