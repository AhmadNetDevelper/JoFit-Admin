import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { cn } from "cn";
import { Eye, EyeOff } from "lucide-react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

import { Field, FormError } from "@/components/form";
import { Button, Checkbox, Input } from "@/components/ui";
import { useSession } from "@/features/auth";
import { useAsyncAction } from "@/hooks";

import { LanguageToggle } from "../components/language-toggle";
import { SportGlyphs } from "../components/sport-glyphs";
import { useTranslation } from "@/i18n";

/**
 * DEVELOPMENT SIGN-IN.
 *
 * Two surfaces. One is loud: a floodlit pitch at night, drawn in the mark's own
 * green and gold, carrying the mark and one sentence about what the platform
 * is. The other is quiet: a card the width of the form inside it, built from
 * the same tokens as every other surface in the admin, so the door is made of
 * the same material as the rooms behind it. All the boldness is spent on the
 * panel; the card does nothing memorable on purpose.
 *
 * The entrance is one staggered sequence played once, in reading order, which
 * is the only motion on the screen apart from the panel's slow drift.
 *
 * WHAT THIS SCREEN DOES NOT HAVE, AND WHY
 * There is no identity provider behind it, so some of what a sign-in page
 * usually offers has nothing to call:
 *
 * - **The password is collected but not verified.** `mockAuthService` resolves a
 *   session from a known email and ignores the rest, so the field is wired all
 *   the way through to `signIn` and ready for a real provider without being a
 *   check today. Both the description under the heading and the prefilled
 *   fixture value say so on the screen, because a password box that silently
 *   accepts anything is the one control on this page that could mislead staff
 *   into thinking their account is protected.
 * - **No "continue with Google".** There is no OAuth client, no redirect URI and
 *   no account linking. The button would be decoration that fails on click.
 * - **No "reset password" or "create account".** Neither flow exists; accounts
 *   are fixtures in `src/mocks/auth`.
 *
 * Each of these is one component away once `authService` talks to a real
 * provider — see ARCHITECTURE.md §18.
 */

/**
 * The fixture password, prefilled like the fixture email above it.
 *
 * It names itself rather than hiding behind dots that look like a real secret,
 * and it keeps signing in a single click while the field is here.
 */
const FIXTURE_PASSWORD = "SuperAdmin@123";

/**
 * "Remember me" remembers who you are, not that you are signed in.
 *
 * Keeping someone signed in is a session, and a session belongs in an httpOnly
 * cookie the server sets — see `auth.mock.ts`. What this box can honestly do
 * today is bring the address back to the field on the next visit, which is what
 * its label says and all it does.
 */
const REMEMBERED_EMAIL_KEY = "jofit.admin.remembered-email";

/** Storage can be unavailable (private mode, blocked site data). */
function readRememberedEmail(): string | null {
  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
  } catch {
    return null;
  }
}

function writeRememberedEmail(email: string | null) {
  try {
    if (email === null) window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    else window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  } catch {
    // Ignore: remembering the address is a convenience, not a requirement.
  }
}

/**
 * Positions for the drifting motes on the panel.
 *
 * Written out rather than generated, because random values would differ between
 * renders and make the panel flicker on every state change — and because a
 * hand-placed spread looks less even, which is the point.
 */
const MOTES = [
  { left: "18%", delay: "0s", duration: "9s" },
  { left: "34%", delay: "2.4s", duration: "11s" },
  { left: "52%", delay: "1.1s", duration: "8.5s" },
  { left: "68%", delay: "3.6s", duration: "12s" },
  { left: "83%", delay: "5s", duration: "10s" },
] as const;

/**
 * The screen's motion, in one place.
 *
 * Motion (motion.dev) drives the two entrances rather than CSS keyframes,
 * because the panel's direction depends on the document's — it has to arrive
 * from the outer edge of the window, which is the left in English and the right
 * in Arabic — and a value read from React is clearer than a `[dir="rtl"]`
 * override. The panel's own scenery stays in CSS: those are ambient loops with
 * nothing to decide.
 *
 * `EASE_OUT_EXPO` is the curve every entrance on this screen uses, so the two
 * halves feel like one arrival rather than two animations that happen to run
 * together.
 */
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

/** Real bodies whose accreditation the platform carries, not invented praise. */
const CREDENTIALS = [
  { src: "/USREPS.png", alt: "US Registry of Exercise Professionals" },
  { src: "/CoAES.png", alt: "Committee on Accreditation for the Exercise Sciences" },
] as const;

export function SignInRoute() {
  const { session, signIn } = useSession();
  const { t, direction } = useTranslation();
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => readRememberedEmail() ?? "superadmin@jofit.com");
  const [remember, setRemember] = useState(() => readRememberedEmail() !== null);
  const [password, setPassword] = useState(FIXTURE_PASSWORD);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const action = useAsyncAction(
    (input: { email: string; password: string }) => signIn(input),
    {
      onSuccess: () => {
        const from = (location.state as { from?: string } | null)?.from;
        void navigate(from ?? "/", { replace: true });
      },
    },
  );

  if (session) return <Navigate to="/" replace />;

  /* The panel leaves from, and returns to, the window's outer edge. */
  const panelOffset = direction === "rtl" ? "100%" : "-100%";

  return (
    <div className="flex min-h-svh w-full flex-col overflow-hidden md:flex-row">
      {/*
        The form comes first in the document and is moved to the second column
        visually, so assistive technology reaches the thing this screen is for
        before the scenery behind it.
      */}
      <section className="flex flex-1 items-center justify-center bg-background p-6 sm:p-10">
        <main id="main-content" className="relative w-full max-w-[26rem]">
          <m.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: EASE_OUT_EXPO }}
          >
            {/*
              The card is a staff pass, not a panel with a form on it: a colour
              band along its head, and a stub below a tear line carrying the part
              that comes off when the real identity provider lands.
            */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_44px_-28px_rgb(0_0_0/0.4)]">
              {/* Green to gold in the reading direction, so the band starts
                  where the eye does. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 top-0 h-1",
                  direction === "rtl"
                    ? "bg-[linear-gradient(to_left,#005030,#008050_40%,#d4b36a)]"
                    : "bg-[linear-gradient(to_right,#005030,#008050_40%,#d4b36a)]",
                )}
              />

              <div className="p-7 pt-8">
                <div className="flex items-center justify-between gap-3">
                  <span className="group/brand flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-muted">
                      <img
                        src="/jofit-mark.png"
                        alt=""
                        aria-hidden="true"
                        className="mark-hover h-3.5 w-auto"
                      />
                    </span>
                    <span className="text-sm font-semibold tracking-tight">{t("app.name")}</span>
                  </span>

                  <LanguageToggle />
                </div>

                <h1 className="mt-6 text-2xl leading-tight font-semibold tracking-tight">
                  {t("signIn.title")}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("signIn.description")}</p>

                <form
                  className="mt-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    writeRememberedEmail(remember ? email : null);
                    void action.run({ email, password });
                  }}
                >
                  <Field label={t("field.email")} error={action.fieldErrors?.email} required>
                    {(props) => (
                      <Input
                        {...props}
                        type="email"
                        autoComplete="username"
                        placeholder={t("signIn.emailPlaceholder")}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="mt-1.5 h-11 px-3.5 text-sm"
                      />
                    )}
                  </Field>

                  <Field
                    label={t("field.password")}
                    error={action.fieldErrors?.password}
                    required
                  >
                    {(props) => (
                      <div className="relative mt-1.5">
                        <Input
                          {...props}
                          type={passwordVisible ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder={t("signIn.passwordPlaceholder")}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="h-11 px-3.5 pe-11 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordVisible((visible) => !visible)}
                          aria-label={t(
                            passwordVisible ? "signIn.hidePassword" : "signIn.showPassword",
                          )}
                          aria-pressed={passwordVisible}
                          className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-e-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          {passwordVisible ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </Field>

                  <div className="-mt-1 mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember-me"
                        checked={remember}
                        onCheckedChange={(checked) => setRemember(checked === true)}
                      />
                      <label htmlFor="remember-me" className="text-xs text-muted-foreground">
                        {t("signIn.rememberMe")}
                      </label>
                    </div>

                    {/*
                      There is no reset flow to link to, so this says what to do
                      instead of leading somewhere that does not exist.
                    */}
                    <button
                      type="button"
                      onClick={() => setHelpOpen((open) => !open)}
                      aria-expanded={helpOpen}
                      aria-controls="sign-in-help"
                      className="rounded-sm text-xs font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {t("signIn.forgotPassword")}
                    </button>
                  </div>

                  {helpOpen ? (
                    <p
                      id="sign-in-help"
                      className="mb-4 rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      {t("signIn.forgotHelp")}
                    </p>
                  ) : null}

                  <FormError error={action.error} />

                  <Button type="submit" disabled={action.isPending} className="h-11 w-full">
                    {action.isPending ? t("action.saving") : t("action.signIn")}
                  </Button>
                </form>
              </div>
            </div>
          </m.div>
        </main>
      </section>

      {/*
        The panel is scenery and is hidden below `md`, where it would push the
        card off the first screen. It is dark in both themes: it is a pitch under
        floodlights, and that does not have a light mode.
      */}
      <m.section
        initial={reducedMotion ? { opacity: 0 } : { x: panelOffset }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        className="relative hidden flex-1 overflow-hidden bg-[#04241a] md:order-first md:block"
      >
        {/*
          The pitch, in layers. `currentColor` drives the pattern colours, so one
          `text-white/…` on each layer sets it — the surface below is always
          dark, so these do not follow the theme.
        */}
        <div aria-hidden="true" className="field-dots absolute inset-0 text-white/20" />
        <div aria-hidden="true" className="field-lines absolute inset-0 text-white/[0.07]" />

        <svg
          aria-hidden="true"
          viewBox="0 0 400 400"
          className="field-circle absolute start-1/2 top-1/2 size-[130%] -translate-x-1/2 -translate-y-1/2 text-white/10"
        >
          <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="200" cy="200" r="92" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="200" y1="0" x2="200" y2="400" stroke="currentColor" strokeWidth="1" />
        </svg>

        <SportGlyphs className="text-white/[0.13]" />

        {/* One floodlight in the corner, the grass it falls short of, and the
            dark at the foot of the panel that the sentence is read against. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_96%_-8%,rgba(235,201,128,0.42),transparent_34%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_4%_100%,rgba(0,128,80,0.6),transparent_62%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,18,13,0.8),transparent_42%)]"
        />

        {/* Motes lit by the panel's glow. Each one is given its own position,
            delay and duration so the group never pulses in unison. */}
        {MOTES.map((mote) => (
          <span
            key={mote.left}
            aria-hidden="true"
            className="field-mote absolute bottom-1/3 size-1 rounded-full bg-white/50"
            style={{
              insetInlineStart: mote.left,
              animationDelay: mote.delay,
              animationDuration: mote.duration,
            }}
          />
        ))}

        {/* Centred in the room left above the sentence, not in the panel, so the
            two never crowd each other. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-72 grid place-content-center">
          {/*
            Three nested elements, one per axis of motion: the outer drifts,
            the inner tilts, and the overlay carries the shine. Nesting rather
            than combining them keeps each `transform` its own — a single
            element can only hold one, and the last one written wins.
          */}
          <span className="animate-mark animate-delay-500 relative grid place-content-center">
            <span
              aria-hidden="true"
              className="animate-mark-glow absolute inset-0 -z-10 m-auto size-48 rounded-full bg-[#d4b36a]/25 blur-3xl"
            />
            <span className="animate-mark-tilt relative block">
              <img src="/jofit-mark.png" alt="" className="h-28 w-auto" />
              <span
                aria-hidden="true"
                className="animate-mark-shine pointer-events-none absolute inset-0"
              />
            </span>
          </span>
        </div>

        <div className="absolute inset-x-10 bottom-10 max-w-[32ch]">
          <div>
            <span aria-hidden="true" className="block h-px w-10 bg-[#d4b36a]" />
            <h2 className="mt-5 text-[1.625rem] leading-tight font-semibold tracking-tight text-white">
              {t("signIn.tagline")}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/65">
              {t("signIn.taglineBody")}
            </p>
          </div>

          {/* The accreditations sit with the sentence rather than in a corner of
              their own: they are part of what the panel claims, not a badge row. */}
          <div className="mt-7 flex items-center gap-2.5">
            {CREDENTIALS.map((credential) => (
              <div
                key={credential.src}
                className="flex items-center justify-center rounded-lg bg-white/85 p-2"
              >
                <img src={credential.src} alt={credential.alt} className="h-5 w-auto" />
              </div>
            ))}
          </div>
        </div>
      </m.section>
    </div>
  );
}
