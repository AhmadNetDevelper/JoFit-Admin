import { Loader2 } from "lucide-react";
import { useState } from "react";

import { AsyncBoundary, useNotice } from "@/components/feedback";
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
  FieldDescription,
  FieldLabel,
  Input,
  NativeSelect,
  NativeSelectOption,
  Switch,
  Field as UiField,
} from "@/components/ui";
import { GENDER_IDS, identityService, type GenderId, type PlatformUser, type UserDraft } from "@/features/identity";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { entryLabel, loadIdentityOptions, type IdentityOptions } from "./identity-options";

export type UserFormMode = { readonly kind: "create" } | { readonly kind: "edit"; readonly user: PlatformUser };

interface FormState {
  readonly userName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly fullName: string;
  readonly birthDate: string;
  readonly genderId: string;
  readonly countryId: string;
  readonly cityId: string;
  readonly jobStatusId: string;
  readonly isActive: boolean;
  readonly password: string;
}

function initialState(user?: PlatformUser): FormState {
  return {
    userName: user?.userName ?? "",
    email: user?.email ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    fullName: user?.fullName ?? "",
    birthDate: user?.birthDate?.slice(0, 10) ?? "",
    genderId: user?.genderId ? String(user.genderId) : "",
    countryId: user?.countryId ?? "",
    cityId: user?.cityId ?? "",
    jobStatusId: user?.jobStatusId ?? "",
    isActive: user?.isActive ?? true,
    password: "",
  };
}

function toDraft(state: FormState): UserDraft {
  const genderId = Number(state.genderId);
  return {
    userName: state.userName,
    email: state.email,
    phoneNumber: state.phoneNumber,
    fullName: state.fullName,
    isActive: state.isActive,
    ...(state.birthDate ? { birthDate: state.birthDate } : {}),
    ...(genderId === 1 || genderId === 2 ? { genderId: genderId as GenderId } : {}),
    ...(state.countryId ? { countryId: state.countryId } : {}),
    ...(state.cityId ? { cityId: state.cityId } : {}),
    ...(state.jobStatusId ? { jobStatusId: state.jobStatusId } : {}),
  };
}

function UserForm({
  mode,
  options,
  onDone,
}: {
  mode: UserFormMode;
  options: IdentityOptions;
  onDone: (saved?: PlatformUser) => void;
}) {
  const { t } = useTranslation();
  const { text } = useFormatters();
  const notice = useNotice();
  const isNew = mode.kind === "create";
  const [state, setState] = useState<FormState>(() => initialState(mode.kind === "edit" ? mode.user : undefined));
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setState((current) => ({ ...current, [key]: value }));

  const save = useAsyncAction(
    (next: FormState) => {
      const { isActive: _isActive, ...draft } = toDraft(next);
      return mode.kind === "create"
        ? identityService.createUser({ ...draft, password: next.password })
        : identityService.updateUser(mode.user.id, toDraft(next));
    },
    {
      onSuccess: (user) => {
        notice.success(t(isNew ? "identity.users.created" : "crud.updated"));
        onDone(user);
      },
    },
  );
  const errors = save.fieldErrors;
  const cities = options.cities.filter((city) => !state.countryId || city.countryId === state.countryId);

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        void save.run(state);
      }}
    >
      <DialogBody>
        <FormError
          error={save.error}
          labels={{
            userName: t("identity.field.userName"),
            email: t("field.email"),
            phoneNumber: t("field.phone"),
            fullName: t("identity.field.fullName"),
            password: t("identity.field.password"),
            genderId: t("identity.field.gender"),
            birthDate: t("identity.field.birthDate"),
          }}
          summary={false}
        />
        <Field name="fullName" label={t("identity.field.fullName")} required error={errors?.fullName}>
          {(props) => (
            <Input {...props} dir="auto" value={state.fullName} onChange={(event) => set("fullName", event.target.value)} />
          )}
        </Field>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field name="userName" label={t("identity.field.userName")} required error={errors?.userName}>
            {(props) => (
              <Input
                {...props}
                dir="ltr"
                autoComplete="off"
                value={state.userName}
                onChange={(event) => set("userName", event.target.value)}
              />
            )}
          </Field>
          <Field name="email" label={t("field.email")} required error={errors?.email}>
            {(props) => (
              <Input {...props} type="email" dir="ltr" value={state.email} onChange={(event) => set("email", event.target.value)} />
            )}
          </Field>
          <Field name="phoneNumber" label={t("field.phone")} required error={errors?.phoneNumber}>
            {(props) => (
              <Input
                {...props}
                type="tel"
                dir="ltr"
                value={state.phoneNumber}
                onChange={(event) => set("phoneNumber", event.target.value)}
              />
            )}
          </Field>
          {isNew ? (
            <Field
              name="password"
              label={t("identity.field.password")}
              hint={t("identity.field.passwordHint")}
              required
              error={errors?.password}
            >
              {(props) => (
                <Input
                  {...props}
                  type="text"
                  dir="ltr"
                  autoComplete="new-password"
                  value={state.password}
                  onChange={(event) => set("password", event.target.value)}
                />
              )}
            </Field>
          ) : null}
          <Field name="genderId" label={t("identity.field.gender")} required error={errors?.genderId}>
            {(props) => (
              <NativeSelect {...props} value={state.genderId} onChange={(event) => set("genderId", event.target.value)}>
                <NativeSelectOption value="">{t("identity.choose")}</NativeSelectOption>
                {GENDER_IDS.map((id) => (
                  <NativeSelectOption key={id} value={String(id)}>
                    {t(`identity.gender.${id}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field name="birthDate" label={t("identity.field.birthDate")} error={errors?.birthDate}>
            {(props) => (
              <Input {...props} type="date" dir="ltr" value={state.birthDate} onChange={(event) => set("birthDate", event.target.value)} />
            )}
          </Field>
          <Field name="countryId" label={t("identity.field.country")} error={errors?.countryId}>
            {(props) => (
              <NativeSelect
                {...props}
                value={state.countryId}
                onChange={(event) => setState((current) => ({ ...current, countryId: event.target.value, cityId: "" }))}
              >
                <NativeSelectOption value="">{t("identity.none")}</NativeSelectOption>
                {options.countries.map((country) => (
                  <NativeSelectOption key={country.id} value={country.id}>
                    {text(entryLabel(country))}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field name="cityId" label={t("identity.field.city")} error={errors?.cityId}>
            {(props) => (
              <NativeSelect {...props} value={state.cityId} onChange={(event) => set("cityId", event.target.value)}>
                <NativeSelectOption value="">{t("identity.none")}</NativeSelectOption>
                {cities.map((city) => (
                  <NativeSelectOption key={city.id} value={city.id}>
                    {text(entryLabel(city))}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field name="jobStatusId" label={t("identity.field.jobStatus")} error={errors?.jobStatusId}>
            {(props) => (
              <NativeSelect {...props} value={state.jobStatusId} onChange={(event) => set("jobStatusId", event.target.value)}>
                <NativeSelectOption value="">{t("identity.none")}</NativeSelectOption>
                {options.jobStatuses.map((status) => (
                  <NativeSelectOption key={status.id} value={status.id}>
                    {text(entryLabel(status))}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </Field>
        </div>
        {isNew ? null : (
          <UiField orientation="horizontal" className="rounded-lg border p-3">
            <FieldContent>
              <FieldLabel htmlFor="field-isActive">{t("identity.active")}</FieldLabel>
              <FieldDescription>{t("identity.field.activeHint")}</FieldDescription>
            </FieldContent>
            <Switch id="field-isActive" checked={state.isActive} onCheckedChange={(isActive) => set("isActive", isActive)} />
          </UiField>
        )}
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

function UserFormBody({ mode, onDone }: { mode: UserFormMode; onDone: (saved?: PlatformUser) => void }) {
  const { t } = useTranslation();
  const options = useAsyncData(loadIdentityOptions, []);
  return (
    <AsyncBoundary state={options} pendingLabel={t("state.loading")} pendingRows={4}>
      {(loaded) => <UserForm mode={mode} options={loaded} onDone={onDone} />}
    </AsyncBoundary>
  );
}

/**
 * One account's details in a dialog: a new plain `User`-role account (with
 * the temporary password it signs in with), or corrections to an existing
 * one. The role is never a field — the API has no call that changes it.
 */
export function UserFormDialog({
  mode,
  open,
  onOpenChange,
  onSaved,
}: {
  mode: UserFormMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (user: PlatformUser) => void;
}) {
  const { t } = useTranslation();
  const isNew = mode.kind === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("crud.close")} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(isNew ? "identity.users.newTitle" : "identity.user.editTitle")}</DialogTitle>
          <DialogDescription>{t(isNew ? "identity.users.newHint" : "identity.user.editHint")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <UserFormBody
            mode={mode}
            onDone={(saved) => {
              onOpenChange(false);
              if (saved) onSaved(saved);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
