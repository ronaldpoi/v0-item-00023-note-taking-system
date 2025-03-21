"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { NoteEditor } from "@/components/note-editor"
import { NotePreview } from "@/components/note-preview"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Menu, PanelLeft, PanelLeftClose, X } from "lucide-react"
import type { Note, Folder, Tag } from "@/lib/types"
import { generateId } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

// Import storage utilities
import { loadData, saveData } from "@/lib/storage"

export function NoteApp() {
  // Initialize state with empty values first
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([{ id: "root", name: "Root", parentId: null }])
  const [tags, setTags] = useState<Tag[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"created" | "updated">("updated")
  const [activeFolder, setActiveFolder] = useState<string>("root")
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Check if we're on mobile
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Load data from localStorage only once on mount
  useEffect(() => {
    if (isInitialized) return

    try {
      const data = loadData()

      if (data.notes) {
        setNotes(data.notes)
      }

      if (data.folders) {
        setFolders(data.folders)
      }

      if (data.tags) {
        setTags(data.tags)
      }

      // Load preview visibility preference - but only apply on desktop
      const previewVisibility = localStorage.getItem("previewVisible")
      const isMobileDevice = window.innerWidth < 768
      if (previewVisibility !== null && !isMobileDevice) {
        setIsPreviewVisible(previewVisibility === "true")
      } else if (isMobileDevice) {
        // Always start with preview closed on mobile
        setIsPreviewVisible(false)
      }

      // Load sidebar state preference
      const sidebarState = localStorage.getItem("sidebarOpen")
      if (sidebarState !== null) {
        setIsSidebarOpen(sidebarState === "true")
      }

      setIsInitialized(true)
    } catch (error) {
      console.error("Error loading data:", error)
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Update the useEffect for preview visibility to handle mobile differently
  // Save preview visibility preference
  useEffect(() => {
    if (!isInitialized) return

    try {
      // On mobile, we don't want to persist the preview being open
      // as it's an overlay that should be closed by default on page load
      if (!isMobile) {
        localStorage.setItem("previewVisible", isPreviewVisible.toString())
      }
    } catch (error) {
      console.error("Error saving preview visibility:", error)
    }
  }, [isPreviewVisible, isInitialized, isMobile])

  // Save sidebar state preference
  useEffect(() => {
    if (!isInitialized) return

    try {
      localStorage.setItem("sidebarOpen", isSidebarOpen.toString())
    } catch (error) {
      console.error("Error saving sidebar state:", error)
    }
  }, [isSidebarOpen, isInitialized])

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return

    try {
      // Create a clean copy with only the data we need
      const cleanNotes = notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        folderId: note.folderId,
        tags: Array.isArray(note.tags) ? [...note.tags] : [],
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }))

      saveData("notes", cleanNotes)
    } catch (error) {
      console.error("Error saving notes:", error)
    }
  }, [notes, isInitialized])

  // Save folders to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return

    try {
      const cleanFolders = folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
      }))

      saveData("folders", cleanFolders)
    } catch (error) {
      console.error("Error saving folders:", error)
    }
  }, [folders, isInitialized])

  // Save tags to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return

    try {
      const cleanTags = tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
      }))

      saveData("tags", cleanTags)
    } catch (error) {
      console.error("Error saving tags:", error)
    }
  }, [tags, isInitialized])

  // Find the active note based on activeNoteId
  const activeNote = activeNoteId ? notes.find((note) => note.id === activeNoteId) || null : null

  // Create a new note with a unique ID
  const createNote = (folderId: string = activeFolder) => {
    const newNoteId = generateId()

    const newNote: Note = {
      id: newNoteId,
      title: "Untitled Note",
      content: "",
      folderId, // This ensures the note is created in the currently active folder
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add the note to the notes array
    setNotes((prevNotes) => [...prevNotes, newNote])

    // Set the new note as active - this is important to do after setting notes
    setActiveNoteId(newNoteId)

    // Ensure the folder of the new note is set as active
    if (folderId !== activeFolder) {
      setActiveFolder(folderId)
    }

    // On mobile, close the sidebar after creating a note
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }

  // Update an existing note
  const updateNote = (updatedNote: Note) => {
    const sanitizedNote = {
      id: updatedNote.id,
      title: updatedNote.title || "Untitled Note", // Ensure title is never empty
      content: updatedNote.content || "",
      folderId: updatedNote.folderId,
      tags: Array.isArray(updatedNote.tags) ? [...updatedNote.tags] : [],
      createdAt: updatedNote.createdAt,
      updatedAt: new Date().toISOString(),
    }

    setNotes((prevNotes) => {
      // Check if the note already exists
      const noteExists = prevNotes.some((note) => note.id === sanitizedNote.id)

      if (noteExists) {
        // Update existing note
        return prevNotes.map((note) => (note.id === sanitizedNote.id ? sanitizedNote : note))
      } else {
        // This shouldn't normally happen, but just in case
        console.warn("Tried to update a note that doesn't exist:", sanitizedNote.id)
        return prevNotes
      }
    })
  }

  // Delete a note
  const deleteNote = (noteId: string) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId))

    if (activeNoteId === noteId) {
      setActiveNoteId(null)
    }
  }

  // Create a new folder
  const createFolder = (name: string, parentId = "root") => {
    const newFolder: Folder = {
      id: generateId(),
      name,
      parentId,
    }

    setFolders((prevFolders) => [...prevFolders, newFolder])
  }

  // Create a new tag
  const createTag = (name: string) => {
    const newTag: Tag = {
      id: generateId(),
      name,
    }

    setTags((prevTags) => [...prevTags, newTag])
    return newTag
  }

  // Move a note to a different folder
  const moveNoteToFolder = (noteId: string, targetFolderId: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === noteId ? { ...note, folderId: targetFolderId, updatedAt: new Date().toISOString() } : note,
      ),
    )
  }

  // Check if a note passes the current filters
  const notePassesFilters = (note: Note) => {
    // Filter by folder (unless it's the root folder which shows all)
    if (activeFolder !== "root" && note.folderId !== activeFolder) {
      return false
    }

    // Filter by tags
    if (activeTags.length > 0) {
      const hasAllTags = activeTags.every((tagId) => Array.isArray(note.tags) && note.tags.includes(tagId))
      if (!hasAllTags) return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)
    }

    return true
  }

  // Filter notes based on active folder, tags, and search query
  const filteredNotes = notes.filter(notePassesFilters).sort((a, b) => {
    if (sortBy === "created") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  // Set active note by reference
  const setActiveNote = (note: Note | null) => {
    setActiveNoteId(note ? note.id : null)

    // On mobile, close the sidebar after selecting a note
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }

  // Set active folder and check if current note should remain open
  const setActiveFolderAndCheckNote = (folderId: string) => {
    setActiveFolder(folderId)

    // If we have an active note, check if it should remain open with the new folder filter
    if (activeNote) {
      const shouldKeepNoteOpen = folderId === "root" || activeNote.folderId === folderId
      if (!shouldKeepNoteOpen) {
        setActiveNoteId(null)
      }
    }
  }

  // Set active tags and check if current note should remain open
  const setActiveTagsAndCheckNote = (tagIds: string[]) => {
    setActiveTags(tagIds)

    // If we have an active note and there are active tags, check if the note has all the tags
    if (activeNote && tagIds.length > 0) {
      const noteHasAllTags = tagIds.every((tagId) => Array.isArray(activeNote.tags) && activeNote.tags.includes(tagId))

      if (!noteHasAllTags) {
        setActiveNoteId(null)
      }
    }
  }

  // Set search query and check if current note should remain open
  const setSearchQueryAndCheckNote = (query: string) => {
    setSearchQuery(query)

    // If we have an active note and there's a search query, check if the note matches
    if (activeNote && query) {
      const queryLower = query.toLowerCase()
      const noteMatchesQuery =
        activeNote.title.toLowerCase().includes(queryLower) || activeNote.content.toLowerCase().includes(queryLower)

      if (!noteMatchesQuery) {
        setActiveNoteId(null)
      }
    }
  }

  // Toggle preview visibility
  const togglePreview = () => {
    setIsPreviewVisible((prev) => !prev)

    // On mobile, when opening preview, we want to ensure good UX
    if (isMobile && !isPreviewVisible) {
      // If we're opening the preview on mobile, make sure any open dialogs are closed
      // This is a good UX practice to avoid multiple overlays
      document.body.style.overflow = "hidden" // Prevent background scrolling
    } else if (isMobile && isPreviewVisible) {
      // Restore scrolling when closing preview
      document.body.style.overflow = ""
    }
  }

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen((prev) => !prev)
    } else {
      setIsSidebarOpen((prev) => !prev)
    }
  }

  // Add cleanup for the body overflow style in a useEffect
  // Clean up body overflow style when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  // Check if active note should remain open when filters change
  useEffect(() => {
    if (activeNote && !notePassesFilters(activeNote)) {
      setActiveNoteId(null)
    }
  }, [activeFolder, activeTags, searchQuery, activeNote])

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block h-full ${
          isSidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 ease-in-out overflow-hidden border-r`}
      >
        <AppSidebar
          notes={notes}
          folders={folders}
          tags={tags}
          activeNote={activeNote}
          setActiveNote={setActiveNote}
          createNote={createNote}
          createFolder={createFolder}
          createTag={createTag}
          activeFolder={activeFolder}
          setActiveFolder={setActiveFolderAndCheckNote}
          activeTags={activeTags}
          setActiveTags={setActiveTagsAndCheckNote}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQueryAndCheckNote}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </div>

      {/* Mobile Sidebar (Overlay) */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 h-full w-80 bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h1 className="text-xl font-bold">Markdown Notes</h1>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(false)}>
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="h-[calc(100%-4rem)] overflow-auto">
              <AppSidebar
                notes={notes}
                folders={folders}
                tags={tags}
                activeNote={activeNote}
                setActiveNote={setActiveNote}
                createNote={createNote}
                createFolder={createFolder}
                createTag={createTag}
                activeFolder={activeFolder}
                setActiveFolder={setActiveFolderAndCheckNote}
                activeTags={activeTags}
                setActiveTags={setActiveTagsAndCheckNote}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQueryAndCheckNote}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeNote ? (
          <div className="flex h-full flex-col">
            {/* Header with toggle buttons */}
            <div className="flex items-center justify-between border-b p-2 bg-muted/20">
              {/* Sidebar toggle button */}
              <Button variant="ghost" size="sm" onClick={toggleSidebar} className="gap-1">
                {isMobile ? (
                  <Menu className="size-4" />
                ) : isSidebarOpen ? (
                  <PanelLeftClose className="size-4" />
                ) : (
                  <PanelLeft className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {isMobile ? "Menu" : isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                </span>
              </Button>

              {/* Preview toggle button */}
              <Button
                variant={isPreviewVisible ? "ghost" : "outline"}
                size="sm"
                onClick={togglePreview}
                className="gap-1"
              >
                {isPreviewVisible ? (
                  <>
                    <EyeOff className="size-4" />
                    <span className="hidden sm:inline">Hide Preview</span>
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    <span className="hidden sm:inline">Show Preview</span>
                  </>
                )}
              </Button>
            </div>

            {/* Main content area with conditional preview */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
              {/* Editor always takes full width/height on mobile */}
              <div
                className={`w-full h-full md:h-full ${isPreviewVisible ? "md:w-1/2" : "md:w-full"} transition-all duration-300`}
              >
                <NoteEditor
                  key={activeNote.id}
                  note={activeNote}
                  updateNote={updateNote}
                  deleteNote={deleteNote}
                  tags={tags}
                  createTag={createTag}
                  folders={folders}
                  moveNoteToFolder={moveNoteToFolder}
                />
              </div>

              {/* Preview as overlay on mobile, side-by-side on desktop */}
              {isPreviewVisible && (
                <>
                  {/* Mobile preview (overlay) */}
                  <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={() => setIsPreviewVisible(false)}
                  >
                    <div
                      className="fixed inset-x-0 bottom-0 z-50 h-[80%] bg-background border-t rounded-t-xl shadow-lg overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                        <h3 className="font-medium">Preview</h3>
                        <Button variant="ghost" size="sm" onClick={() => setIsPreviewVisible(false)}>
                          <X className="size-4" />
                          <span className="sr-only">Close Preview</span>
                        </Button>
                      </div>
                      <div className="h-[calc(100%-3rem)] overflow-auto">
                        <NotePreview key={activeNote.id} note={activeNote} tags={tags} />
                      </div>
                    </div>
                  </div>

                  {/* Desktop preview (side-by-side) */}
                  <div className="hidden md:block h-full w-1/2 transition-all duration-300">
                    <NotePreview key={activeNote.id} note={activeNote} tags={tags} />
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {/* Header with toggle button for empty state */}
            <div className="flex items-center justify-between border-b p-2 bg-muted/20">
              <Button variant="ghost" size="sm" onClick={toggleSidebar} className="gap-1">
                {isMobile ? (
                  <Menu className="size-4" />
                ) : isSidebarOpen ? (
                  <PanelLeftClose className="size-4" />
                ) : (
                  <PanelLeft className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {isMobile ? "Menu" : isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                </span>
              </Button>
            </div>

            {/* Empty state */}
            <div className="flex-1">
              <EmptyState createNote={createNote} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

