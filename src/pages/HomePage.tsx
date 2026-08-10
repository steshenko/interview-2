import { useCallback, useState } from 'react';
import { Toolbar, type SampleMode } from '../components/Toolbar';
import { Cards } from '../components/Cards';
import type { DifficultyTier } from '../lib/complexityBand';
import './HomePage.css';

export const HomePage = () => {
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(() => new Set());
    const [selectedDifficulty, setSelectedDifficulty] = useState<Set<DifficultyTier>>(
        () => new Set(),
    );
    const [sampleMode, setSampleMode] = useState<SampleMode>('all');
    const [shuffleKey, setShuffleKey] = useState(0);

    const toggleSkill = useCallback((id: string) => {
        setSelectedSkills((prev) => {
            if (id === 'all') return new Set();
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

    const reshuffle = useCallback(() => {
        setShuffleKey((k) => k + 1);
    }, []);

    return (
        <main className="home">
            <div className="home__header">
                <Toolbar
                    selectedSkills={selectedSkills}
                    onToggleSkill={toggleSkill}
                    selectedDifficulty={selectedDifficulty}
                    onToggleDifficulty={toggleDifficulty}
                    sampleMode={sampleMode}
                    onSampleModeChange={setSampleMode}
                    onReshuffle={reshuffle}
                />
            </div>
            <Cards
                selectedSkills={selectedSkills}
                selectedDifficulty={selectedDifficulty}
                sampleMode={sampleMode}
                shuffleKey={shuffleKey}
                setShuffleKey={setShuffleKey}
            />
        </main>
    );
};
