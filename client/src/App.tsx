import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Playground from "./pages/Playground";
import ApiKeys from "./pages/ApiKeys";
import Analytics from "./pages/Analytics";
import Prompts from "./pages/Prompts";
import Projects from "./pages/Projects";
import Billing from "./pages/Billing";
import Support from "./pages/Support";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";

function DashboardRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">{() => <DashboardRoute component={Dashboard} />}</Route>
      <Route path="/playground">{() => <DashboardRoute component={Playground} />}</Route>
      <Route path="/api-keys">{() => <DashboardRoute component={ApiKeys} />}</Route>
      <Route path="/analytics">{() => <DashboardRoute component={Analytics} />}</Route>
      <Route path="/prompts">{() => <DashboardRoute component={Prompts} />}</Route>
      <Route path="/projects">{() => <DashboardRoute component={Projects} />}</Route>
      <Route path="/billing">{() => <DashboardRoute component={Billing} />}</Route>
      <Route path="/support">{() => <DashboardRoute component={Support} />}</Route>
      <Route path="/settings">{() => <DashboardRoute component={Settings} />}</Route>
      <Route path="/admin">{() => <DashboardRoute component={Admin} />}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AccessibilityProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
