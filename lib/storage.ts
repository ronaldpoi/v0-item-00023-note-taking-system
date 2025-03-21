// Completely separate storage module to isolate localStorage operations

// Helper function to safely serialize objects
function safeSerialize(data: any): string {
  // Create a clean copy of the data with only primitive values
  // This avoids any circular references or window/DOM objects
  try {
    // For arrays, map each item and recursively clean it
    if (Array.isArray(data)) {
      return JSON.stringify(
        data.map((item) => {
          if (typeof item === "object" && item !== null) {
            // Recursively clean objects
            const cleanObj: Record<string, any> = {}
            for (const key in item) {
              if (Object.prototype.hasOwnProperty.call(item, key)) {
                // Skip functions and DOM nodes
                if (typeof item[key] === "function") continue
                if (typeof item[key] === "object" && item[key] !== null) {
                  if (item[key].nodeType) continue // Skip DOM nodes
                  if (item[key] === window) continue // Skip window references
                  if (Array.isArray(item[key])) {
                    cleanObj[key] = [...item[key]] // Create a new array
                  } else {
                    // Recursively clean nested objects
                    const nestedClean: Record<string, any> = {}
                    for (const nestedKey in item[key]) {
                      if (Object.prototype.hasOwnProperty.call(item[key], nestedKey)) {
                        if (typeof item[key][nestedKey] !== "function" && item[key][nestedKey] !== window) {
                          nestedClean[nestedKey] = item[key][nestedKey]
                        }
                      }
                    }
                    cleanObj[key] = nestedClean
                  }
                } else {
                  cleanObj[key] = item[key] // Primitive values are safe
                }
              }
            }
            return cleanObj
          }
          return item // Primitive values are safe
        }),
      )
    }

    // For objects, create a clean copy
    if (typeof data === "object" && data !== null) {
      const cleanObj: Record<string, any> = {}
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Skip functions and DOM nodes
          if (typeof data[key] === "function") continue
          if (typeof data[key] === "object" && data[key] !== null) {
            if (data[key].nodeType) continue // Skip DOM nodes
            if (data[key] === window) continue // Skip window references
            cleanObj[key] = data[key] // Include other objects
          } else {
            cleanObj[key] = data[key] // Primitive values are safe
          }
        }
      }
      return JSON.stringify(cleanObj)
    }

    // For primitive values
    return JSON.stringify(data)
  } catch (error) {
    console.error("Error serializing data:", error)
    return JSON.stringify(null)
  }
}

// Load all data from localStorage
export function loadData() {
  if (typeof window === "undefined") {
    return { notes: [], folders: [{ id: "root", name: "Root", parentId: null }], tags: [] }
  }

  try {
    const notes = localStorage.getItem("notes")
    const folders = localStorage.getItem("folders")
    const tags = localStorage.getItem("tags")

    return {
      notes: notes ? JSON.parse(notes) : [],
      folders: folders ? JSON.parse(folders) : [{ id: "root", name: "Root", parentId: null }],
      tags: tags ? JSON.parse(tags) : [],
    }
  } catch (error) {
    console.error("Error loading data from localStorage:", error)
    return { notes: [], folders: [{ id: "root", name: "Root", parentId: null }], tags: [] }
  }
}

// Save data to localStorage
export function saveData(key: string, data: any) {
  if (typeof window === "undefined") return

  try {
    // Use our safe serialization function
    const serialized = safeSerialize(data)
    localStorage.setItem(key, serialized)
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

