import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { statusBadgeTone } from "@/lib/ui/view-models";

export type TopOfferRow = {
  id: string;
  title: string;
  code: string | null;
  clickCount: number;
  status: string;
  merchantName: string;
};

export type TopOffersTableProps = {
  offers: TopOfferRow[];
};

export function TopOffersTable({ offers }: TopOffersTableProps) {
  if (offers.length === 0) {
    return <p className="text-sm text-on-surface-variant">No offers yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Offer</TableHead>
          <TableHead>Merchant</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Clicks</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {offers.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-medium">{o.title}</TableCell>
            <TableCell>{o.merchantName}</TableCell>
            <TableCell>
              {o.code ? (
                <code className="font-code text-xs">{o.code}</code>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="tabular-nums">{o.clickCount}</TableCell>
            <TableCell>
              <Badge tone={statusBadgeTone(o.status)}>{o.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
