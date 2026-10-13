import { cn } from "cn";
import {
  ArrowLeft,
  ArrowRight,
  Film,
  ImageUp,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode, type RefObject } from "react";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from "@/components/ui";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  Field as FieldRoot,
  FieldSet,
} from "@/components/ui/field";
import { useTranslation } from "@/i18n";
import { toAppError } from "@/lib";
import { ACCEPTED_IMAGE_TYPES, imageFileProblem, mediaService, type MediaPurpose } from "@/services";
import type { Media, MediaImage } from "@/types";

/*
 * Image fields: one picture (a logo, a cover, a portrait) or a gallery (a
 * product's photos). Both upload the moment a file is chosen or dropped — the
 * file goes to `mediaService` and comes back as a `MediaImage` — and the form
 * then saves that value on the record like any other field. So a record's save
 * never carries a file, and a failed upload never loses the rest of the form.
 */

type Aspect = "square" | "video" | "portrait" | "wide";

const ASPECT: Record<Aspect, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[4/5]",
  wide: "aspect-[3/1]",
};

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="-ms-1 text-destructive">
        *
      </span>
      <span className="sr-only"> (required)</span>
    </>
  );
}

/** The dashed target: click to pick, or drop files on it. */
function DropZone({
  inputId,
  multiple,
  disabled,
  onFiles,
  className,
  compact,
}: {
  inputId: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
  /** A gallery tile rather than a full-width panel. */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const take = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      onDragOver={(event: DragEvent) => {
        if (disabled) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event: DragEvent) => {
        event.preventDefault();
        setOver(false);
        if (!disabled) take(event.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/20 p-4 text-center transition-colors",
        over ? "border-primary bg-primary/5" : "border-input hover:border-ring/60 hover:bg-muted/40",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {/* The real control, visually hidden; the button below opens it and the
          whole panel accepts a drop. */}
      <input
        ref={input}
        id={inputId}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />
      <div className="flex size-10 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-xs">
        <UploadCloud className="size-5" aria-hidden="true" />
      </div>
      {compact ? null : (
        <p className="text-sm font-medium">
          {over ? t("media.dropHere") : multiple ? t("media.dropTitleMany") : t("media.dropTitle")}
        </p>
      )}
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => input.current?.click()}>
        <ImageUp aria-hidden="true" />
        {multiple ? t("media.chooseMany") : t("media.choose")}
      </Button>
      {compact ? null : <p className="text-xs text-muted-foreground">{t("media.rules")}</p>}
    </div>
  );
}

/**
 * While a picture is still uploading, the form it sits in cannot be submitted.
 *
 * Without this, Save pressed mid-upload saves the record WITHOUT the picture —
 * the value only arrives when the upload answers. Rather than make every form
 * track its uploads, the field holds its own form: a capturing `submit`
 * listener on the enclosing <form> stops the submission before React's handler
 * runs, and the form's submit buttons are disabled until the upload settles.
 */
function useHoldFormWhileUploading(root: RefObject<HTMLElement | null>, uploading: boolean) {
  useEffect(() => {
    const form = root.current?.closest("form");
    if (!uploading || !form) return;
    const hold = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    form.addEventListener("submit", hold, true);
    form.dataset.uploading = "true";
    const buttons = [...form.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].filter((button) => !button.disabled);
    buttons.forEach((button) => {
      button.disabled = true;
    });
    return () => {
      form.removeEventListener("submit", hold, true);
      delete form.dataset.uploading;
      buttons.forEach((button) => {
        button.disabled = false;
      });
    };
  }, [root, uploading]);
}

/** The translated reason a file was refused before upload, or undefined. */
function useFileCheck() {
  const { t } = useTranslation();
  return (file: File): string | undefined => {
    const problem = imageFileProblem(file);
    if (problem === "type") return t("media.errorType", { name: file.name });
    if (problem === "size") return t("media.errorSize", { name: file.name });
    return undefined;
  };
}

/* ------------------------------------------------------------------ single */

export interface ImageFieldProps {
  /** The record field's key — `field-<name>` is what the error summary links to. */
  readonly name: string;
  readonly label: string;
  readonly hint?: string;
  readonly value: MediaImage | undefined;
  readonly onChange: (next: MediaImage | undefined) => void;
  readonly purpose: MediaPurpose;
  readonly aspect?: Aspect;
  /** `contain` for a logo on a plain ground; `cover` (default) for a photograph. */
  readonly fit?: "cover" | "contain";
  readonly required?: boolean;
  readonly error?: string;
  readonly disabled?: boolean;
  /** Extra classes on the preview/drop area, e.g. `max-w-xs` for a small logo. */
  readonly className?: string;
}

export function ImageField({
  name,
  label,
  hint,
  value,
  onChange,
  purpose,
  aspect = "video",
  fit = "cover",
  required,
  error,
  disabled,
  className,
}: ImageFieldProps) {
  const { t } = useTranslation();
  const check = useFileCheck();
  const inputId = useId();
  const altId = useId();
  const [pending, setPending] = useState<string>();
  const [problem, setProblem] = useState<string>();
  const replace = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useHoldFormWhileUploading(root, pending !== undefined);

  const id = `field-${name}`;
  const shownError = problem ?? error;

  const upload = async (file: File) => {
    const refused = check(file);
    if (refused) {
      setProblem(refused);
      return;
    }
    setProblem(undefined);
    const preview = URL.createObjectURL(file);
    setPending(preview);
    try {
      const image = await mediaService.uploadImage(file, { purpose, alt: value?.alt });
      onChange(image);
    } catch (cause) {
      setProblem(t("media.errorUpload", { name: file.name, reason: toAppError(cause).message }));
    } finally {
      URL.revokeObjectURL(preview);
      setPending(undefined);
    }
  };

  const shown = pending ?? value?.url;

  return (
    <FieldRoot ref={root} data-invalid={shownError ? true : undefined} className="mb-5 gap-2">
      <FieldLabel htmlFor={shown ? altId : inputId}>
        {label}
        {required ? <RequiredMark /> : null}
      </FieldLabel>

      {/* A square or portrait picture (a logo, an avatar) is shown at a portrait's
          size, not stretched across the whole form. */}
      <div
        id={id}
        tabIndex={-1}
        className={cn("outline-none", (aspect === "square" || aspect === "portrait") && "max-w-60", className)}
      >
        {shown ? (
          <div className="flex flex-col gap-3">
            <div
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-muted/30",
                ASPECT[aspect],
                fit === "contain" && "bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]",
              )}
            >
              <img
                src={shown}
                alt={value?.alt ?? ""}
                className={cn("size-full", fit === "contain" ? "object-contain p-3" : "object-cover")}
              />
              {pending ? (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 text-sm font-medium backdrop-blur-sm">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("media.uploading")}
                </div>
              ) : (
                <div className="absolute end-2 bottom-2 flex gap-1.5">
                  <input
                    ref={replace}
                    type="file"
                    accept={ACCEPT}
                    className="sr-only"
                    tabIndex={-1}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void upload(file);
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    className="shadow-sm"
                    onClick={() => replace.current?.click()}
                  >
                    <RefreshCw aria-hidden="true" />
                    {t("media.replace")}
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    disabled={disabled}
                    className="shadow-sm"
                    aria-label={t("media.remove")}
                    title={t("media.remove")}
                    onClick={() => onChange(undefined)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
            {value && !pending ? (
              <div className="grid gap-1.5">
                <Input
                  id={altId}
                  value={value.alt}
                  disabled={disabled}
                  placeholder={t("media.altPlaceholder")}
                  aria-label={`${label} — ${t("media.alt")}`}
                  onChange={(event) => onChange({ ...value, alt: event.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {t("media.alt")}: {t("media.altHint")}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <DropZone
            inputId={inputId}
            disabled={disabled}
            onFiles={([file]) => file && void upload(file)}
            className={ASPECT[aspect === "wide" ? "wide" : "video"]}
          />
        )}
      </div>

      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
      {shownError ? <FieldError>{shownError}</FieldError> : null}
    </FieldRoot>
  );
}

/* ----------------------------------------------------------------- gallery */

export interface ImageGalleryFieldProps {
  readonly name: string;
  readonly label: string;
  readonly hint?: string;
  /** Images and any videos already on the record; videos are kept and can be reordered. */
  readonly value: readonly Media[];
  readonly onChange: (next: readonly Media[]) => void;
  readonly purpose: MediaPurpose;
  readonly max?: number;
  readonly required?: boolean;
  readonly error?: string;
  readonly disabled?: boolean;
  /** Anything under the grid (a note about how the storefront uses the images). */
  readonly footer?: ReactNode;
}

interface PendingTile {
  readonly key: string;
  readonly name: string;
  readonly preview: string;
}

export function ImageGalleryField({
  name,
  label,
  hint,
  value,
  onChange,
  purpose,
  max = 12,
  required,
  error,
  disabled,
  footer,
}: ImageGalleryFieldProps) {
  const { t, locale } = useTranslation();
  const check = useFileCheck();
  const inputId = useId();
  const [pending, setPending] = useState<readonly PendingTile[]>([]);
  const root = useRef<HTMLFieldSetElement>(null);
  useHoldFormWhileUploading(root, pending.length > 0);
  const [problems, setProblems] = useState<readonly string[]>([]);

  const id = `field-${name}`;
  const room = max - value.length - pending.length;
  /* The list as it is NOW, not as it was when an upload began: alt text typed
     or an image reordered while a file is uploading must survive its arrival. */
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  /* In Arabic "earlier" sits to the right, so the arrows follow the reading direction. */
  const EarlierIcon = locale === "ar" ? ArrowRight : ArrowLeft;
  const LaterIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    onChange(next);
  };

  const add = async (files: File[]) => {
    const messages: string[] = [];
    const accepted: File[] = [];
    for (const file of files) {
      const refused = check(file);
      if (refused) messages.push(refused);
      else accepted.push(file);
    }
    if (accepted.length > room) {
      messages.push(t("media.limit", { max }));
      accepted.splice(Math.max(0, room));
    }
    setProblems(messages);
    if (accepted.length === 0) return;

    const tiles = accepted.map((file) => ({
      key: crypto.randomUUID(),
      name: file.name,
      preview: URL.createObjectURL(file),
    }));
    setPending((current) => [...current, ...tiles]);

    /* All at once, then one change: two uploads finishing a frame apart must
       not each append to a stale copy of the list. */
    const results = await Promise.allSettled(
      accepted.map((file) => mediaService.uploadImage(file, { purpose })),
    );
    const uploaded: MediaImage[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") uploaded.push(result.value);
      else messages.push(t("media.errorUpload", { name: accepted[index]?.name ?? "", reason: toAppError(result.reason).message }));
    });
    tiles.forEach((tile) => URL.revokeObjectURL(tile.preview));
    setPending((current) => current.filter((entry) => !tiles.some((tile) => tile.key === entry.key)));
    setProblems(messages);
    if (uploaded.length > 0) onChange([...latest.current, ...uploaded]);
  };

  const shownError = error;

  return (
    <FieldSet
      ref={root}
      id={id}
      tabIndex={-1}
      data-invalid={shownError ? true : undefined}
      className="mb-5 gap-3 outline-none"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <FieldLegend variant="label" className="mb-0">
          {label}
          {required ? <RequiredMark /> : null}
        </FieldLegend>
        <span className="text-xs text-muted-foreground" data-figure>
          {t("media.count", { count: value.length, max })}
        </span>
      </div>
      <FieldDescription>
        {hint ? `${hint} ` : ""}
        {t("media.galleryHint", { max })}
      </FieldDescription>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((item, index) => (
          <li key={item.id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
            <div className="relative aspect-square bg-muted/30">
              {item.kind === "image" ? (
                <img src={item.url} alt={item.alt} className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                  <Film className="size-6" aria-hidden="true" />
                  <span className="text-xs">{t("media.video")}</span>
                </div>
              )}
              {index === 0 ? (
                <Badge className="absolute start-2 top-2 shadow-sm">
                  <Star aria-hidden="true" />
                  {t("media.cover")}
                </Badge>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    disabled={disabled}
                    className="absolute end-2 top-2 shadow-sm"
                    aria-label={t("media.actionsFor", { n: index + 1 })}
                  >
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {index > 0 ? (
                    <DropdownMenuItem onSelect={() => move(index, 0)}>
                      <Star aria-hidden="true" />
                      {t("media.makeCover")}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem disabled={index === 0} onSelect={() => move(index, index - 1)}>
                    <EarlierIcon aria-hidden="true" />
                    {t("media.moveEarlier")}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={index === value.length - 1} onSelect={() => move(index, index + 1)}>
                    <LaterIcon aria-hidden="true" />
                    {t("media.moveLater")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onChange(value.filter((entry) => entry.id !== item.id))}
                  >
                    <Trash2 aria-hidden="true" />
                    {t("media.remove")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {item.kind === "image" ? (
              <div className="border-t p-2">
                <Input
                  value={item.alt}
                  disabled={disabled}
                  placeholder={t("media.altPlaceholder")}
                  aria-label={`${t("media.alt")} — ${index + 1}`}
                  className="h-7 text-xs md:text-xs"
                  onChange={(event) =>
                    onChange(value.map((entry) => (entry.id === item.id ? { ...item, alt: event.target.value } : entry)))
                  }
                />
              </div>
            ) : null}
          </li>
        ))}

        {pending.map((tile) => (
          <li key={tile.key} className="relative aspect-square overflow-hidden rounded-xl border">
            <img src={tile.preview} alt="" className="size-full object-cover opacity-60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/60 p-2 text-center text-xs font-medium backdrop-blur-[2px]">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span>{t("media.uploading")}</span>
              <span className="w-full truncate text-muted-foreground" dir="ltr">
                {tile.name}
              </span>
            </div>
          </li>
        ))}

        {room > 0 ? (
          <li className={value.length + pending.length === 0 ? "col-span-full" : undefined}>
            <DropZone
              inputId={inputId}
              multiple
              disabled={disabled}
              onFiles={(files) => void add(files)}
              compact={value.length + pending.length > 0}
              className={value.length + pending.length > 0 ? "aspect-square" : "min-h-44"}
            />
          </li>
        ) : null}
      </ul>

      {problems.length > 0 ? (
        <ul role="alert" className="grid gap-1 text-sm text-destructive">
          {problems.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
      {shownError ? <FieldError>{shownError}</FieldError> : null}
      {footer}
    </FieldSet>
  );
}
