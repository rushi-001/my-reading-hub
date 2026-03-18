import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import "./index.css";
import { appStore } from "@/store/appStore";
import { bootstrapRequested } from "@/store/bookSagaActions";

appStore.dispatch(bootstrapRequested());

createRoot(document.getElementById("root")!).render(
    <Provider store={appStore}>
        <App />
    </Provider>,
);
