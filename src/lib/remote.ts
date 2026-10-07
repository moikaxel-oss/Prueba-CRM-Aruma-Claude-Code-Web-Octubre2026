import { supabase } from "./supabase";
import type { BoardState, Column, Lead, LeadInput } from "./types";

function db() {
  if (!supabase) throw new Error("Supabase no está configurado");
  return supabase;
}

function check<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(res.error.message);
  return res;
}

type LeadRow = {
  id: string;
  stage_id: string;
  position: number;
  campaign: string | null;
  adset: string | null;
  ad: string | null;
  value: number | string;
  notes: string | null;
  created_at: string;
  contacts: { name: string | null; phone: string | null } | null;
};

export async function loadAll(): Promise<BoardState> {
  const client = db();
  const [stages, leads] = await Promise.all([
    client.from("stages").select("id, name, color, position").order("position"),
    client
      .from("leads")
      .select(
        "id, stage_id, position, campaign, adset, ad, value, notes, created_at, contacts(name, phone)",
      )
      .order("position"),
  ]);
  check(stages);
  check(leads);

  return {
    columns: (stages.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      position: Number(s.position),
    })),
    leads: ((leads.data ?? []) as unknown as LeadRow[]).map((l) => ({
      id: l.id,
      columnId: l.stage_id,
      name: l.contacts?.name ?? "",
      phone: l.contacts?.phone ?? "",
      campaign: l.campaign ?? "",
      adset: l.adset ?? "",
      ad: l.ad ?? "",
      value: Number(l.value),
      notes: l.notes ?? "",
      createdAt: l.created_at,
      position: Number(l.position),
    })),
  };
}

export async function insertColumn(c: Column) {
  check(
    await db()
      .from("stages")
      .insert({ id: c.id, name: c.name, color: c.color, position: c.position }),
  );
}

export async function patchColumn(
  id: string,
  patch: Partial<Pick<Column, "name" | "color" | "position">>,
) {
  check(await db().from("stages").update(patch).eq("id", id));
}

export async function removeColumn(id: string, moveToId: string) {
  check(await db().from("leads").update({ stage_id: moveToId }).eq("stage_id", id));
  check(await db().from("stages").delete().eq("id", id));
}

async function contactIdFor(name: string, phone: string): Promise<string> {
  const client = db();
  const cleanPhone = phone.trim();
  if (cleanPhone) {
    const found = check(
      await client.from("contacts").select("id").eq("phone", cleanPhone).maybeSingle(),
    );
    if (found.data) return found.data.id;
  }
  const created = check(
    await client
      .from("contacts")
      .insert({ name, phone: cleanPhone || null })
      .select("id")
      .single(),
  );
  return created.data!.id;
}

export async function insertLead(lead: Lead) {
  const contactId = await contactIdFor(lead.name, lead.phone);
  check(
    await db().from("leads").insert({
      id: lead.id,
      contact_id: contactId,
      stage_id: lead.columnId,
      position: lead.position,
      campaign: lead.campaign,
      adset: lead.adset,
      ad: lead.ad,
      value: lead.value,
      notes: lead.notes,
    }),
  );
}

export async function patchLead(id: string, patch: Partial<LeadInput>) {
  const client = db();

  if (patch.name !== undefined || patch.phone !== undefined) {
    const row = check(
      await client.from("leads").select("contact_id").eq("id", id).single(),
    );
    const contact: { name?: string; phone?: string | null } = {};
    if (patch.name !== undefined) contact.name = patch.name;
    if (patch.phone !== undefined) contact.phone = patch.phone.trim() || null;
    check(await client.from("contacts").update(contact).eq("id", row.data!.contact_id));
  }

  const lead: Record<string, unknown> = {};
  if (patch.columnId !== undefined) lead.stage_id = patch.columnId;
  if (patch.campaign !== undefined) lead.campaign = patch.campaign;
  if (patch.adset !== undefined) lead.adset = patch.adset;
  if (patch.ad !== undefined) lead.ad = patch.ad;
  if (patch.value !== undefined) lead.value = patch.value;
  if (patch.notes !== undefined) lead.notes = patch.notes;
  if (Object.keys(lead).length > 0) {
    check(await client.from("leads").update(lead).eq("id", id));
  }
}

export async function moveLead(id: string, stageId: string, position: number) {
  check(
    await db().from("leads").update({ stage_id: stageId, position }).eq("id", id),
  );
}

export async function removeLead(id: string) {
  check(await db().from("leads").delete().eq("id", id));
}
