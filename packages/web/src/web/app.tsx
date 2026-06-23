import { Route, Switch } from "wouter";
import { AnimatePresence } from "framer-motion";
import { Provider } from "./components/provider";
import { ChatProvider } from "./context/ChatContext";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Provider>
      <ChatProvider>
        <AnimatePresence mode="wait">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/chat" component={Chat} />
            <Route component={NotFound} />
          </Switch>
        </AnimatePresence>
        {import.meta.env.DEV && <AgentFeedback />}
        <RunableBadge />
      </ChatProvider>
    </Provider>
  );
}

export default App;
