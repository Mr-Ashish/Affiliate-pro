import "./load-env";
import { ingestMappedResults } from "../src/lib/ingest/run-mapped";
import { AwinClient } from "../src/lib/sources/awin/client";
import { mapAwinPromotions } from "../src/lib/sources/awin/map-promotion";

async function main() {
  const token = process.env.AWIN_API_TOKEN?.trim();
  const publisherId = process.env.AWIN_PUBLISHER_ID?.trim();
  if (!token || !publisherId) {
    throw new Error("Set AWIN_API_TOKEN and AWIN_PUBLISHER_ID in .env.networks");
  }

  const client = new AwinClient({ token, publisherId });
  const programmes = await client.listJoinedProgrammes();
  const byId = new Map(programmes.map((programme) => [programme.id, programme]));
  const pulled = await client.listAllPromotions();
  const results = pulled.promotions.flatMap((promotion) =>
    mapAwinPromotions(promotion, byId.get(promotion.advertiser.id) ?? null),
  );
  const stats = await ingestMappedResults({
    sourceId: "awin",
    jobName: "awin-promotions",
    incomplete: pulled.incomplete,
    results,
  });

  console.log(JSON.stringify(stats, null, 2));
  if (stats.status !== "ok") {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
