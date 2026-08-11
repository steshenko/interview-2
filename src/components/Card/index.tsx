import { useState, useCallback } from 'react';
import { difficultyTier, DIFFICULTY_LEVEL, DIFFICULTY_RANGE_LABEL } from '../../lib/complexityBand.js';
import './Card.css';

interface CardProps {
    card: {
        id: number;
        title: string;
        shortAnswer?: string;
        complexity?: number;
        questionSkills?: { title: string }[];
    };
}

export const Card = ({ card }: CardProps) => {
    const [expanded, setExpanded] = useState(false);
    const [bodyMounted, setBodyMounted] = useState(false);
    const tier = difficultyTier(card.complexity);
    const level = DIFFICULTY_LEVEL[tier];
    const topics = Array.from(
        new Set((card.questionSkills ?? []).map((s) => s.title.trim()).filter(Boolean)),
    );

    const handleToggle = useCallback(() => {
        if (!card.shortAnswer) return;
        if (expanded) {
            setExpanded(false);
        } else {
            setBodyMounted(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setExpanded(true));
            });
        }
    }, [expanded, card.shortAnswer]);

    const handleCollapseTransitionEnd = useCallback(
        (e: React.TransitionEvent<HTMLDivElement>) => {
            if (e.propertyName !== 'grid-template-rows') return;
            if (!expanded) setBodyMounted(false);
        },
        [expanded],
    );

    const complexityDescId = `card-${card.id}-complexity`;

    return (
        <div className="card">
            <span id={complexityDescId} className="card__sr-only">
                Сложность: {DIFFICULTY_RANGE_LABEL[tier]}
            </span>
            <div
                className="card__header"
                onClick={handleToggle}
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                aria-describedby={complexityDescId}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggle();
                    }
                }}
            >
                {topics.length > 0 && (
                    <span className="card__topic">{topics.join(', ')}</span>
                )}
                <h2 className="card__title">{card.title}</h2>
                <div className="card__header-right">
                    <span
                        className="card__complexity"
                        title={`Сложность ${DIFFICULTY_RANGE_LABEL[tier]}`}
                        aria-hidden="true"
                    >
                        {[1, 2, 3, 4].map((i) => (
                            <span
                                key={i}
                                className={`card__dot${i <= level ? ' card__dot--filled' : ''}`}
                            />
                        ))}
                    </span>
                    <svg
                        className={`card__chevron${expanded ? ' card__chevron--open' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>
            <div
                className={`card__collapse${expanded ? ' card__collapse--open' : ''}`}
                onTransitionEnd={handleCollapseTransitionEnd}
            >
                {bodyMounted && card.shortAnswer && (
                    <div className="card__collapse-inner">
                        <div
                            className="card__body"
                            dangerouslySetInnerHTML={{ __html: card.shortAnswer }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
