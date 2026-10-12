"use client";

import React, { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Link2,
  RemoveFormatting,
  Undo2,
  Redo2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write description here...",
  minHeight = "min-h-[140px]",
  maxHeight = "max-h-[220px]",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external value changes into the editor without disrupting active caret
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false, arg);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-slate-100/90 border-b border-slate-200 select-none">
        <button
          type="button"
          onClick={() => executeCommand("bold")}
          title="Bold (Ctrl+B)"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("italic")}
          title="Italic (Ctrl+I)"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("underline")}
          title="Underline (Ctrl+U)"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("strikeThrough")}
          title="Strikethrough"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "<h1>")}
          title="Heading 1"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "<h2>")}
          title="Heading 2"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "<h3>")}
          title="Heading 3"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("insertUnorderedList")}
          title="Bullet List"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("insertOrderedList")}
          title="Numbered List"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("justifyLeft")}
          title="Align Left"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("justifyCenter")}
          title="Align Center"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("justifyRight")}
          title="Align Right"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("justifyFull")}
          title="Justify"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "<blockquote>")}
          title="Blockquote"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = prompt("Enter link URL (e.g. https://...):");
            if (url) executeCommand("createLink", url);
          }}
          title="Insert Link"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("removeFormat")}
          title="Clear Formatting"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("undo")}
          title="Undo (Ctrl+Z)"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("redo")}
          title="Redo (Ctrl+Y)"
          className="p-1.5 hover:bg-slate-200/80 active:bg-slate-300 rounded text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* ContentEditable Div */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleEditorInput}
        className={`${minHeight} ${maxHeight} overflow-y-auto p-3.5 bg-white text-sm text-slate-900 focus:outline-none prose prose-sm max-w-none`}
        data-placeholder={placeholder}
      />
    </div>
  );
}
