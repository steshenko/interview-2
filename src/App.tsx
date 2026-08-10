import './App.css'
import {AppRouter} from "./routes/AppRouter.tsx";
import {BrowserRouter} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {

  return (
      <QueryClientProvider client={queryClient}>
          <BrowserRouter basename="/interview-2">
            <AppRouter/>
          </BrowserRouter>
      </QueryClientProvider>
  )
}

export default App