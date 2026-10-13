import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/i18n";

/**
 * The "⋯" menu at the end of a table row: Edit, then — set apart, in the
 * destructive colour — Delete. Edit is a link when the record has its own page
 * (`editTo`) and a button when it opens a dialog (`onEdit`). A role without
 * write access sees no menu at all rather than a menu of disabled items.
 */
export function RowActions({
  label,
  editTo,
  onEdit,
  onDelete,
  canWrite,
}: {
  /** Names the record, for the trigger's accessible name: "Actions for Apex". */
  label: string;
  editTo?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  canWrite: boolean;
}) {
  const { t } = useTranslation();
  if (!canWrite || (!editTo && !onEdit && !onDelete)) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("crud.actionsFor", { name: label })}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {editTo ? (
          <DropdownMenuItem asChild>
            <Link to={editTo}>
              <Pencil /> {t("crud.edit")}
            </Link>
          </DropdownMenuItem>
        ) : onEdit ? (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> {t("crud.edit")}
          </DropdownMenuItem>
        ) : null}
        {onDelete ? (
          <>
            {editTo || onEdit ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 /> {t("crud.delete")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
