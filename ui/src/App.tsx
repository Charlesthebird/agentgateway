import { ConfigProvider, theme } from "antd";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MainLayout } from "./components/Layout/MainLayout";
import { BackendsPage } from "./pages/Backends/BackendsPage";
import { CELPlaygroundPage } from "./pages/CELPlayground/CELPlaygroundPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { FormPage } from "./pages/FormPage";
import { ListenersPage } from "./pages/Listeners/ListenersPage";
import { LLMLogsPage } from "./pages/LLM/LLMLogsPage";
import { LLMMetricsPage } from "./pages/LLM/LLMMetricsPage";
import { LLMModelsPage } from "./pages/LLM/LLMModelsPage";
import { LLMOverviewPage } from "./pages/LLM/LLMOverviewPage";
import { LLMPlaygroundPage } from "./pages/LLM/LLMPlaygroundPage";
import { MCPOverviewPage } from "./pages/MCP/MCPOverviewPage";
import {
  MCPLogsPage,
  MCPMetricsPage,
  MCPPlaygroundPage,
} from "./pages/MCP/MCPPages";
import { MCPServersPage } from "./pages/MCP/MCPServersPage";
import { PlaygroundPage } from "./pages/Playground/PlaygroundPage";
import { PoliciesPage } from "./pages/Policies/PoliciesPage";
import { RoutesPage } from "./pages/Routes/RoutesPage";
import { SetupWizardPage } from "./pages/SetupWizard/SetupWizardPage";
import {
  TrafficLogsPage,
  TrafficMetricsPage,
  TrafficOverviewPage,
  TrafficRoutingPage,
} from "./pages/Traffic/TrafficPages";

function App() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <BrowserRouter>
        <ErrorBoundary>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* OLD Section */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/listeners" element={<ListenersPage />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/backends" element={<BackendsPage />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/playground" element={<PlaygroundPage />} />

              {/* Generic Form Page */}
              <Route path="/form" element={<FormPage />} />

              {/* LLM Section */}
              <Route path="/llm" element={<LLMOverviewPage />} />
              <Route path="/llm/models" element={<LLMModelsPage />} />
              <Route path="/llm/logs" element={<LLMLogsPage />} />
              <Route path="/llm/metrics" element={<LLMMetricsPage />} />
              <Route path="/llm/playground" element={<LLMPlaygroundPage />} />

              {/* MCP Section */}
              <Route path="/mcp" element={<MCPOverviewPage />} />
              <Route path="/mcp/servers" element={<MCPServersPage />} />
              <Route path="/mcp/logs" element={<MCPLogsPage />} />
              <Route path="/mcp/metrics" element={<MCPMetricsPage />} />
              <Route path="/mcp/playground" element={<MCPPlaygroundPage />} />

              {/* Traffic Section */}
              <Route path="/traffic" element={<TrafficOverviewPage />} />
              <Route path="/traffic/routing" element={<TrafficRoutingPage />} />
              <Route path="/traffic/logs" element={<TrafficLogsPage />} />
              <Route path="/traffic/metrics" element={<TrafficMetricsPage />} />

              {/* CEL Playground */}
              <Route path="/cel-playground" element={<CELPlaygroundPage />} />

              {/* Setup Wizard */}
              <Route path="/setup" element={<SetupWizardPage />} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        </ErrorBoundary>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
