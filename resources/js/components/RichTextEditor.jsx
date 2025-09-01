"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from "lucide-react"
import React from "react"

const RichTextEditor = React.forwardRef(
  (
    {
      name,
      value,
      onChange,
      isInvalid,
      disabled,
      placeholder = "Start typing...",
      className,
      minHeight = "150px",
    },
    ref,
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          bulletList: false,
          orderedList: false,
          listItem: false,
        }),
        BulletList.configure({
          HTMLAttributes: { class: "my-bullet-list" },
        }),
        OrderedList.configure({
          HTMLAttributes: { class: "my-ordered-list" },
        }),
        ListItem.configure({
          HTMLAttributes: { class: "my-list-item" },
        }),
        Underline,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
      ],
      content: value || "",
      editable: !disabled,
      onUpdate: ({ editor }) => {
        let html = editor.getHTML()
        html = html
          .replace(/<p><\/p>/g, "")
          .replace(/<p>\s*<\/p>/g, "")
          .replace(/<p>&nbsp;<\/p>/g, "")
        onChange?.(html)
      },
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm mx-auto focus:outline-none text-sm",
            "min-h-[150px] p-3",
            "[&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4",
            "[&_li_p]:inline [&_li_p]:m-0"
          ),
        },
      },
      parseOptions: {
        preserveWhitespace: "full",
      },
    })

    React.useEffect(() => {
      if (editor && value !== editor.getHTML()) {
        editor.commands.setContent(value || "")
      }
    }, [value, editor])

    if (!editor) return null

    const ToolbarButton = ({ onClick, isActive, children, title }) => (
      <Button
        type="button"
        variant={isActive ? "default" : "ghost"}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="h-8 w-8 p-0 mr-1"
      >
        {children}
      </Button>
    )

    return (
      <div className={cn("w-full", className)} ref={ref}>
        <input type="hidden" name={name} value={value || ""} />

        <div
          className={cn(
            "border rounded-md",
            isInvalid ? "border-red-500" : "border-input",
            disabled ? "opacity-50" : "",
          )}
        >
          {/* Toolbar */}
          <div className="border-b p-2 flex flex-wrap gap-0">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Bold">
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italic">
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Underline">
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-8" />

            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="Align Center">
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="Align Right">
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-8" />

            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Bullet List">
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Numbered List">
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Quote">
              <Quote className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-8" />

            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Editor Content */}
          <div className="relative" style={{ minHeight }}>
            <div className="rounded-b-md overflow-hidden bg-white">
              <EditorContent editor={editor} className="w-full p-3 min-h-[150px]" />
            </div>
            {editor.getText().trim() === "" && !value && (
              <div className="absolute top-6 left-6 text-muted-foreground pointer-events-none text-sm">
                {placeholder}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  },
)

RichTextEditor.displayName = "RichTextEditor"

export default RichTextEditor
