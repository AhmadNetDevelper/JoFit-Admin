import { Loader2, Pencil } from "lucide-react";
import { useState } from "react";

import { useNotice } from "@/components/feedback";
import { Field, FormError } from "@/components/form";
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldContent,
  FieldLabel,
  Input,
  NativeSelect,
  NativeSelectOption,
  Switch,
  Field as UiField,
} from "@/components/ui";
import { customersService, type Customer, type CustomerDraft } from "@/features/customers";
import { useAsyncAction } from "@/hooks";
import { LOCALES, LOCALE_LABELS, useTranslation } from "@/i18n";

function EditForm({ customer, onDone }: { customer: Customer; onDone: (saved: boolean) => void }) {
  const { t } = useTranslation();
  const notice = useNotice();
  const [draft, setDraft] = useState<CustomerDraft>({
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    locale: customer.preferences.locale,
    marketingOptIn: customer.preferences.marketingOptIn,
  });
  const save = useAsyncAction((next: CustomerDraft) => customersService.updateCustomer(customer.id, next), {
    onSuccess: () => {
      notice.success(t("crud.updated"));
      onDone(true);
    },
  });

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        void save.run(draft);
      }}
    >
      <DialogBody>
        {/* Each field shows its own message; this lists only the ones with no field here. */}
        <FormError
          error={save.error}
          labels={{ name: t("field.name"), email: t("field.email"), phone: t("field.phone"), locale: t("customers.preferredLanguage") }}
          summary={false}
        />
        <Field name="name" label={t("field.name")} required error={save.fieldErrors?.name}>
          {(props) => (
            <Input
              {...props}
              dir="auto"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          )}
        </Field>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field name="email" label={t("field.email")} required error={save.fieldErrors?.email}>
            {(props) => (
              <Input
                {...props}
                type="email"
                dir="ltr"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              />
            )}
          </Field>
          <Field name="phone" label={t("field.phone")} error={save.fieldErrors?.phone}>
            {(props) => (
              <Input
                {...props}
                type="tel"
                dir="ltr"
                value={draft.phone ?? ""}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              />
            )}
          </Field>
        </div>
        <Field name="locale" label={t("customers.preferredLanguage")} error={save.fieldErrors?.locale}>
          {(props) => (
            <NativeSelect
              {...props}
              value={draft.locale}
              onChange={(event) => setDraft({ ...draft, locale: event.target.value as CustomerDraft["locale"] })}
            >
              {/* Each language named in itself, as the storefront's switcher names it. */}
              {LOCALES.map((locale) => (
                <NativeSelectOption key={locale} value={locale}>
                  {LOCALE_LABELS[locale]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </Field>
        <UiField orientation="horizontal" className="rounded-lg border p-3">
          <FieldContent>
            <FieldLabel htmlFor="field-marketingOptIn">{t("customers.marketing")}</FieldLabel>
          </FieldContent>
          <Switch
            id="field-marketingOptIn"
            checked={draft.marketingOptIn}
            onCheckedChange={(marketingOptIn) => setDraft({ ...draft, marketingOptIn })}
          />
        </UiField>
      </DialogBody>
      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={save.isPending}>
            {t("action.cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {save.isPending ? t("action.saving") : t("action.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * "Edit details" on a customer: name, email, phone, language and marketing
 * consent — the things a customer rings up to correct. There is deliberately
 * no delete: their orders, hires and sessions are the business's history.
 */
export function EditCustomerButton({ customer, onSaved }: { customer: Customer; onSaved: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil /> {t("customers.editDetails")}
      </Button>
      <DialogContent closeLabel={t("crud.close")} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("customers.editTitle")}</DialogTitle>
          <DialogDescription>{t("customers.editHint")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <EditForm
            customer={customer}
            onDone={(saved) => {
              setOpen(false);
              if (saved) onSaved();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
