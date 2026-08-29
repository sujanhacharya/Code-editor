import { useCallback, useEffect, useMemo, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useAppStore } from '@/store';
import { registerEditorValueGetter } from '@/utils/editorBridge';

/**
 * Completion providers are registered against the *language*, not the editor
 * instance, so registering inside onMount added a duplicate set of snippets
 * every time the editor remounted (i.e. on every file switch) — after a few
 * switches the suggest widget showed "main" three or four times over. Monaco is
 * a singleton per page, so one registration for the whole session is correct.
 */
let cppSnippetsRegistered = false;

function registerCppSnippets(monaco: any) {
  if (cppSnippetsRegistered) return;
  cppSnippetsRegistered = true;

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
}

export function CodeEditor() {
  // Narrow selectors: this component must not re-render (and call
  // updateOptions ~60x/sec) while the terminal divider is being dragged.
  const activeFileId = useAppStore((s) => s.activeFileId);
  const editorSettings = useAppStore((s) => s.editorSettings);
  const updateFileContent = useAppStore((s) => s.updateFileContent);
  const file = useAppStore((s) => s.files.find((f) => f.id === s.activeFileId));

  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
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

    // C++ snippets — registered once per page, not once per mount.
    registerCppSnippets(monaco);

    // Add keyboard shortcut for running
    editor.addAction({
      id: 'run-cpp',
      label: 'Run C++',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        window.dispatchEvent(new CustomEvent('run-cpp'));
      },
    });

    // Cmd+` / Ctrl+` must toggle the terminal even while Monaco has focus.
    // Monaco swallows keydown events it owns, so the global window listener
    // alone is not enough — this registers the shortcut with the editor
    // itself. Only Backquote is claimed, so every other Monaco binding
    // (Cmd+F, Cmd+D, Cmd+/, multi-cursor, etc.) keeps working.
    editor.addAction({
      id: 'toggle-terminal-panel',
      label: 'Toggle Terminal Panel',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote,
        // On macOS CtrlCmd means Cmd, so bind literal Ctrl separately.
        monaco.KeyMod.WinCtrl | monaco.KeyCode.Backquote,
      ],
      run: () => {
        useAppStore.getState().toggleTerminal();
      },
    });

    // The status bar advertises "⌘ K for commands" and the palette lists
    // "⌘ ⇧ L" for Clear Output, but Monaco stops propagation of the keys it
    // owns, so neither fired while the cursor was in the editor — which is
    // almost always. Registering them here makes the advertised shortcuts real.
    editor.addAction({
      id: 'open-command-palette',
      label: 'Open CodeLab Command Palette',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      run: () => {
        useAppStore.getState().setCommandPaletteOpen(true);
      },
    });

    editor.addAction({
      id: 'clear-output',
      label: 'Clear Output',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL],
      run: () => {
        // Output only. Source, files, stdin and editor state are untouched.
        useAppStore.getState().clearOutput();
      },
    });
  }, []);

  /**
   * Publish a read-only view of the live model so "Download" writes out exactly
   * what is on screen. The getter reads editorRef lazily, so registering before
   * Monaco has finished mounting is fine.
   *
   * Re-registered on file switch so the text can always be matched to the file
   * it belongs to.
   */
  useEffect(
    () =>
      registerEditorValueGetter(activeFileId, () =>
        editorRef.current?.getModel()?.getValue()
      ),
    [activeFileId]
  );

  /**
   * Jump to a compiler diagnostic (PROBLEMS tab click).
   *
   * This moves the cursor and reveals the line on the EXISTING editor instance.
   * The model is never replaced, so the file content, undo history, selection
   * and syntax highlighting are all preserved.
   */
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { line?: number; column?: number }
        | undefined;
      const editor = editorRef.current;
      if (!editor || !detail || !detail.line) return;

      const lineNumber = Math.max(1, Math.floor(detail.line));
      const column = Math.max(1, Math.floor(detail.column ?? 1));

      editor.revealLineInCenterIfOutsideViewport(lineNumber);
      editor.setPosition({ lineNumber, column });
      editor.focus();
    };

    window.addEventListener('goto-position', handler);
    return () => window.removeEventListener('goto-position', handler);
  }, []);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        updateFileContent(activeFileId, value);
      }
    },
    [activeFileId, updateFileContent]
  );

  /**
   * Memoised so the object identity only changes when a setting actually
   * changes. @monaco-editor/react calls editor.updateOptions() whenever this
   * prop is a new object, and an inline literal made that fire on every render
   * — including every mousemove of a divider drag.
   */
  const options = useMemo(
    () => ({
      fontSize: editorSettings.fontSize,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      minimap: { enabled: editorSettings.minimap },
      lineNumbers: (editorSettings.lineNumbers ? 'on' : 'off') as 'on' | 'off',
      wordWrap: editorSettings.wordWrap,
      tabSize: editorSettings.tabSize,
      autoClosingBrackets: 'always' as const,
      autoClosingQuotes: 'always' as const,
      autoIndent: 'full' as const,
      formatOnPaste: true,
      formatOnType: true,
      bracketPairColorization: { enabled: true },
      smoothScrolling: true,
      cursorBlinking: 'smooth' as const,
      cursorSmoothCaretAnimation: 'on' as const,
      renderLineHighlight: 'all' as const,
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
    }),
    [
      editorSettings.fontSize,
      editorSettings.minimap,
      editorSettings.lineNumbers,
      editorSettings.wordWrap,
      editorSettings.tabSize,
    ]
  );

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
        options={options}
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
