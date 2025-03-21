"use client"

import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

interface EmptyStateProps {
  createNote: (folderId?: string) => void
}

export function EmptyState({ createNote }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileText className="size-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold">No Note Selected</h2>
      <p className="mt-2 text-center text-muted-foreground">
        Select a note from the sidebar or create a new one to get started.
      </p>
      <Button className="mt-6" onClick={() => createNote()}>
        <Plus className="mr-2 size-4" />
        Create New Note
      </Button>
    </div>
  )
}

