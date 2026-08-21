import React, { useCallback, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useAppStore } from '@/store';

export function CodeEditor() {
  const {
    activeFileId,
    editorSettings,
    updateFileContent,
    getActiveFile,
  } = useAppStore();

  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      monaco.editor.defineTheme('codelab-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '555555', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'c792ea' },
          { token: 'string', foreground: 'c3e88d' },
          { token: 'number', foreground: 'f78c6c' },
          { token: 'type', foreground: 'ffcb6b' },
          { token: 'function', foreground: '82aaff' },
          { token: 'variable', foreground: 'f07178' },
          { token: 'operator', foreground: '89ddff' },
          { token: 'delimiter', foreground: '89ddff' },
          { token: 'identifier', foreground: 'eeffff' },
        ],
        colors: {
          'editor.background': '#0a0a0a',
          'editor.foreground': '#e8e8e8',
          'editor.lineHighlightBackground': '#111111',
          'editor.selectionBackground': '#264f7866',
          'editor.inactiveSelectionBackground': '#264f7833',
          'editorCursor.foreground': '#e8e8e8',
          'editorLineNumber.foreground': '#333333',
          'editorLineNumber.activeForeground': '#666666',
          'editorIndentGuide.background': '#1a1a1a',
          'editorIndentGuide.activeBackground': '#2a2a2a',
          'editor.selectionHighlightBackground': '#264f7822',
          'editorBracketMatch.background': '#264f7844',
          'editorBracketMatch.border': '#444444',
          'editorWidget.background': '#111111',
          'editorWidget.border': '#222222',
          'editorSuggestWidget.background': '#111111',
          'editorSuggestWidget.border': '#222222',
          'editorSuggestWidget.selectedBackground': '#1a1a1a',
          'input.background': '#0a0a0a',
          'input.border': '#222222',
          'input.foreground': '#e8e8e8',
          'scrollbar.shadow': '#00000000',
          'scrollbarSlider.background': '#22222288',
          'scrollbarSlider.hoverBackground': '#33333388',
          'scrollbarSlider.activeBackground': '#44444488',
        },
      });

      monaco.editor.setTheme('codelab-dark');

      editor.updateOptions({
        fontSize: editorSettings.fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        minimap: { enabled: editorSettings.minimap },
        lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
        wordWrap: editorSettings.wordWrap,
        tabSize: editorSettings.tabSize,
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoIndent: 'full',
        formatOnPaste: true,
        formatOnType: true,
        bracketPairColorization: { enabled: true },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        renderLineHighlight: 'all',
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showFunctions: true,
          showVariables: true,
          showClasses: true,
          showModules: true,
        },
      });

      // C++ Snippets
      monaco.languages.registerCompletionItemProvider('cpp', {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endLineNumber: position.lineNumber,
            endColumn: word.endColumn,
          };

          return {
            suggestions: [
              {
                label: 'main',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'int main() {\n\t${1:// code}\n\treturn 0;\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Main function',
                range,
              },
              {
                label: 'cout',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'std::cout << "${1:message}" << std::endl;',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Print to stdout',
                range,
              },
              {
                label: 'cin',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'std::cin >> ${1:variable};',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Read from stdin',
                range,
              },
              {
                label: 'for',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3:// code}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'For loop',
                range,
              },
              {
                label: 'if',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'if (${1:condition}) {\n\t${2:// code}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'If statement',
                range,
              },
              {
                label: 'while',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'while (${1:condition}) {\n\t${2:// code}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'While loop',
                range,
              },
              {
                label: 'class',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'class ${1:ClassName} {\npublic:\n\t${2:ClassName}() {}\n\t~${1:ClassName}() {}\n};',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Class definition',
                range,
              },
              {
                label: 'vector',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'std::vector<${1:int}> ${2:vec};',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Vector declaration',
                range,
              },
              {
                label: '#include',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: '#include <${1:iostream}>',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Include header',
                range,
              },
            ],
          };
        },
      });

      // Add keyboard shortcut for running
      editor.addAction({
        id: 'run-cpp',
        label: 'Run C++',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          window.dispatchEvent(new CustomEvent('run-cpp'));
        },
      });
    },
    [editorSettings]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        updateFileContent(activeFileId, value);
      }
    },
    [activeFileId, updateFileContent]
  );

  const file = getActiveFile();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Editor
        key={activeFileId}
        height="100%"
        language="cpp"
        value={file?.content || ''}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          fontSize: editorSettings.fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: editorSettings.minimap },
          lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
          wordWrap: editorSettings.wordWrap,
          tabSize: editorSettings.tabSize,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        loading={
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--fg-muted)',
              fontFamily: 'var(--font-code)',
              fontSize: 13,
            }}
          >
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
