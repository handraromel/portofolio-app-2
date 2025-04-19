import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "@/routes/AppRouter";
import { useTheme } from "@/hooks/useTheme";

const App: React.FC = () => {
  useTheme();

  return (
    <Router>
      <AppRouter />
    </Router>
  );
};

export default App;
