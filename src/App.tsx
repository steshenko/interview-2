import './App.css'
import {Index} from "./components/Header";
import {AppRouter} from "./routes/AppRouter.tsx";
import {BrowserRouter} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {

  return (
      <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Index/>
            <AppRouter/>
          </BrowserRouter>
      </QueryClientProvider>
  )
}

export default App