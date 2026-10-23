import { NextResponse } from "next/server";
import { getAllIntegrationModes } from "@/integrations/mode";
import { PROVIDER_CAPABILITY_MATRICES } from "@/integrations/registry";

export async function GET() {
  const modes = await getAllIntegrationModes();

  const capabilitiesWithModes = PROVIDER_CAPABILITY_MATRICES.map((matrix) => {
    const currentMode = modes.find((m) => m.provider === matrix.provider);
    return {
      ...matrix,
      currentMode: currentMode?.mode || "DEMO",
      connectionState: currentMode?.connectionState || "DEMO_MOCK",
      externalAccountId: currentMode?.externalAccountId || null,
      grantedScopes: currentMode?.grantedScopes || [],
      lastSyncAt: currentMode?.lastSyncAt || null,
    };
  });

  return NextResponse.json({
    success: true,
    modes,
    providers: capabilitiesWithModes,
  });
}
