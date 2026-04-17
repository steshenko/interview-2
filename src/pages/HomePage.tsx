import { Category } from '../components/Category';
import './HomePage.css';

export const HomePage = () => {
    return (
        <main className="home">
            <h1 className="home__title">Interview 2.0</h1>
            <p className="home__subtitle">Подготовка к техническому интервью</p>
            <Category />
        </main>
    );
};
