"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { OfferRowMenu } from "@/components/admin/OfferRowMenu";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { filterAdminOffers } from "@/lib/catalog/filter-admin-offers";
import { statusBadgeTone } from "@/lib/ui/view-models";

export type OfferTableRow = {
  id: string;
  title: string;
  code: string | null;
  offerType: string;
  status: string;
  clickCount: number;
  merchantId: string;
  merchantName: string;
  merchantMarket: string;
  merchantSlug: string;
};

export type OffersTableProps = {
  offers: OfferTableRow[];
};

export function OffersTable({ offers }: OffersTableProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [merchantId, setMerchantId] = useState("all");

  const merchants = useMemo(() => {
    const byId = new Map<string, string>();
    for (const offer of offers) {
      if (!byId.has(offer.merchantId)) {
        byId.set(offer.merchantId, offer.merchantName);
      }
    }
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [offers]);

  const filtered = useMemo(
    () => filterAdminOffers(offers, { q, status, merchantId }),
    [offers, q, status, merchantId],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles…"
            aria-label="Search offer titles"
            className="max-w-xs"
          />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="max-w-[10rem]"
          >
            <option value="all">All statuses</option>
            <option value="active">active</option>
            <option value="disabled">disabled</option>
            <option value="expired">expired</option>
            <option value="draft">draft</option>
          </Select>
          <Select
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            aria-label="Filter by merchant"
            className="max-w-[12rem]"
          >
            <option value="all">All merchants</option>
            {merchants.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
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
      ) : filtered.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No offers match.</p>
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
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.title}</TableCell>
                <TableCell>
                  {o.merchantName}{" "}
                  <code className="text-xs text-on-surface-variant">
                    ({o.merchantMarket}/{o.merchantSlug})
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
                <TableCell className="text-right">
                  <OfferRowMenu
                    offerId={o.id}
                    title={o.title}
                    status={o.status}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
