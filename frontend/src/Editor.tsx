import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import type { Span } from "./types";

export function Editor({
  value,
  onChange,
  onCompile,
  selection,
}: {
  value: string;
  onChange: (value: string) => void;
  onCompile: () => void;
  selection: Span | null;
}) {
  const host = useRef<HTMLDivElement>(null),
    view = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onCompile });
  callbacks.current = { onChange, onCompile };
  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          history(),
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                callbacks.current.onCompile();
                return true;
              },
            },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            "aria-label": "Logic source editor",
            spellcheck: "false",
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged)
              callbacks.current.onChange(update.state.doc.toString());
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "14px" },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily: '"SFMono-Regular",Consolas,monospace',
            },
            ".cm-content": { padding: "24px 0" },
            ".cm-line": { padding: "0 20px" },
            ".cm-gutters": {
              background: "#f5f6f3",
              border: "none",
              color: "#92998f",
            },
            ".cm-activeLine": { background: "#eaf0e7" },
            "&.cm-focused": { outline: "none" },
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, []);
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value)
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: value },
      });
  }, [value]);
  useEffect(() => {
    const editor = view.current;
    if (editor && selection) {
      editor.dispatch({
        selection: {
          anchor: Array.from(editor.state.doc.toString())
            .slice(0, selection.start)
            .join("").length,
          head: Array.from(editor.state.doc.toString())
            .slice(0, selection.end)
            .join("").length,
        },
        scrollIntoView: true,
      });
      editor.focus();
    }
  }, [selection]);
  return <div className="editor-host" ref={host} />;
}
