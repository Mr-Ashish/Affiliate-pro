import { Container } from "@/components/ui/Container";
import { ComingSoon } from "@/components/public/ComingSoon";

export const metadata = { title: "Deals" };

export default function DealsPage() {
  return (
    <main>
      <Container>
        <ComingSoon title="Deals" />
      </Container>
    </main>
  );
}
