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
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: JSONContent | null;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
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

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
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
          "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none",
      },
      // Handle paste with images
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.files;
        if (!items || items.length === 0) return false;

        const imageFile = Array.from(items).find(isImageFile);
        if (!imageFile) return false;

        // Prevent default paste and handle async upload
        event.preventDefault();
        uploadImage(imageFile).then((url) => {
          if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        });
        return true;
      },
      // Handle drop with images
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

  // Sync external content changes
  useEffect(() => {
    if (editor && content && !editor.isFocused) {
      const currentJSON = JSON.stringify(editor.getJSON());
      const newJSON = JSON.stringify(content);
      if (currentJSON !== newJSON) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  // Handle file input selection (toolbar button)
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isImageFile(file) || !editor) return;

    const url = await uploadImage(file);
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-gray-300 bg-white shadow-sm">
      {/* Hidden file input for toolbar image button */}
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

      {/* Editor content */}
      <EditorContent editor={editor} />

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
        active && "bg-blue-50 text-blue-600"
      )}
    >
      {children}
    </button>
  );
}
