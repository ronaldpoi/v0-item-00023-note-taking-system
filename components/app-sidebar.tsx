"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { FileText, FolderPlus, Search, Plus, Tag, ChevronDown, Clock, Calendar, Folder, FilterX } from "lucide-react"
import type { Note, Folder as FolderType, Tag as TagType } from "@/lib/types"

interface AppSidebarProps {
  notes: Note[]
  folders: FolderType[]
  tags: TagType[]
  activeNote: Note | null
  setActiveNote: (note: Note | null) => void
  createNote: (folderId?: string) => void
  createFolder: (name: string, parentId?: string) => void
  createTag: (name: string) => TagType
  activeFolder: string
  setActiveFolder: (folderId: string) => void
  activeTags: string[]
  setActiveTags: (tagIds: string[]) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: "created" | "updated"
  setSortBy: (sortBy: "created" | "updated") => void
}

export function AppSidebar({
  notes,
  folders,
  tags,
  activeNote,
  setActiveNote,
  createNote,
  createFolder,
  createTag,
  activeFolder,
  setActiveFolder,
  activeTags,
  setActiveTags,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
}: AppSidebarProps) {
  const [newFolderName, setNewFolderName] = useState("")
  const [newTagName, setNewTagName] = useState("")
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [isNewTagDialogOpen, setIsNewTagDialogOpen] = useState(false)

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName)
      setNewFolderName("")
      setIsNewFolderDialogOpen(false)
    }
  }

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTag(newTagName)
      setNewTagName("")
      setIsNewTagDialogOpen(false)
    }
  }

  const toggleTag = (tagId: string) => {
    if (activeTags.includes(tagId)) {
      setActiveTags(activeTags.filter((id) => id !== tagId))
    } else {
      setActiveTags([...activeTags, tagId])
    }
  }

  // Check if any filters are active
  const hasActiveFilters = activeFolder !== "root" || activeTags.length > 0 || searchQuery !== ""

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFolder("root")
    setActiveTags([])
    setSearchQuery("")
  }

  // Filter notes based on active folder, tags, and search query
  const filteredNotes = notes
    .filter((note) => {
      // Filter by folder
      if (activeFolder !== "root" && note.folderId !== activeFolder) {
        return false
      }

      // Filter by tags
      if (activeTags.length > 0 && Array.isArray(note.tags)) {
        const hasAllTags = activeTags.every((tagId) => note.tags.includes(tagId))
        if (!hasAllTags) return false
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)
      }

      return true
    })
    .sort((a, b) => {
      if (sortBy === "created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  const getChildFolders = (parentId: string) => {
    return folders.filter((folder) => folder.parentId === parentId)
  }

  const renderFolderTree = (parentId: string) => {
    const childFolders = getChildFolders(parentId)

    if (childFolders.length === 0) return null

    return (
      <SidebarMenuSub>
        {childFolders.map((folder) => (
          <SidebarMenuSubItem key={folder.id}>
            <SidebarMenuSubButton isActive={activeFolder === folder.id} onClick={() => setActiveFolder(folder.id)}>
              <Folder className="size-4" />
              <span>{folder.name}</span>
            </SidebarMenuSubButton>
            {renderFolderTree(folder.id)}
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    )
  }

  // Get the name of the active folder
  const activeFolderName = folders.find((folder) => folder.id === activeFolder)?.name || "All Notes"

  // Get the names of active tags
  const activeTagNames = tags.filter((tag) => activeTags.includes(tag.id)).map((tag) => tag.name)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with app title */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Markdown Notes</h1>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Active filters:</div>
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-xs">
              <FilterX className="mr-1 size-3" />
              Clear all
            </Button>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {activeFolder !== "root" && (
              <Badge variant="secondary" className="text-xs">
                <Folder className="mr-1 size-3" />
                {activeFolderName}
              </Badge>
            )}
            {activeTagNames.map((name) => (
              <Badge key={name} variant="secondary" className="text-xs">
                <Tag className="mr-1 size-3" />
                {name}
              </Badge>
            ))}
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                <Search className="mr-1 size-3" />"{searchQuery}"
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Sidebar content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Notes section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Notes</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => createNote()}>
              <Plus className="size-4" />
              <span className="sr-only">Create Note</span>
            </Button>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1">
                  {sortBy === "updated" ? <Clock className="size-3" /> : <Calendar className="size-3" />}
                  <span className="text-xs">{sortBy === "updated" ? "Updated" : "Created"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("updated")}>
                  <Clock className="mr-2 size-4" />
                  <span>Last Updated</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("created")}>
                  <Calendar className="mr-2 size-4" />
                  <span>Creation Date</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
                  activeNote?.id === note.id ? "bg-accent text-accent-foreground" : ""
                }`}
                onClick={() => setActiveNote(note)}
              >
                <FileText className="size-4 flex-shrink-0" />
                <span className="truncate">{note.title}</span>
              </button>
            ))}
            {filteredNotes.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">No notes found</div>
            )}
          </div>
        </div>

        {/* Folders section */}
        <div className="mb-6">
          <Collapsible defaultOpen className="group/collapsible">
            <div className="flex items-center justify-between mb-2">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-sm font-semibold">
                  <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  Folders
                </button>
              </CollapsibleTrigger>
              <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <FolderPlus className="size-4" />
                    <span className="sr-only">Create Folder</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>Enter a name for your new folder.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="folderName">Folder Name</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateFolder}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CollapsibleContent>
              <div className="space-y-1 ml-2">
                <button
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
                    activeFolder === "root" ? "bg-accent text-accent-foreground" : ""
                  }`}
                  onClick={() => setActiveFolder("root")}
                >
                  <Folder className="size-4 flex-shrink-0" />
                  <span className="truncate">All Notes</span>
                </button>
                {renderFolderTree("root")}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Tags section */}
        <div>
          <Collapsible defaultOpen className="group/collapsible">
            <div className="flex items-center justify-between mb-2">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-sm font-semibold">
                  <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  Tags
                </button>
              </CollapsibleTrigger>
              <Dialog open={isNewTagDialogOpen} onOpenChange={setIsNewTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="size-4" />
                    <span className="sr-only">Create Tag</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Tag</DialogTitle>
                    <DialogDescription>Enter a name for your new tag.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="tagName">Tag Name</Label>
                      <Input
                        id="tagName"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateTag}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CollapsibleContent>
              <div className="flex flex-wrap gap-2 ml-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={activeTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    <Tag className="mr-1 size-3" />
                    {tag.name}
                  </Badge>
                ))}
                {tags.length === 0 && <div className="text-sm text-muted-foreground">No tags created yet</div>}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}

// Custom component for sidebar menu sub items
function SidebarMenuSub({ children }: { children: React.ReactNode }) {
  return <ul className="ml-4 mt-1 border-l border-border pl-2">{children}</ul>
}

function SidebarMenuSubItem({ children }: { children: React.ReactNode }) {
  return <li className="py-1">{children}</li>
}

function SidebarMenuSubButton({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}) {
  return (
    <button
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground ${
        isActive ? "bg-accent text-accent-foreground" : ""
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

