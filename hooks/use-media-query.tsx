"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  // Default to false during SSR
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Return early if window is not available (SSR)
    if (typeof window === "undefined") return

    // Create a local variable to avoid closure issues
    let mounted = true

    try {
      // Create the media query list
      const mediaQueryList = window.matchMedia(query)

      // Initial check
      if (mounted) {
        setMatches(mediaQueryList.matches)
      }

      // Function to update matches state
      const onChange = () => {
        if (!mounted) return
        setMatches(mediaQueryList.matches)
      }

      // Add the listener using the appropriate method
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener("change", onChange)
      } else {
        // Fallback for older browsers
        mediaQueryList.addListener(onChange)
      }

      // Cleanup function
      return () => {
        mounted = false
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener("change", onChange)
        } else {
          mediaQueryList.removeListener(onChange)
        }
      }
    } catch (error) {
      console.error("Error in useMediaQuery:", error)
      return () => {
        mounted = false
      }
    }
  }, [query])

  return matches
}

