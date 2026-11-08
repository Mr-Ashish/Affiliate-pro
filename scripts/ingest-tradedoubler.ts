import "./load-env";
import { ingestMappedResults } from "../src/lib/ingest/run-mapped";
import { TradeDoublerClient } from "../src/lib/sources/tradedoubler/client";
import { mapTradeDoublerVoucher } from "../src/lib/sources/tradedoubler/map-voucher";

async function main() {
  const token = process.env.TRADEDOUBLER_VOUCHERS_TOKEN?.trim();
  if (!token) {
    throw new Error("Set TRADEDOUBLER_VOUCHERS_TOKEN in .env.networks");
  }

  const client = new TradeDoublerClient({ token });
  const pulled = await client.listAllVouchers();
  const results = pulled.vouchers.map(mapTradeDoublerVoucher);
  const stats = await ingestMappedResults({
    sourceId: "tradedoubler",
    jobName: "tradedoubler-vouchers",
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
