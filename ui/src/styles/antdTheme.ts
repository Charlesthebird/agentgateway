import type { ThemeConfig } from "antd";

// Antd theme configuration that uses our CSS custom variables
export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: "#1677ff",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    colorInfo: "#1677ff",
    colorTextBase: "rgba(0, 0, 0, 0.88)",
    colorBgBase: "#ffffff",
    colorBgContainer: "#ffffff",
    colorBorder: "#d9d9d9",
    borderRadius: 6,
    fontSize: 14,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    lineHeight: 1.5715,
  },
  components: {
    Layout: {
      colorBgHeader: "#ffffff",
      colorBgBody: "#f5f5f5",
      colorBgTrigger: "#ffffff",
    },
    Menu: {
      colorItemBg: "transparent",
      colorItemBgSelected: "#e6f4ff",
      colorItemBgHover: "#f5f5f5",
      colorItemTextSelected: "#1677ff",
      colorItemTextHover: "rgba(0, 0, 0, 0.88)",
    },
    Button: {
      primaryShadow: "0 2px 0 rgba(5, 145, 255, 0.1)",
    },
    Card: {
      colorBgContainer: "#ffffff",
      boxShadowTertiary:
        "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
    },
    Table: {
      colorBgContainer: "#ffffff",
      colorBorderSecondary: "#f0f0f0",
    },
    Modal: {
      contentBg: "#ffffff",
      headerBg: "#ffffff",
    },
    Input: {
      colorBgContainer: "#ffffff",
      colorBorder: "#d9d9d9",
    },
    Select: {
      colorBgContainer: "#ffffff",
      colorBorder: "#d9d9d9",
    },
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: "#1677ff",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    colorInfo: "#1677ff",
    colorTextBase: "rgba(255, 255, 255, 0.85)",
    colorBgBase: "#000000",
    colorBgContainer: "#141414",
    colorBorder: "#424242",
    borderRadius: 6,
    fontSize: 14,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    lineHeight: 1.5715,
  },
  components: {
    Layout: {
      colorBgHeader: "#141414",
      colorBgBody: "#000000",
      colorBgTrigger: "#141414",
    },
    Menu: {
      colorItemBg: "transparent",
      colorItemBgSelected: "#111b26",
      colorItemBgHover: "#1f1f1f",
      colorItemTextSelected: "#1677ff",
      colorItemTextHover: "rgba(255, 255, 255, 0.85)",
      darkItemBg: "#141414",
    },
    Button: {
      primaryShadow: "0 2px 0 rgba(5, 145, 255, 0.1)",
    },
    Card: {
      colorBgContainer: "#141414",
      boxShadowTertiary: "0 1px 2px 0 rgba(0, 0, 0, 0.48)",
    },
    Table: {
      colorBgContainer: "#141414",
      colorBorderSecondary: "#303030",
    },
    Modal: {
      contentBg: "#141414",
      headerBg: "#141414",
    },
    Input: {
      colorBgContainer: "#141414",
      colorBorder: "#424242",
    },
    Select: {
      colorBgContainer: "#141414",
      colorBorder: "#424242",
    },
  },
};

// Default export is light theme
export default lightTheme;
