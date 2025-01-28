import "./App.css";
import HomePage from "./pages/home";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'

const theme = createTheme({
    typography: {
        allVariants: {
            fontSize: "0.875rem",
            fontFamily: `Work Sans`,
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale"
        },
    },
});

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <HomePage />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
