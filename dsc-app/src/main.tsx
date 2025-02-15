import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PrimeReactProvider } from "primereact/api";
import { ToastProvider } from "./context/Toast";
import store from "@/store/config";
import App from "./App";
import "@/assets/styles/index.css";
import "primereact/resources/primereact.min.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <PrimeReactProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </PrimeReactProvider>
    </ToastProvider>
  </React.StrictMode>,
);
