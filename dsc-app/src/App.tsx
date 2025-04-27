import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "@/routes/AppRouter";
import { useTheme } from "@/hooks/useTheme";
import { useInactivityTimeout } from "./hooks";

const App: React.FC = () => {
  useTheme();
  useInactivityTimeout();

  return (
    <Router>
      <AppRouter />
    </Router>
  );
};

export default App;
