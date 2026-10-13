import { useState } from "react";

import { ListEmpty } from "@/components/data-table";
import { FormError } from "@/components/form";
import {
  Button,
  Input,
  StatusBadge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  allowedEnrolmentTransitions,
  educationAdminService,
  type Enrolment,
  type EnrolmentStatus,
} from "@/features/education";
import { useAsyncAction } from "@/hooks";
import { useFormatters, useTranslation, type TranslationKey } from "@/i18n";

import { CustomerLink, RecordLink } from "../../components/record-parts";
import { recordPath } from "../../record-paths";

/**
 * Enrolments with their status moves inline — the enrolments queue and a
 * course's own page both use it, so a seat is confirmed or cancelled the same
 * way wherever staff meet it.
 *
 * Cancelling a place needs a reason (a refund may follow), so the cancel button
 * swaps the row's actions for a one-line reason box instead of firing.
 */
export function EnrolmentTable({
  rows,
  caption,
  showCourse,
  onChanged,
}: {
  rows: readonly Enrolment[];
  caption: string;
  showCourse: boolean;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const { text, date, money } = useFormatters();
  const canWrite = usePermission("education:write");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const change = useAsyncAction(
    (input: { id: string; status: EnrolmentStatus; note?: string }) =>
      educationAdminService.setEnrolmentStatus(input.id, input.status, input.note),
    {
      onSuccess: () => {
        setCancelling(null);
        setNote("");
        onChanged();
      },
    },
  );

  return (
    <>
      {change.error ? (
        <div className="px-4 pt-4 *:mb-0">
          <FormError error={change.error} labels={{ note: t("field.reason") }} />
        </div>
      ) : null}
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{t("field.reference")}</TableHead>
            {showCourse ? <TableHead>{t("field.course")}</TableHead> : null}
            <TableHead>{t("field.customer")}</TableHead>
            <TableHead>{t("field.cohort")}</TableHead>
            <TableHead>{t("field.status")}</TableHead>
            <TableHead className="text-end">{t("field.paid")}</TableHead>
            <TableHead>{t("field.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={showCourse ? 7 : 6} className="whitespace-normal">
                <ListEmpty />
              </TableCell>
            </TableRow>
          ) : null}
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.reference}</TableCell>
              {showCourse ? (
                <TableCell>
                  <RecordLink to={recordPath.course(row.courseId)}>{text(row.courseTitle)}</RecordLink>
                </TableCell>
              ) : null}
              <TableCell>
                <CustomerLink id={row.customerId} name={row.customerName} />
              </TableCell>
              <TableCell>{date(row.cohortStartsOn)}</TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
                {row.status === "active" && row.progressPercent > 0 ? (
                  <span className="ms-2 text-xs text-muted-foreground">{`${row.progressPercent}%`}</span>
                ) : null}
              </TableCell>
              <TableCell data-figure className="text-end">
                {money(row.amountPaid)}
              </TableCell>
              <TableCell>
                {cancelling === row.id ? (
                  <form
                    className="flex flex-wrap items-center gap-1"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void change.run({ id: row.id, status: "cancelled", note });
                    }}
                  >
                    <Input
                      aria-label={t("field.reason")}
                      placeholder={t("field.reason")}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      aria-invalid={change.fieldErrors?.note ? true : undefined}
                      className="h-7 w-44"
                    />
                    <Button type="submit" size="sm" variant="destructive" disabled={change.isPending}>
                      {t("action.confirm")}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setCancelling(null)}>
                      {t("action.cancel")}
                    </Button>
                  </form>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {allowedEnrolmentTransitions(row.status).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === "cancelled" ? "destructive" : "outline"}
                        disabled={!canWrite || change.isPending}
                        onClick={() =>
                          status === "cancelled"
                            ? setCancelling(row.id)
                            : void change.run({ id: row.id, status })
                        }
                      >
                        {/* The state the place moves to, named as its badge names it. */}
                        {t(`statusLabel.${status}` as TranslationKey)}
                      </Button>
                    ))}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
