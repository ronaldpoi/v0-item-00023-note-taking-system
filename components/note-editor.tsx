"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash, TagIcon, MoreVertical, CheckCircle2, Info, BookMarkedIcon as Markdown, FolderIcon } from "lucide-react"
import type { Note, Tag, Folder } from "@/lib/types"

interface NoteEditorProps {
  note: Note
  updateNote: (note: Note) => void
  deleteNote: (noteId: string) => void
  tags: Tag[]
  createTag: (name: string) => Tag
  folders: Folder[]
  moveNoteToFolder: (noteId: string, folderId: string) => void
}

// Debounce function to limit how often a function is called
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): (...args: Parameters<T>) => void {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return debouncedFunction
}

export function NoteEditor({
  note,
  updateNote,
  deleteNote,
  tags,
  createTag,
  folders,
  moveNoteToFolder,
}: NoteEditorProps) {
  // Use a ref to track the current note ID to prevent state conflicts
  const currentNoteIdRef = useRef<string>(note.id)

  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>(note.tags)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  // Reset state when note changes
  useEffect(() => {
    // Update the ref to track the current note ID
    currentNoteIdRef.current = note.id

    setTitle(note.title)
    setContent(note.content)
    setSelectedTags(Array.isArray(note.tags) ? note.tags : [])
    setSaveStatus("idle")
    updateCounts(note.content)

    // Cancel any pending saves for the previous note
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [note.id]) // Only reset when the note ID changes

  // Update content and other fields when note content changes
  useEffect(() => {
    // Only update if the content has changed and we're still on the same note
    if (note.id === currentNoteIdRef.current && (content !== note.content || title !== note.title)) {
      setTitle(note.title)
      setContent(note.content)
      updateCounts(note.content)
    }
  }, [note.content, note.title, note.id])

  // Function to update word and character counts
  const updateCounts = (text: string) => {
    const trimmedText = text.trim()
    setCharCount(trimmedText.length)
    setWordCount(trimmedText ? trimmedText.split(/\s+/).length : 0)
  }

  // Timer ref for the save status reset
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Function to save the note
  const saveNote = useCallback(() => {
    // Only save if this is still the active note
    if (currentNoteIdRef.current !== note.id) {
      return
    }

    // Update the note
    updateNote({
      ...note,
      title,
      content,
      tags: selectedTags,
    })

    // Update save status and timestamp
    setSaveStatus("saved")
    setLastSaved(new Date())

    // Reset to idle after 2 seconds
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      // Only update if this is still the active note
      if (currentNoteIdRef.current === note.id) {
        setSaveStatus("idle")
      }
    }, 2000)
  }, [note, title, content, selectedTags, updateNote])

  // Create a debounced version of saveNote
  const debouncedSave = useDebounce(saveNote, 1000)

  // Auto-save when title or content changes
  useEffect(() => {
    // Only trigger save if we have actual changes and not on initial render
    // and if this is still the active note
    if (currentNoteIdRef.current === note.id && (title !== note.title || content !== note.content)) {
      // Set status to saving without triggering a re-render loop
      if (saveStatus !== "saving") {
        setSaveStatus("saving")
      }
      debouncedSave()

      // Update counts when content changes
      if (content !== note.content) {
        updateCounts(content)
      }
    }
  }, [title, content, note.title, note.content, debouncedSave, saveStatus, note.id])

  // Auto-save when selected tags change
  useEffect(() => {
    // Only proceed if this is still the active note
    if (currentNoteIdRef.current !== note.id) {
      return
    }

    const currentTags = JSON.stringify(selectedTags)
    const noteTags = JSON.stringify(note.tags)

    if (currentTags !== noteTags) {
      // Only set status if it's not already saving
      if (saveStatus !== "saving") {
        setSaveStatus("saving")
      }
      debouncedSave()
    }
  }, [selectedTags, note.tags, debouncedSave, saveStatus, note.id])

  const handleDelete = () => {
    deleteNote(note.id)
    setIsDeleteDialogOpen(false)
  }

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const tag = createTag(newTagName)
      setSelectedTags([...selectedTags, tag.id])
      setNewTagName("")
    }
  }

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  // Handle moving note to a different folder
  const handleMoveToFolder = (folderId: string) => {
    moveNoteToFolder(note.id, folderId)
  }

  // Get current folder name
  const currentFolder = folders.find((folder) => folder.id === note.folderId)?.name || "Unknown"

  // Get tag names for display in the footer
  const tagNames = tags
    .filter((tag) => selectedTags.includes(tag.id))
    .map((tag) => tag.name)
    .slice(0, 3) // Show only first 3 tags

  const hasMoreTags = selectedTags.length > 3

  // Helper function to render folder tree for dropdown
  const renderFolderOptions = (parentId = "root", depth = 0): React.ReactNode[] => {
    const childFolders = folders.filter((folder) => folder.parentId === parentId)

    return childFolders.flatMap((folder) => {
      // Skip the current folder to prevent moving to itself
      if (folder.id === note.folderId) {
        return []
      }

      const indent = "  ".repeat(depth)
      const children = renderFolderOptions(folder.id, depth + 1)

      return [
        <DropdownMenuItem key={folder.id} onSelect={() => handleMoveToFolder(folder.id)}>
          {indent}
          <FolderIcon className="mr-2 size-4" />
          {folder.name}
        </DropdownMenuItem>,
        ...children,
      ]
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Simplified header with just title and menu */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex-1 flex items-center">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Note Title"
          />
          <div className="flex items-center ml-2" title="Markdown supported">
            <Badge variant="outline" className="text-xs gap-1 h-6">
              <Markdown className="size-3.5" />
              <span className="hidden sm:inline">Markdown</span>
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="size-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderIcon className="mr-2 size-4" />
                <span>Move to Folder</span>
                <span className="ml-auto text-xs text-muted-foreground">({currentFolder})</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => handleMoveToFolder("root")}>
                    <FolderIcon className="mr-2 size-4" />
                    Root
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {renderFolderOptions()}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash className="mr-2 size-4" />
              Delete Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto p-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[calc(100%-2rem)] w-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Write your note here using Markdown...
# Heading 1
## Heading 2
**Bold text** or *italic text*
- Bullet points
- Lists
[Links](https://example.com)
"
        />
      </div>

      {/* Reorganized footer area */}
      <div className="border-t p-2 px-4 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-4">
          {/* Tags button and tag list */}
          <Button variant="outline" size="sm" onClick={() => setIsTagDialogOpen(true)}>
            <TagIcon className="mr-1 size-4" />
            Tags
          </Button>

          {/* Word and character count moved next to tags */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Info className="mr-1 size-3.5" />
            <span>
              {wordCount} words, {charCount} characters
            </span>
          </div>

          {/* Tag names display */}
          {selectedTags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {tagNames.join(", ")}
                {hasMoreTags && ` +${selectedTags.length - 3} more`}
              </span>
            </div>
          )}
        </div>

        {/* Save status in a fixed-width container to prevent layout shifts */}
        <div className="w-24 text-right">
          <div className="flex items-center justify-end text-xs text-muted-foreground">
            {saveStatus === "saving" ? (
              <span className="flex items-center">
                <span className="mr-1 size-2 rounded-full bg-yellow-500 animate-pulse"></span>
                Saving...
              </span>
            ) : saveStatus === "saved" ? (
              <span className="flex items-center text-green-600">
                <CheckCircle2 className="mr-1 size-3.5" />
                Saved
              </span>
            ) : lastSaved ? (
              <span>Last saved: {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <p>Are you sure you want to delete &quot;{note.title}&quot;? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Management Dialog */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>Create new tags or select existing ones for your note.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newTag">Create New Tag</Label>
              <div className="flex gap-2">
                <Input
                  id="newTag"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name"
                />
                <Button onClick={handleAddTag}>Add</Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Available Tags</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-20">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    <TagIcon className="mr-1 size-3" />
                    {tag.name}
                  </Badge>
                ))}
                {tags.length === 0 && <div className="text-sm text-muted-foreground">No tags created yet</div>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsTagDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

