"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
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
import { MerchantAvatar } from "@/components/public/MerchantAvatar";

export type MerchantTableRow = {
  id: string;
  name: string;
  slug: string;
  market: string;
  siteUrl: string;
  logoUrl: string | null;
  isActive: boolean;
  offerCount: number;
};

export type MerchantsTableProps = {
  merchants: MerchantTableRow[];
};

export function MerchantsTable({ merchants }: MerchantsTableProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return merchants.filter((m) => {
      if (status === "active" && !m.isActive) return false;
      if (status === "inactive" && m.isActive) return false;
      if (!needle) return true;
      return (
        m.name.toLowerCase().includes(needle) ||
        m.slug.toLowerCase().includes(needle) ||
        m.market.toLowerCase().includes(needle)
      );
    });
  }, [merchants, q, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search merchants…"
            aria-label="Search merchants"
            className="max-w-xs"
          />
          <Select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "all" | "active" | "inactive")
            }
            aria-label="Filter by status"
            className="max-w-[10rem]"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <Link href="/admin/merchants/new">
          <Button variant="primary" size="sm">
            <Icon icon={Plus} size={16} />
            Add Merchant
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No merchants match.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Offers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MerchantAvatar
                      name={m.name}
                      logoUrl={m.logoUrl}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <code className="text-xs text-on-surface-variant">
                        {m.slug}
                      </code>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{m.market}</TableCell>
                <TableCell className="tabular-nums">{m.offerCount}</TableCell>
                <TableCell>
                  <Badge tone={m.isActive ? "active" : "neutral"}>
                    {m.isActive ? "active" : "inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/store/${m.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      target="_blank"
                    >
                      View store
                      <Icon icon={ExternalLink} size={14} />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
