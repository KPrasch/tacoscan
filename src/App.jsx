import "./App.css";
import HomePage from "./pages/home";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
