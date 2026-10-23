import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CareerNetworkingService } from "@/modules/networking/service";
import { LeadCategory, RelationshipState } from "@/modules/networking/types";
import { logger } from "@/lib/logger";

const service = new CareerNetworkingService();

// Zod Schemas
const createLeadSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  roleTitle: z.string().min(2, "Role title must be at least 2 characters").max(120),
  company: z.string().min(2, "Company must be at least 2 characters").max(100),
  category: z.enum([
    "ENGINEER_MAINTAINER",
    "ALUMNI",
    "RECRUITER_TALENT",
    "FOUNDER_HIRING_MGR",
    "EMBEDDED_HARDWARE",
  ] as const),
  profileUrl: z.string().url("Must be a valid URL (e.g. https://linkedin.com/in/... or https://github.com/...)"),
  provenanceUrl: z.string().url("Must be a valid source URL"),
  domainFocus: z.string().min(2, "Domain focus required").max(100),
  relevanceEvidence: z.string().max(500).optional(),
  customNote: z.string().max(300, "Connection note must not exceed 300 characters").optional(),
  notes: z.string().max(1000).optional(),
  followUpDate: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
});

const patchLeadSchema = z.object({
  id: z.string().min(1, "Lead ID required"),
  action: z.enum(["CONFIRM_CONTACTED", "SET_DO_NOT_CONTACT", "UPDATE_DETAILS", "RESET_STATUS"]),
  notes: z.string().max(1000).optional(),
  followUpDate: z.string().nullable().optional(),
  reason: z.string().max(300).optional(),
  connectionState: z.enum([
    "IDENTIFIED",
    "DRAFTED",
    "CONTACTED",
    "CONNECTED",
    "UNRESPONSIVE",
    "DO_NOT_CONTACT",
  ] as const).optional(),
  connectionNoteText: z.string().max(300).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const domain = searchParams.get("domain") || undefined;
    const state = searchParams.get("state") || undefined;

    const leads = await service.getLeadsFromDb({
      search,
      category,
      domain,
      state,
    });

    const antiSpam = await service.getAntiSpamStatusFromDb();

    return NextResponse.json({
      success: true,
      leads,
      antiSpam,
      totalCount: leads.length,
    });
  } catch (error) {
    logger.error("API_NETWORK", "Failed to retrieve network leads", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to retrieve network leads from database" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const newLead = await service.createLeadInDb(parsed.data);

    return NextResponse.json({
      success: true,
      lead: newLead,
      message: `Contact ${newLead.fullName} added successfully.`,
    });
  } catch (error) {
    logger.error("API_NETWORK", "Failed to create contact", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to create contact in database" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = patchLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id, action, notes, followUpDate, reason, connectionState, connectionNoteText } = parsed.data;

    if (action === "CONFIRM_CONTACTED") {
      const updated = await service.markAsContactedInDb("demo-user-badri", id, notes);
      return NextResponse.json({ success: true, lead: updated });
    }

    if (action === "SET_DO_NOT_CONTACT") {
      await service.setDoNotContactInDb("demo-user-badri", id, reason || "User preference");
      const updated = await service.updateLeadInDb({ id, isDoNotContact: true, connectionState: "DO_NOT_CONTACT" });
      return NextResponse.json({ success: true, lead: updated });
    }

    if (action === "UPDATE_DETAILS" || action === "RESET_STATUS") {
      const updated = await service.updateLeadInDb({
        id,
        notes: notes !== undefined ? notes : undefined,
        followUpDate: followUpDate !== undefined ? (followUpDate || undefined) : undefined,
        connectionState: connectionState as RelationshipState | undefined,
        connectionNoteText: connectionNoteText !== undefined ? connectionNoteText : undefined,
      });
      return NextResponse.json({ success: true, lead: updated });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    logger.error("API_NETWORK", "Failed to update contact", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing contact ID" }, { status: 400 });
    }

    await service.deleteLeadFromDb(id);

    return NextResponse.json({ success: true, message: "Contact deleted successfully" });
  } catch (error) {
    logger.error("API_NETWORK", "Failed to delete contact", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
