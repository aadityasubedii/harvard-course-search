import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add custom font imports
const fontLinks = document.createElement("link");
fontLinks.rel = "stylesheet";
fontLinks.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap";
document.head.appendChild(fontLinks);

// Set page title
const titleElement = document.createElement("title");
titleElement.textContent = "CourseChat | Harvard Course Search Assistant";
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
