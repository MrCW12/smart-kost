import { Button } from "@/components/ui/button"
import { Spinner } from "./spinner"

function LoadingButton({ loading, children, ...props }) {
  return (
    <Button disabled={loading} {...props}>
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  )
}

export { LoadingButton }
