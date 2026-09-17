"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { getCurrentUser, getSignedPhotoUrl, PHOTO_BUCKET } from "./db";
import { encodeTeamSeason } from "./focus";
import { normalizePrefs, type FocusType, type Theme, type ViewMode } from "./types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Etat d'une carte avant modification — sert au bouton "annuler" de /ajouter. */
export interface CardStateSnapshot {
  set_id: string;
  card_code: string;
  owned: boolean;
  qty: number;
  date_added: string | null;
  note: string | null;
  variant: string | null;
  jersey_number: string | null;
}

const EMPTY_SNAPSHOT = (setId: string, cardCode: string): CardStateSnapshot => ({
  set_id: setId,
  card_code: cardCode,
  owned: false,
  qty: 0,
  date_added: null,
  note: null,
  variant: null,
  jersey_number: null,
});

function refreshCollectionViews(setId?: string, cardCode?: string): void {
  revalidatePath("/accueil");
  revalidatePath("/sets");
  revalidatePath("/stats");
  revalidatePath("/recherche");
  revalidatePath("/ajouter");
  revalidatePath("/profil");
  if (setId) revalidatePath(`/classeur/${setId}`);
  if (setId && cardCode) revalidatePath(`/carte/${setId}/${cardCode}`);
  revalidatePath("/focus", "layout");
}

async function readState(setId: string, cardCode: string): Promise<CardStateSnapshot> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("user_card_state")
    .select("owned, qty, date_added, note, variant, jersey_number")
    .eq("set_id", setId)
    .eq("card_code", cardCode)
    .maybeSingle();
  if (!data) return EMPTY_SNAPSHOT(setId, cardCode);
  const row = data as Partial<CardStateSnapshot>;
  return {
    set_id: setId,
    card_code: cardCode,
    owned: row.owned ?? false,
    qty: row.qty ?? 0,
    date_added: row.date_added ?? null,
    note: row.note ?? null,
    variant: row.variant ?? null,
    jersey_number: row.jersey_number ?? null,
  };
}

// ---------------------------------------------------------------------------
// Authentification
// ---------------------------------------------------------------------------

export interface AuthState {
  error?: string;
  message?: string;
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/accueil") || "/accueil";

  if (!email || !password) return { error: "Renseignez votre email et votre mot de passe." };

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (err) {
    return { error: (err as Error).message };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/accueil");
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Renseignez votre email et votre mot de passe." };
  if (password.length < 6) return { error: "Le mot de passe doit faire au moins 6 caractères." };

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (err) {
    return { error: (err as Error).message };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // Si la confirmation par email est desactivee dans Supabase, la session est
  // creee immediatement : on entre directement dans l'application.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/accueil");
  }

  return {
    message:
      "Compte créé. Vérifiez votre boîte mail pour confirmer l'adresse, puis connectez-vous.",
  };
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Deja deconnecte ou configuration absente : on redirige quand meme.
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Etat d'une carte
// ---------------------------------------------------------------------------

export async function toggleOwnedAction(
  setId: string,
  cardCode: string,
  owned: boolean,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const previous = await readState(setId, cardCode);

  const payload = {
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    owned,
    qty: owned ? Math.max(previous.qty, 1) : 0,
    date_added: owned ? (previous.date_added ?? new Date().toISOString()) : null,
  };

  const { error } = await supabase.from("user_card_state").upsert(payload);
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

export async function setQtyAction(
  setId: string,
  cardCode: string,
  qty: number,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const safeQty = Number.isFinite(qty) ? Math.max(0, Math.min(99, Math.trunc(qty))) : 0;
  const supabase = createSupabaseServerClient();
  const previous = await readState(setId, cardCode);

  const { error } = await supabase.from("user_card_state").upsert({
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    qty: safeQty,
    owned: safeQty > 0,
    date_added: safeQty > 0 ? (previous.date_added ?? new Date().toISOString()) : null,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

/**
 * Champs editables par l'utilisateur.
 *
 * `variant` et `jersey_number` sont stockes dans `user_card_state` (et non dans
 * `cards`) : la table `cards` est une donnee de reference strictement en
 * lecture seule pour le role `authenticated`. L'affichage utilise la valeur
 * utilisateur en priorite, puis celle de la checklist.
 */
export async function updateCardDetailsAction(
  setId: string,
  cardCode: string,
  fields: { note?: string | null; variant?: string | null; jersey_number?: string | null },
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const previous = await readState(setId, cardCode);
  const clean = (value: string | null | undefined, fallback: string | null) => {
    if (value === undefined) return fallback;
    const trimmed = (value ?? "").trim();
    return trimmed.length === 0 ? null : trimmed;
  };

  const { error } = await supabase.from("user_card_state").upsert({
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    owned: previous.owned,
    qty: previous.qty,
    date_added: previous.date_added,
    note: clean(fields.note, previous.note),
    variant: clean(fields.variant, previous.variant),
    jersey_number: clean(fields.jersey_number, previous.jersey_number),
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Parallèles (une entrée cochable par parallèle connu d'une carte)
// ---------------------------------------------------------------------------

async function readParallelState(
  setId: string,
  cardCode: string,
  parallelId: string,
): Promise<{ owned: boolean; qty: number; date_added: string | null }> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("user_parallel_state")
    .select("owned, qty, date_added")
    .eq("set_id", setId)
    .eq("card_code", cardCode)
    .eq("parallel_id", parallelId)
    .maybeSingle();
  if (!data) return { owned: false, qty: 0, date_added: null };
  const row = data as { owned?: boolean; qty?: number; date_added?: string | null };
  return { owned: row.owned ?? false, qty: row.qty ?? 0, date_added: row.date_added ?? null };
}

export async function toggleParallelOwnedAction(
  setId: string,
  cardCode: string,
  parallelId: string,
  owned: boolean,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const previous = await readParallelState(setId, cardCode, parallelId);

  const { error } = await supabase.from("user_parallel_state").upsert({
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    parallel_id: parallelId,
    owned,
    qty: owned ? Math.max(previous.qty, 1) : 0,
    date_added: owned ? (previous.date_added ?? new Date().toISOString()) : null,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

export async function setParallelQtyAction(
  setId: string,
  cardCode: string,
  parallelId: string,
  qty: number,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const safeQty = Number.isFinite(qty) ? Math.max(0, Math.min(99, Math.trunc(qty))) : 0;
  const supabase = createSupabaseServerClient();
  const previous = await readParallelState(setId, cardCode, parallelId);

  const { error } = await supabase.from("user_parallel_state").upsert({
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    parallel_id: parallelId,
    qty: safeQty,
    owned: safeQty > 0,
    date_added: safeQty > 0 ? (previous.date_added ?? new Date().toISOString()) : null,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

/**
 * Photo (recto ou verso) et note propres a un exemplaire de parallele : sans
 * ca, une carte "normale" possedee et son parallele coche de la meme carte
 * partageaient forcement la meme photo/note, alors que ce sont deux
 * exemplaires physiques distincts.
 */
export interface ParallelPhotoResult extends ActionResult {
  /** URL signee de la photo fraichement envoyee, pour mise a jour optimiste immediate. */
  url?: string | null;
}

export async function uploadParallelPhotoAction(formData: FormData): Promise<ParallelPhotoResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const setId = String(formData.get("setId") ?? "");
  const cardCode = String(formData.get("cardCode") ?? "");
  const parallelId = String(formData.get("parallelId") ?? "");
  const side = (String(formData.get("side") ?? "front") === "back" ? "back" : "front") as PhotoSide;
  const file = formData.get("photo");

  if (!setId || !cardCode || !parallelId) return { ok: false, error: "Parallèle inconnu." };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Aucun fichier choisi." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Photo trop lourde (10 Mo max)." };

  const supabase = createSupabaseServerClient();
  const path = `${user.id}/${setId}/${cardCode}/${parallelId}${side === "back" ? "-verso" : ""}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const previous = await readParallelState(setId, cardCode, parallelId);
  const { error } = await supabase.from("user_parallel_state").upsert({
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    parallel_id: parallelId,
    owned: previous.owned,
    qty: previous.qty,
    date_added: previous.date_added,
    [photoColumn(side)]: path,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  const url = await getSignedPhotoUrl(path);
  return { ok: true, url };
}

export async function removeParallelPhotoAction(
  setId: string,
  cardCode: string,
  parallelId: string,
  side: PhotoSide = "front",
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const path = `${user.id}/${setId}/${cardCode}/${parallelId}${side === "back" ? "-verso" : ""}`;
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);

  const { error } = await supabase
    .from("user_parallel_state")
    .update({ [photoColumn(side)]: null })
    .eq("set_id", setId)
    .eq("card_code", cardCode)
    .eq("parallel_id", parallelId);
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

/** Nom/info libre propre a cet exemplaire de parallele (ex. "PSA 9", "échange en cours"). */
export async function setParallelNoteAction(
  setId: string,
  cardCode: string,
  parallelId: string,
  note: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const previous = await readParallelState(setId, cardCode, parallelId);
  const trimmed = note.trim();

  const { error } = await supabase.from("user_parallel_state").upsert({
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    parallel_id: parallelId,
    owned: previous.owned,
    qty: previous.qty,
    date_added: previous.date_added,
    note: trimmed.length === 0 ? null : trimmed,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Session d'ajout rapide (/ajouter)
// ---------------------------------------------------------------------------

export interface AddResult extends ActionResult {
  previous?: CardStateSnapshot;
}

/** Marque une carte possedee avec date_added = maintenant, et renvoie l'etat precedent. */
export async function addCardAction(
  setId: string,
  cardCode: string,
  qty: number,
): Promise<AddResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const previous = await readState(setId, cardCode);
  const safeQty = Number.isFinite(qty) ? Math.max(1, Math.min(99, Math.trunc(qty))) : 1;

  const { error } = await supabase.from("user_card_state").upsert({
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    owned: true,
    qty: safeQty,
    date_added: new Date().toISOString(),
    note: previous.note,
    variant: previous.variant,
    jersey_number: previous.jersey_number,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true, previous };
}

/** Restaure exactement l'etat precedent d'une carte (bouton "annuler"). */
export async function restoreCardStateAction(
  previous: CardStateSnapshot,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("user_card_state").upsert({
    user_id: user.id,
    set_id: previous.set_id,
    card_code: previous.card_code,
    owned: previous.owned,
    qty: previous.qty,
    date_added: previous.date_added,
    note: previous.note,
    variant: previous.variant,
    jersey_number: previous.jersey_number,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(previous.set_id, previous.card_code);
  return { ok: true };
}

/** Prix/valeur saisi par l'utilisateur pour cette carte de base (independant du parallele). */
export async function setCardPriceAction(
  setId: string,
  cardCode: string,
  price: number | null,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("user_card_state").upsert({
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    price,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

/** Prix/valeur saisi par l'utilisateur pour CET exemplaire de parallele. */
export async function setParallelPriceAction(
  setId: string,
  cardCode: string,
  parallelId: string,
  price: number | null,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("user_parallel_state").upsert({
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    parallel_id: parallelId,
    price,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Photo personnelle (bucket prive card-photos)
// ---------------------------------------------------------------------------

export type PhotoSide = "front" | "back";

function photoColumn(side: PhotoSide): "photo_path" | "photo_back_path" {
  return side === "back" ? "photo_back_path" : "photo_path";
}

export async function uploadCardPhotoAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const setId = String(formData.get("setId") ?? "");
  const cardCode = String(formData.get("cardCode") ?? "");
  const side = (String(formData.get("side") ?? "front") === "back" ? "back" : "front") as PhotoSide;
  const file = formData.get("photo");

  if (!setId || !cardCode) return { ok: false, error: "Carte inconnue." };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Aucun fichier choisi." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Photo trop lourde (10 Mo max)." };

  const supabase = createSupabaseServerClient();
  const path = `${user.id}/${setId}/${cardCode}${side === "back" ? "-verso" : ""}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const previous = await readState(setId, cardCode);
  const { error } = await supabase.from("user_card_state").upsert({
    user_id: user.id,
    set_id: setId,
    card_code: cardCode,
    owned: previous.owned,
    qty: previous.qty,
    date_added: previous.date_added,
    [photoColumn(side)]: path,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

export async function removeCardPhotoAction(
  setId: string,
  cardCode: string,
  side: PhotoSide = "front",
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const path = `${user.id}/${setId}/${cardCode}${side === "back" ? "-verso" : ""}`;
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);

  const { error } = await supabase
    .from("user_card_state")
    .update({ [photoColumn(side)]: null })
    .eq("set_id", setId)
    .eq("card_code", cardCode);
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews(setId, cardCode);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Focus
// ---------------------------------------------------------------------------

export async function createFocusAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const type = String(formData.get("type") ?? "player") as FocusType;
  if (!["player", "team", "team_season"].includes(type)) {
    return { ok: false, error: "Type de focus invalide." };
  }

  const rawValue = String(formData.get("value") ?? "").trim();
  const season = String(formData.get("season") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();

  if (!rawValue) return { ok: false, error: "Choisissez un joueur ou une équipe." };
  if (type === "team_season" && !season) return { ok: false, error: "Choisissez une saison." };

  const value = type === "team_season" ? encodeTeamSeason(rawValue, season) : rawValue;

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("focuses").insert({
    user_id: user.id,
    type,
    value,
    label: label || rawValue,
    active: true,
  });
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews();
  return { ok: true };
}

export async function updateFocusAction(
  focusId: string,
  fields: { label?: string; active?: boolean },
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const patch: Record<string, unknown> = {};
  if (fields.label !== undefined) {
    const label = fields.label.trim();
    if (!label) return { ok: false, error: "Le libellé ne peut pas être vide." };
    patch.label = label;
  }
  if (fields.active !== undefined) patch.active = fields.active;
  if (Object.keys(patch).length === 0) return { ok: true };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("focuses").update(patch).eq("id", focusId);
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews();
  revalidatePath(`/focus/${focusId}`);
  return { ok: true };
}

export async function deleteFocusAction(focusId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("focuses").delete().eq("id", focusId);
  if (error) return { ok: false, error: error.message };

  refreshCollectionViews();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Profil et preferences
// ---------------------------------------------------------------------------

export async function updateProfileAction(fields: {
  pseudonym?: string;
  avatar_seed?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const patch: Record<string, unknown> = {};
  if (fields.pseudonym !== undefined) {
    const pseudonym = fields.pseudonym.trim();
    patch.pseudonym = pseudonym.length === 0 ? "Collectionneur" : pseudonym.slice(0, 40);
  }
  if (fields.avatar_seed !== undefined) patch.avatar_seed = fields.avatar_seed.slice(0, 40);

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, ...patch })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profil");
  revalidatePath("/accueil");
  return { ok: true };
}

export async function updatePrefsAction(fields: {
  defaultView?: ViewMode;
  theme?: Theme;
  collapseSectionsByDefault?: boolean;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("prefs")
    .eq("user_id", user.id)
    .maybeSingle();

  const current = normalizePrefs((data as { prefs?: unknown } | null)?.prefs);
  const prefs = normalizePrefs({ ...current, ...fields });

  const { error } = await supabase.from("profiles").upsert({ user_id: user.id, prefs });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
