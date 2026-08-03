import { Button } from "@/components/ui/button"

export function PaginationNav({ page, lastPage, onPageChange }) {
  if (!lastPage || lastPage <= 1) return null
  return (
    <div className="flex justify-center gap-2 mt-3">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Prev</Button>
      <span className="flex items-center px-3 text-sm">Page {page} of {lastPage}</span>
      <Button variant="outline" size="sm" disabled={page === lastPage} onClick={() => onPageChange(page + 1)}>Next</Button>
    </div>
  )
}
