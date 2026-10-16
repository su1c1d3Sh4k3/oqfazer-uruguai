import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

// Criação de contas. O cadastro público do Supabase Auth fica DESLIGADO —
// toda conta nova nasce aqui:
//   Públicas (sem login):
//     invite-info     { token }                 → dados do convite (email, tipo)
//     accept-invite   { token, password, ... }  → cria a conta com o tipo do convite
//     request-signup  { email, password, ... }  → cria conta 'pending' (banida até aprovar)
//   Só admin:
//     create-user     { email, password, role, ... } → cria conta direto
//     approve         { userId }                → libera uma solicitação
// Emails (convite, aprovação, boas-vindas) são enviados pelo front com os
// templates editáveis do admin (lib/emailService).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Ban "eterno" para solicitações pendentes (o Auth não aceita infinito)
const PENDING_BAN = "876000h";
const ROLES = ["user", "establishment", "agency", "admin"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const fail = (error: string, status = 400) =>
  json({ success: false, error }, status);

const str = (v: unknown, max = 200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const int = (v: unknown, def: number, min: number, max: number) => {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Campos de perfil aceitos do formulário, conforme o tipo de conta */
function profileFields(body: Record<string, unknown>, role: string) {
  const fields: Record<string, unknown> = {
    phone: str(body.phone, 40) || null,
  };
  if (role === "establishment") {
    fields.responsible_name = str(body.name) || null;
  } else {
    fields.name = str(body.name) || null;
  }
  if (role === "user") {
    fields.travel_period = str(body.travelPeriod, 100) || null;
    fields.adults = int(body.adults, 1, 1, 20);
    fields.children = int(body.children, 0, 0, 20);
  }
  return fields;
}

function authErrorMessage(message: string) {
  if (/already (been )?registered|already exists/i.test(message)) {
    return "Este e-mail já possui cadastro. Faça login ou use \"Esqueci a senha\".";
  }
  if (/password/i.test(message)) {
    return "Senha inválida: use pelo menos 6 caracteres.";
  }
  return message;
}

/** O perfil é criado pelo trigger handle_new_user; aqui só completamos */
async function updateProfile(
  admin: SupabaseClient,
  userId: string,
  data: Record<string, unknown>,
) {
  const { error } = await admin
    .from("profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return error;
}

async function getInvite(admin: SupabaseClient, token: string) {
  if (!token) return { invite: null, problem: "Convite inválido." };
  const { data: invite } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (!invite) return { invite: null, problem: "Convite não encontrado." };
  if (invite.revoked_at) {
    return { invite, problem: "Este convite foi cancelado." };
  }
  if (invite.used_at) {
    return { invite, problem: "Este convite já foi utilizado. Faça login." };
  }
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { invite, problem: "Este convite expirou. Peça um novo ao administrador." };
  }
  return { invite, problem: null };
}

async function requireAdmin(req: Request, admin: SupabaseClient) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" ? user : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json();
    const action = str(body.action, 40);

    // ── Convite: consulta ────────────────────────────────────────────
    if (action === "invite-info") {
      const { invite, problem } = await getInvite(admin, str(body.token, 100));
      if (problem || !invite) return fail(problem || "Convite inválido.", 404);
      let placeName: string | null = null;
      if (invite.managed_place_id) {
        const { data: place } = await admin
          .from("places")
          .select("name")
          .eq("id", invite.managed_place_id)
          .maybeSingle();
        placeName = place?.name ?? null;
      }
      return json({
        success: true,
        email: invite.email,
        role: invite.role,
        placeName,
        expiresAt: invite.expires_at,
      });
    }

    // ── Convite: aceite ──────────────────────────────────────────────
    if (action === "accept-invite") {
      const token = str(body.token, 100);
      const password = typeof body.password === "string" ? body.password : "";
      if (password.length < 6) return fail("A senha precisa ter pelo menos 6 caracteres.");

      const { invite, problem } = await getInvite(admin, token);
      if (problem || !invite) return fail(problem || "Convite inválido.", 404);

      // Reserva o convite antes de criar a conta (evita uso duplo simultâneo)
      const { data: claimed } = await admin
        .from("invites")
        .update({ used_at: new Date().toISOString() })
        .eq("id", invite.id)
        .is("used_at", null)
        .is("revoked_at", null)
        .select("id");
      if (!claimed?.length) return fail("Este convite já foi utilizado.", 409);

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true,
      });
      if (createError || !created?.user) {
        await admin.from("invites").update({ used_at: null }).eq("id", invite.id);
        return fail(authErrorMessage(createError?.message || "Erro ao criar a conta."));
      }

      const userId = created.user.id;
      const profileError = await updateProfile(admin, userId, {
        role: invite.role,
        managed_place_id: invite.role === "establishment" ? invite.managed_place_id : null,
        ...profileFields(body, invite.role),
      });
      if (profileError) {
        // Sem o tipo certo a conta não serve — desfaz tudo
        await admin.auth.admin.deleteUser(userId);
        await admin.from("invites").update({ used_at: null }).eq("id", invite.id);
        return fail("Erro ao salvar o perfil. Tente novamente.", 500);
      }

      await admin.from("invites").update({ used_by: userId }).eq("id", invite.id);
      return json({ success: true, email: invite.email, role: invite.role });
    }

    // ── Solicitação pública de cadastro (precisa de aprovação) ───────
    if (action === "request-signup") {
      const email = str(body.email).toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      if (!isEmail(email)) return fail("Informe um e-mail válido.");
      if (!str(body.name)) return fail("Informe seu nome.");
      if (password.length < 6) return fail("A senha precisa ter pelo menos 6 caracteres.");

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        ban_duration: PENDING_BAN,
      });
      if (createError || !created?.user) {
        return fail(authErrorMessage(createError?.message || "Erro ao enviar o cadastro."));
      }

      const profileError = await updateProfile(admin, created.user.id, {
        role: "user",
        account_status: "pending",
        ...profileFields(body, "user"),
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id);
        return fail("Erro ao salvar o cadastro. Tente novamente.", 500);
      }
      return json({ success: true });
    }

    // ── Ações do admin ───────────────────────────────────────────────
    if (action === "create-user" || action === "approve") {
      const caller = await requireAdmin(req, admin);
      if (!caller) return fail("Sem permissao de administrador", 403);

      if (action === "approve") {
        const userId = str(body.userId, 64);
        if (!userId) return fail("userId e obrigatorio");
        const { error } = await admin.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });
        if (error) return fail(error.message, 500);
        const profileError = await updateProfile(admin, userId, { account_status: "active" });
        if (profileError) return fail(profileError.message, 500);
        return json({ success: true });
      }

      // create-user
      const email = str(body.email).toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      const role = str(body.role, 20);
      if (!isEmail(email)) return fail("Informe um e-mail válido.");
      if (password.length < 6) return fail("A senha precisa ter pelo menos 6 caracteres.");
      if (!ROLES.includes(role)) return fail("Tipo de conta inválido.");

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError || !created?.user) {
        return fail(authErrorMessage(createError?.message || "Erro ao criar usuário."));
      }

      const p = body.profile && typeof body.profile === "object" ? body.profile : {};
      const profileError = await updateProfile(admin, created.user.id, {
        role,
        name: str(p.name) || null,
        phone: str(p.phone, 40) || null,
        cpf: str(p.cpf, 40) || null,
        ci: str(p.ci, 40) || null,
        responsible_name: str(p.responsibleName) || null,
        managed_place_id: str(p.managedPlaceId, 64) || null,
        travel_period: str(p.travelPeriod, 100) || null,
        adults: int(p.adults, 1, 1, 20),
        children: int(p.children, 0, 0, 20),
      });
      if (profileError) {
        return json({
          success: true,
          userId: created.user.id,
          warning: "Usuário criado, mas houve erro ao salvar os dados do perfil.",
        });
      }
      return json({ success: true, userId: created.user.id });
    }

    return fail("Ação inválida.");
  } catch (error) {
    return fail(String(error), 500);
  }
});
