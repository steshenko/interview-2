import { NavLink } from 'react-router-dom';
import './Navigation.css';

const links = [
    { label: 'Home', to: '/' },
    { label: 'Cards', to: '/card-page' },
];

export const Navigation = () => {
    return (
        <nav className="nav">
            <div className="nav__inner">
                <ul className="nav__list">
                    {links.map(({ label, to }) => (
                        <li key={to}>
                            <NavLink
                                to={to}
                                end
                                className={({ isActive }) =>
                                    `nav__link${isActive ? ' active' : ''}`
                                }
                            >
                                {label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
};
