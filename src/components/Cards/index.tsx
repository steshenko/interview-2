import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '../Card';
import { useCards, type Question } from '../../hooks/useCards.js';
import { difficultyTier, type DifficultyTier } from '../../lib/complexityBand.js';
import { SKILL_FILTERS } from '../../lib/skillFilters.js';
import { seededShuffle } from '../../lib/seededShuffle.js';
import type { SampleMode } from '../Toolbar';
import './Cards.css';

const PAGE_SIZE = 50;

/** Стабильная ссылка, чтобы useMemo / useEffect не срабатывали на каждом рендере */
const EMPTY_POOL: Question[] = [];

function filterBySkills(data: Question[], selected: ReadonlySet<string>): Question[] {
    if (selected.size === 0) return data;
    const titles = new Set<string>(
        SKILL_FILTERS.filter((f) => selected.has(f.id)).map((f) => f.skillTitle),
    );
    return data.filter((q) => q.questionSkills?.some((s) => titles.has(s.title)));
}

function filterByDifficulty(data: Question[], selected: ReadonlySet<DifficultyTier>): Question[] {
    if (selected.size === 0) return data;
    return data.filter((q) => selected.has(difficultyTier(q.complexity)));
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

interface CardsProps {
    selectedSkills: ReadonlySet<string>;
    selectedDifficulty: ReadonlySet<DifficultyTier>;
    sampleMode: SampleMode;
    shuffleKey: number;
    setShuffleKey: Dispatch<SetStateAction<number>>;
}

export const Cards = ({
    selectedSkills,
    selectedDifficulty,
    sampleMode,
    shuffleKey,
    setShuffleKey,
}: CardsProps) => {
    const { data, isLoading, isError, error } = useCards();
    const parentRef = useRef<HTMLDivElement>(null);
    const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);

    const filteredPool = useMemo(() => {
        if (!data) return EMPTY_POOL;
        const bySkills = filterBySkills(data, selectedSkills);
        const result = filterByDifficulty(bySkills, selectedDifficulty);
        return result.length === 0 ? EMPTY_POOL : result;
    }, [data, selectedSkills, selectedDifficulty]);

    const visibleList = useMemo(
        () => buildVisibleList(filteredPool, sampleMode, shuffleKey),
        [filteredPool, sampleMode, shuffleKey],
    );

    /** Новая перетасовка при изменении отфильтрованного пула (фильтры / данные) */
    useEffect(() => {
        setShuffleKey((k) => k + 1);
    }, [filteredPool, setShuffleKey]);

    useEffect(() => {
        setLoadedCount(PAGE_SIZE);
        parentRef.current?.scrollTo({ top: 0 });
    }, [filteredPool, sampleMode, shuffleKey]);

    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const el = parentRef.current;
        if (!el || visibleList.length === 0) {
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
    }, [visibleList.length]);

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
            <div ref={parentRef} className="cards-container">
                {visibleList.length === 0 ? (
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
