import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db";

describe("Database Integration (Prisma + PostgreSQL)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should query the seeded UserProfile for Badri Vishal Pandey", async () => {
    const user = await prisma.userProfile.findFirst({
      where: { id: "demo-user-badri" },
      include: { preferences: true },
    });

    expect(user).toBeDefined();
    expect(user?.fullName).toBe("Badri Vishal Pandey");
    expect(user?.preferences?.graduationYear).toBe(2028);
  });

  it("should find verified EvidenceFact records", async () => {
    const facts = await prisma.evidenceFact.findMany({
      where: { userId: "demo-user-badri" },
    });

    expect(facts.length).toBeGreaterThanOrEqual(3);
    const waferFact = facts.find((f) => f.title.includes("Wafer"));
    expect(waferFact?.verificationStatus).toBe("VERIFIED");
  });

  it("should verify pending approval request has valid content hash", async () => {
    const approval = await prisma.approvalRequest.findFirst({
      where: { status: "PENDING" },
    });

    expect(approval).toBeDefined();
    expect(approval?.actionType).toBe("SEND_EMAIL");
    expect(approval?.contentHash).toHaveLength(64);
  });
});
