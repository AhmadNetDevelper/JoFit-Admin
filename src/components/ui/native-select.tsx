import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

/*
 * shadcn/ui's Native Select: the browser's own <select> (so it keeps the
 * platform picker on phones and works with every form helper as-is), styled
 * to match Input. The wrapper is full width here rather than `w-fit`, because
 * every select in this admin sits in a form column; logical `ps`/`pe`/`end`
 * keep the chevron on the reading-end side in Arabic.
 */
function NativeSelect({
  className,
  wrapperClassName,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
  /** Width of the whole control — e.g. `w-44` for a filter in a toolbar. */
  wrapperClassName?: string
}) {
  return (
    <div
      className={cn("group/native-select relative w-full has-[select:disabled]:opacity-50", wrapperClassName)}
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          "h-8 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-input bg-transparent py-1 ps-2.5 pe-8 text-base transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=sm]:h-7 data-[size=sm]:rounded-md data-[size=sm]:py-0.5 md:text-sm dark:bg-input/30 dark:hover:bg-input/50 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&>option]:bg-popover [&>option]:text-popover-foreground",
          className
        )}
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({ ...props }: React.ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<"optgroup">) {
  return <optgroup data-slot="native-select-optgroup" className={cn(className)} {...props} />
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
