import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initStorage } from "./lib/storage.ts";

const bootstrap = async () => {
  await initStorage();
  createRoot(document.getElementById("root")!).render(<App />);
};

bootstrap();
