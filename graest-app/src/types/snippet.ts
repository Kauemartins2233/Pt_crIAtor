import type { JSONContent } from "@tiptap/react";

export interface Snippet {
  id: string;
  name: string;
  targetSection: number;
  content: JSONContent;
  images: string[] | null;
  createdAt: string;
  updatedAt: string;
}
