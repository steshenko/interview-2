import './Category.css';

const categories = ['All', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'CSS', 'HTML', 'Algorithms', 'System Design'];

export const Category = () => {
    return (
        <ul className="category-list">
            {categories.map((category) => (
                <li key={category} className="category-item">
                    {category}
                </li>
            ))}
        </ul>
    );
};
