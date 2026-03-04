import styled from "@emotion/styled";
import type { MenuProps } from "antd";
import { Layout as AntLayout, Button, Menu } from "antd";
import {
  BarChart3,
  Boxes,
  Brain,
  FileText,
  FlaskConical,
  Headphones,
  Home,
  Moon,
  Network,
  Route,
  Server,
  Shield,
  Sparkles,
  Sun,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts";
import { AgentgatewayLogo } from "../AgentgatewayLogo";
import { Breadcrumbs } from "../Breadcrumbs";

const { Sider, Content, Header } = AntLayout;

const StyledLayout = styled(AntLayout)`
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const StyledSider = styled(Sider)`
  display: flex;
  flex-direction: column;
  background: var(--color-bg-container);
  border-right: 1px solid var(--color-border-secondary);
  overflow-y: auto;

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
`;

const StyledHeader = styled(Header)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg-container);
  border-bottom: 1px solid var(--color-border-secondary);
  padding: 0 var(--spacing-xl);
  height: var(--header-height);
  min-height: var(--header-height);
`;

const ContentWrapper = styled(AntLayout)`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const StyledContent = styled(Content)`
  flex: 1;
  overflow-y: auto;
  background: var(--color-bg-layout);
  padding: var(--spacing-xl);
  min-height: 0;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-secondary);
  cursor: pointer;
  transition: opacity var(--transition-base) var(--transition-timing);

  svg {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  span {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-base);
  }

  &:hover {
    opacity: 0.8;
  }
`;

const ThemeToggleButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-base);
  background: var(--color-bg-container);
  color: var(--color-text-base);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);

  &:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`;

const StyledMenu = styled(Menu)`
  /* Menu item hover and selected states */
  .ant-menu-item,
  .ant-menu-submenu-title {
    transition: background-color 0.15s ease;
    border-radius: 6px;

    &:hover {
      background-color: var(--color-bg-hover) !important;
    }

    &:active {
      background-color: var(--color-bg-selected) !important;
    }
  }

  /* Selected state */
  .ant-menu-item-selected {
    background-color: var(--color-bg-selected) !important;
  }

  /* Submenu selected state */
  .ant-menu-submenu-selected > .ant-menu-submenu-title {
    background-color: var(--color-bg-hover) !important;
  }
`;

type MenuItem = Required<MenuProps>["items"][number];

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Find which parent menu should be open based on current path
  const getInitialOpenKey = () => {
    const path = location.pathname;
    if (path.startsWith("/llm")) return "llm";
    if (path.startsWith("/mcp")) return "mcp";
    if (path.startsWith("/traffic")) return "traffic";
    if (
      [
        "/dashboard",
        "/listeners",
        "/routes",
        "/backends",
        "/policies",
        "/playground",
      ].includes(path)
    ) {
      return "old";
    }
    return null;
  };

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const initialKey = getInitialOpenKey();
    return initialKey ? [initialKey] : [];
  });

  // Ensure current section is open when location changes, but don't close others
  useEffect(() => {
    const currentKey = getInitialOpenKey();
    if (currentKey && !openKeys.includes(currentKey)) {
      setOpenKeys((prev) => [...prev, currentKey]);
    }
  }, [location.pathname]);

  const menuItems: MenuItem[] = [
    {
      key: "old",
      label: "OLD",
      icon: <Boxes size={18} />,
      onClick: () => navigate("/dashboard"),
      children: [
        {
          key: "/dashboard",
          icon: <Home size={18} />,
          label: "Home",
        },
        {
          key: "/listeners",
          icon: <Headphones size={18} />,
          label: "Listeners",
        },
        {
          key: "/routes",
          icon: <Route size={18} />,
          label: "Routes",
        },
        {
          key: "/backends",
          icon: <Server size={18} />,
          label: "Backends",
        },
        {
          key: "/policies",
          icon: <Shield size={18} />,
          label: "Policies",
        },
        {
          key: "/playground",
          icon: <FlaskConical size={18} />,
          label: "Playground",
        },
      ],
    },
    {
      key: "llm",
      label: "LLM",
      icon: <Brain size={18} />,
      onClick: () => navigate("/llm"),
      children: [
        {
          key: "/llm",
          icon: <Brain size={18} />,
          label: "LLM (Overview)",
        },
        {
          key: "/llm/models",
          icon: <Boxes size={18} />,
          label: "Models",
        },
        {
          key: "/llm/policies",
          icon: <Shield size={18} />,
          label: "Policies",
        },
        {
          key: "/llm/logs",
          icon: <FileText size={18} />,
          label: "Logs",
        },
        {
          key: "/llm/metrics",
          icon: <BarChart3 size={18} />,
          label: "Metrics",
        },
        {
          key: "/llm/playground",
          icon: <FlaskConical size={18} />,
          label: "Playground",
        },
      ],
    },
    {
      key: "mcp",
      label: "MCP",
      icon: <Network size={18} />,
      onClick: () => navigate("/mcp"),
      children: [
        {
          key: "/mcp",
          icon: <Network size={18} />,
          label: "MCP (Overview)",
        },
        {
          key: "/mcp/servers",
          icon: <Server size={18} />,
          label: "Servers",
        },
        {
          key: "/mcp/policies",
          icon: <Shield size={18} />,
          label: "Policies",
        },
        {
          key: "/mcp/logs",
          icon: <FileText size={18} />,
          label: "Logs",
        },
        {
          key: "/mcp/metrics",
          icon: <BarChart3 size={18} />,
          label: "Metrics",
        },
        {
          key: "/mcp/playground",
          icon: <FlaskConical size={18} />,
          label: "Playground",
        },
      ],
    },
    {
      key: "traffic",
      label: "Traffic",
      icon: <Workflow size={18} />,
      onClick: () => navigate("/traffic"),
      children: [
        {
          key: "/traffic",
          icon: <Workflow size={18} />,
          label: "Traffic (Overview)",
        },
        {
          key: "/traffic/routing",
          icon: <Route size={18} />,
          label: "Routing",
        },
        {
          key: "/traffic2",
          icon: <Route size={18} />,
          label: "Routing (TS Forms)",
        },
        {
          key: "/traffic3",
          icon: <Route size={18} />,
          label: "Routing (Manual Schemas)",
        },
        {
          key: "/traffic/logs",
          icon: <FileText size={18} />,
          label: "Logs",
          disabled: true,
        },
        {
          key: "/traffic/metrics",
          icon: <BarChart3 size={18} />,
          label: "Metrics",
          disabled: true,
        },
      ],
    },
    {
      key: "/cel-playground",
      icon: <Sparkles size={18} />,
      label: "CEL Playground",
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    // Only navigate for leaf items (not parent items with onClick)
    if (key && !["old", "llm", "mcp", "traffic"].includes(key)) {
      navigate(key);
    }
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const selectedKeys = useMemo(() => {
    const knownPaths = [
      "/traffic/routing",
      "/traffic2",
      "/traffic3",
      "/traffic/logs",
      "/traffic/metrics",
      "/llm/models",
      "/llm/policies",
      "/llm/logs",
      "/llm/metrics",
      "/llm/playground",
      "/mcp/servers",
      "/mcp/policies",
      "/mcp/logs",
      "/mcp/metrics",
      "/mcp/playground",
    ];

    // Find longest matching prefix
    let longestMatch = location.pathname;
    let maxLength = 0;

    for (const path of knownPaths) {
      if (
        location.pathname === path ||
        location.pathname.startsWith(path + "/")
      ) {
        if (path.length > maxLength) {
          longestMatch = path;
          maxLength = path.length;
        }
      }
    }

    return [longestMatch];
  }, [location.pathname]);

  return (
    <StyledLayout>
      <StyledSider width={240} collapsed={false}>
        <Logo onClick={() => navigate("/dashboard")}>
          <AgentgatewayLogo />
          <span>agentgateway</span>
        </Logo>
        <StyledMenu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </StyledSider>
      <ContentWrapper>
        <StyledHeader>
          <Breadcrumbs />
          <ThemeToggleButton
            type="text"
            icon={theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          />
        </StyledHeader>
        <StyledContent>{children}</StyledContent>
      </ContentWrapper>
    </StyledLayout>
  );
};
