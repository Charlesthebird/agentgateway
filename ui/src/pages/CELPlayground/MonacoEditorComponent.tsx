import { Editor } from "@monaco-editor/react";
import { useCallback } from "react";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
  height: string;
  theme: string;
  options?: any;
  onEvaluate?: () => void;
}

export const MonacoEditorComponent = ({
  value,
  onChange,
  language,
  height,
  theme,
  options = {},
  onEvaluate,
}: MonacoEditorProps) => {
  const handleEditorMount = useCallback(
    (editor: any, monaco: any) => {
      if (onEvaluate) {
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
          onEvaluate,
        );
      }
      // Mark container so Vimium recognizes the editor as a text input
      const domNode = editor.getDomNode();
      if (domNode) {
        domNode.setAttribute("role", "textbox");
        domNode.setAttribute("aria-multiline", "true");
      }
    },
    [onEvaluate],
  );

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      language={language}
      theme={theme}
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        lineNumbers: "off",
        wordWrap: "on",
        ...options,
      }}
      onMount={handleEditorMount}
    />
  );
};
