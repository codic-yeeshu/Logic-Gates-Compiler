import { useEffect, useRef } from "react";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  lineNumbers,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import type { Span } from "./types";

// Error underlines: set from compiler diagnostics, cleared as soon as the text changes.
const setErrors = StateEffect.define<{ from: number; to: number }[]>();
const errorField = StateField.define({
  create: () => Decoration.none,
  update(marks, tr) {
    if (tr.docChanged) return Decoration.none;
    for (const effect of tr.effects)
      if (effect.is(setErrors))
        return Decoration.set(
          effect.value.map((r) =>
            Decoration.mark({ class: "cm-error-span" }).range(r.from, r.to),
          ),
          true,
        );
    return marks;
  },
  provide: (field) => EditorView.decorations.from(field),
});

export function Editor({
  value,
  onChange,
  onCompile,
  selection,
  errors,
}: {
  value: string;
  onChange: (value: string) => void;
  onCompile: () => void;
  selection: Span | null;
  errors: Span[];
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
          errorField,
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
            ".cm-error-span": {
              textDecoration: "underline wavy #c0392b",
              textUnderlineOffset: "3px",
              backgroundColor: "rgba(192,57,43,0.10)",
            },
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
    if (!editor) return;
    const text = editor.state.doc.toString();
    // Compiler offsets count code points; CodeMirror counts UTF-16 units.
    const units = (offset: number) =>
      Array.from(text).slice(0, offset).join("").length;
    const ranges = (errors ?? []).map((span) => {
      const from = units(span.start);
      let to = units(span.end);
      if (to <= from) to = Math.min(text.length, from + 1);
      return { from: Math.min(from, to), to };
    });
    // A zero-width span at the very end of the text cannot be marked; step back one character.
    editor.dispatch({
      effects: setErrors.of(
        ranges
          .map((r) =>
            r.to <= r.from ? { from: Math.max(0, r.from - 1), to: r.from } : r,
          )
          .filter((r) => r.to > r.from),
      ),
    });
  }, [errors]);
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
