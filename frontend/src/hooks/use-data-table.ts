import * as React from "react"

interface UseDataTableProps<T> {
  data: T[]
  initialPageSize?: number
  searchKey?: keyof T
}

export function useDataTable<T>({
  data,
  initialPageSize = 10,
  searchKey,
}: UseDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("All")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(initialPageSize)
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof T | ""
    direction: "asc" | "desc" | null
  }>({ key: "", direction: null })

  const handleSort = (key: keyof T) => {
    let direction: "asc" | "desc" | null = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null
    }
    setSortConfig({ key, direction })
  }

  const filteredData = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    let result = data

    if (filterStatus !== "All") {
      // Assuming T has a 'finalStatus' property for this specific use case, 
      // but making it more generic would require a callback.
      // For now, let's assume it has finalStatus or similar.
      result = result.filter((item: any) => item.finalStatus === filterStatus)
    }

    if (!query) {
      return result
    }

    return result.filter((item) =>
      Object.values(item as any)
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [data, filterStatus, searchQuery])

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = String(a[sortConfig.key as keyof T])
      const bValue = String(b[sortConfig.key as keyof T])

      // Basic date detection
      if (aValue.includes("-") && !Number.isNaN(Date.parse(aValue))) {
        const aDate = Date.parse(aValue)
        const bDate = Date.parse(bValue)
        if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
          return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate
        }
      }

      const comparison = aValue.localeCompare(bValue, undefined, {
        numeric: true,
        sensitivity: "base",
      })

      if (comparison !== 0) {
        return sortConfig.direction === "asc" ? comparison : -comparison
      }
      return 0
    })
  }, [filteredData, sortConfig])

  const total = sortedData.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize)

  return {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    page: currentPage,
    setPage,
    pageSize,
    setPageSize,
    sortConfig,
    handleSort,
    paginatedData,
    total,
    totalPages,
    startIndex,
  }
}
