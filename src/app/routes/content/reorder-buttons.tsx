import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n";

/**
 * Move up / move down / remove, for one entry in an ordered list — a menu
 * column, a link in it, a section of a page. The list's order IS the order on
 * the site, so these are the only way to rearrange it.
 *
 * `name` goes into each button's accessible name ("Move up: Coaching"), so a
 * screen reader walking a list of rows hears which row each button acts on.
 */
export function ReorderButtons({
  index,
  count,
  onMove,
  onRemove,
  disabled,
  name,
  removeLabel,
}: {
  index: number;
  count: number;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
  disabled: boolean;
  name?: string;
  /** Defaults to "Remove". */
  removeLabel?: string;
}) {
  const { t } = useTranslation();
  const named = (action: string) => (name ? `${action}: ${name}` : action);
  const remove = removeLabel ?? t("menus.remove");

  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={named(t("menus.moveUp"))}
        title={t("menus.moveUp")}
        disabled={disabled || index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={named(t("menus.moveDown"))}
        title={t("menus.moveDown")}
        disabled={disabled || index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={named(remove)}
        title={remove}
        disabled={disabled}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
