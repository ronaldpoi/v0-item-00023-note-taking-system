"use client"

import { Badge } from "@/components/ui/badge"
import { Tag, Info } from "lucide-react"
import type { Note, Tag as TagType } from "@/lib/types"
import ReactMarkdown from "react-markdown"

interface NotePreviewProps {
  note: Note
  tags: TagType[]
}

export function NotePreview({ note, tags }: NotePreviewProps) {
  // Get tag names directly from props instead of localStorage
  const noteTags = tags.filter((tag) => Array.isArray(note.tags) && note.tags.includes(tag.id)).map((tag) => tag.name)

  // Calculate word and character counts
  const wordCount = note.content ? note.content.trim().split(/\s+/).length : 0
  const charCount = note.content ? note.content.trim().length : 0

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">{note.title}</h1>
        {noteTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {noteTags.map((tagName, index) => (
              <Badge key={index} variant="secondary">
                <Tag className="mr-1 size-3" />
                {tagName}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-2 text-xs text-muted-foreground">
          <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
          <span className="ml-4">Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{note.content || ""}</ReactMarkdown>
      </div>

      {/* Reorganized footer - only show on desktop */}
      <div className="hidden md:flex border-t p-2 px-4 bg-muted/30 items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Tag indicator */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Tag className="mr-1 size-3.5" />
            <span>{noteTags.length > 0 ? noteTags.join(", ") : "No tags"}</span>
          </div>

          {/* Word and character count */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Info className="mr-1 size-3.5" />
            <span>
              {wordCount} words, {charCount} characters
            </span>
          </div>
        </div>

        {/* Empty space to match editor layout */}
        <div className="w-24"></div>
      </div>

      {/* Mobile footer - simplified */}
      <div className="md:hidden border-t p-2 px-4 bg-muted/30 flex items-center justify-between">
        <div className="flex items-center text-xs text-muted-foreground">
          <Info className="mr-1 size-3.5" />
          <span>
            {wordCount} words, {charCount} characters
          </span>
        </div>
      </div>
    </div>
  )
}

