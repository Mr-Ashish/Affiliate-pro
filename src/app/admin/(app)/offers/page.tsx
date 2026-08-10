import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { listOffers } from "@/lib/catalog/offers";
import { statusBadgeTone } from "@/lib/ui/view-models";

export default async function AdminOffersPage() {
  const offers = await listOffers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Offers</h1>
          <p className="text-sm text-on-surface-variant">
            All catalog offers across merchants.
          </p>
        </div>
        <Link href="/admin/offers/new">
          <Button variant="primary" size="sm">
            <Icon icon={Plus} size={16} />
            New offer
          </Button>
        </Link>
      </div>

      {offers.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No offers yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Id</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.title}</TableCell>
                <TableCell>
                  {o.merchant.name}{" "}
                  <code className="text-xs text-on-surface-variant">
                    ({o.merchant.market}/{o.merchant.slug})
                  </code>
                </TableCell>
                <TableCell>{o.offerType}</TableCell>
                <TableCell>
                  {o.code ? (
                    <code className="font-code text-xs">{o.code}</code>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge tone={statusBadgeTone(o.status)}>{o.status}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">{o.clickCount}</TableCell>
                <TableCell>
                  <code className="text-xs">{o.id.slice(0, 8)}…</code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
