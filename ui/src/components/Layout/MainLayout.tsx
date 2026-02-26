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
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts";
import { AgentgatewayLogo } from "../AgentgatewayLogo";

const { Sider, Content, Header } = AntLayout;

const StyledLayout = styled(AntLayout)`
  width: 100%;
  height: 100%;
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
`;

const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: var(--color-bg-layout);
  padding: var(--spacing-xl);
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

const HeaderTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
  color: var(--color-text-base);
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

type MenuItem = Required<MenuProps>["items"][number];

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Find which parent menu should be open based on current path
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith("/llm")) return ["llm"];
    if (path.startsWith("/mcp")) return ["mcp"];
    if (path.startsWith("/traffic")) return ["traffic"];
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
      return ["old"];
    }
    return [];
  };

  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys());

  // Update open keys when location changes
  useEffect(() => {
    setOpenKeys(getOpenKeys());
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

  // Format header title from path
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "HOME";
    if (path === "/") return "HOME";
    return path.slice(1).toUpperCase().replace(/\//g, " / ");
  };

  return (
    <StyledLayout>
      <StyledSider width={240} collapsed={false}>
        <Logo onClick={() => navigate("/dashboard")}>
          <AgentgatewayLogo />
          <span>agentgateway</span>
        </Logo>
        <Menu
          mode="inline"
          selectedKeys={[
            // Match exact path or the longest known prefix so sub-pages
            // (e.g. /traffic/routing/bind/8080) still highlight their menu item.
            [
              "/traffic/routing",
              "/traffic/logs",
              "/traffic/metrics",
              "/llm/models",
              "/llm/logs",
              "/llm/metrics",
              "/llm/playground",
              "/mcp/servers",
              "/mcp/logs",
              "/mcp/metrics",
              "/mcp/playground",
            ]
              .filter(
                (k) =>
                  location.pathname === k ||
                  location.pathname.startsWith(k + "/"),
              )
              .sort((a, b) => b.length - a.length)[0] ?? location.pathname,
          ]}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </StyledSider>
      <AntLayout>
        <StyledHeader>
          <HeaderTitle>{getHeaderTitle()}</HeaderTitle>
          <ThemeToggleButton
            type="text"
            icon={theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          />
        </StyledHeader>
        <StyledContent>{children}</StyledContent>
      </AntLayout>
    </StyledLayout>
  );
};
