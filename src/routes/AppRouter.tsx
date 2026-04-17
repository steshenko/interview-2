import {Route, Routes} from "react-router-dom";
import {CardsPage} from "../pages/CardsPage.tsx";
import {HomePage} from "../pages/HomePage.tsx";

export const AppRouter = () => {
    return (
        <>
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/card-page" element={<CardsPage/>}/>
            </Routes>
        </>
    )
}