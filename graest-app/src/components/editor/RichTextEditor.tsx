"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  ImagePlus,
  Undo,
  Redo,
} from "lucide-react";
import { cn, aiTextToHtml, jsonContentToText } from "@/lib/utils";
import { AiBubbleMenu } from "./AiBubbleMenu";
import { AiIdlePrompt } from "./AiIdlePrompt";

interface RichTextEditorProps {
  content: JSONContent | null;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
  /** Section number for AI suggestions */
  section?: number;
  /** Field name for AI suggestions */
  fieldName?: string;
  /** Callback when editor instance is ready */
  onEditorReady?: (editor: import("@tiptap/react").Editor) => void;
}

// Upload image file to server, returns URL or null
async function uploadImage(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const { url } = await res.json();
    return url;
  } catch {
    return null;
  }
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function RichTextEditor({
  content,
  onChange,
  placeholder,
  section,
  fieldName,
  onEditorReady,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
    ],
    content: content ?? { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none text-justify",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.files;
        if (!items || items.length === 0) return false;
        const imageFile = Array.from(items).find(isImageFile);
        if (!imageFile) return false;
        event.preventDefault();
        uploadImage(imageFile).then((url) => {
          if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        });
        return true;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFile = Array.from(files).find(isImageFile);
        if (!imageFile) return false;
        event.preventDefault();
        uploadImage(imageFile).then((url) => {
          if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        });
        return true;
      },
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && content && !editor.isFocused) {
      const currentJSON = JSON.stringify(editor.getJSON());
      const newJSON = JSON.stringify(content);
      if (currentJSON !== newJSON) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isImageFile(file) || !editor) return;
    const url = await uploadImage(file);
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    e.target.value = "";
  }, [editor]);

  const handleAiInsert = useCallback((text: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(aiTextToHtml(text)).run();
  }, [editor]);

  const handleAiReplace = useCallback((text: string) => {
    if (!editor) return;
    editor.chain().focus().selectAll().deleteSelection().insertContent(aiTextToHtml(text)).run();
  }, [editor]);

  if (!editor) return null;

  const showAi = section != null && fieldName;

  return (
    <div className="rounded-lg border border-gray-300 bg-white shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Negrito"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Itálico"
        >
          <Italic size={16} />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-gray-200" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Subtítulo"
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Lista"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Lista numerada"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-gray-200" />
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Inserir imagem"
        >
          <ImagePlus size={16} />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-gray-200" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Desfazer"
        >
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refazer"
        >
          <Redo size={16} />
        </ToolbarButton>
      </div>

      <div className="relative">
        <EditorContent editor={editor} />

        {/* AI Idle Prompt — appears after 3s of inactivity */}
        {showAi && (
          <AiIdlePrompt editor={editor} section={section} fieldName={fieldName} />
        )}
      </div>

      {/* AI Context Menu — appears on right-click with text selected */}
      {showAi && (
        <AiBubbleMenu editor={editor} section={section} fieldName={fieldName} />
      )}

      {placeholder && !content && (
        <p className="px-4 pb-2 text-sm text-gray-400">{placeholder}</p>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30",
        active && "bg-primary-50 text-primary-600"
      )}
    >
      {children}
    </button>
  );
}
