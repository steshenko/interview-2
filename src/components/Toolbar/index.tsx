import { DIFFICULTY_FILTERS, type DifficultyTier } from '../../lib/complexityBand';
import { SKILL_FILTERS } from '../../lib/skillFilters';
import './Toolbar.css';

export type SampleMode = 'all' | 'random50' | 'random100';

interface ToolbarProps {
    selectedSkills: ReadonlySet<string>;
    onToggleSkill: (id: string) => void;
    selectedDifficulty: ReadonlySet<DifficultyTier>;
    onToggleDifficulty: (id: DifficultyTier) => void;
    sampleMode: SampleMode;
    onSampleModeChange: (mode: SampleMode) => void;
    onReshuffle: () => void;
}

export const Toolbar = ({
    selectedSkills,
    onToggleSkill,
    selectedDifficulty,
    onToggleDifficulty,
    sampleMode,
    onSampleModeChange,
    onReshuffle,
}: ToolbarProps) => {
    return (
        <div className="toolbar">
            <div className="toolbar-group" role="group" aria-label="Категории">
                <button
                    type="button"
                    className={`toolbar-pill${selectedSkills.size === 0 ? ' toolbar-pill--active' : ''}`}
                    aria-pressed={selectedSkills.size === 0}
                    onClick={() => onToggleSkill('all')}
                >
                    All
                </button>
                {SKILL_FILTERS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        className={`toolbar-pill${selectedSkills.has(id) ? ' toolbar-pill--active' : ''}`}
                        aria-pressed={selectedSkills.has(id)}
                        onClick={() => onToggleSkill(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <span className="toolbar-divider" aria-hidden="true" />

            <div className="toolbar-group" role="group" aria-label="Сложность">
                {DIFFICULTY_FILTERS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        className={`toolbar-pill toolbar-pill--${id}${selectedDifficulty.has(id) ? ' toolbar-pill--active' : ''}`}
                        aria-pressed={selectedDifficulty.has(id)}
                        onClick={() => onToggleDifficulty(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <span className="toolbar-divider" aria-hidden="true" />

            <div className="toolbar-group" role="group" aria-label="Подборка вопросов">
                <button
                    type="button"
                    className={`toolbar-pill${sampleMode === 'all' ? ' toolbar-pill--active' : ''}`}
                    aria-pressed={sampleMode === 'all'}
                    onClick={() => onSampleModeChange('all')}
                >
                    Все
                </button>
                <button
                    type="button"
                    className={`toolbar-pill${sampleMode === 'random50' ? ' toolbar-pill--active' : ''}`}
                    aria-pressed={sampleMode === 'random50'}
                    onClick={() => onSampleModeChange('random50')}
                >
                    50 случайных
                </button>
                <button
                    type="button"
                    className={`toolbar-pill${sampleMode === 'random100' ? ' toolbar-pill--active' : ''}`}
                    aria-pressed={sampleMode === 'random100'}
                    onClick={() => onSampleModeChange('random100')}
                >
                    100 случайных
                </button>
                {sampleMode !== 'all' && (
                    <button type="button" className="toolbar-refresh" onClick={onReshuffle}>
                        Новый набор
                    </button>
                )}
            </div>
        </div>
    );
};
