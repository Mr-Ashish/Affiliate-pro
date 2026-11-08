import { Container } from "@/components/ui/Container";
import { ComingSoon } from "@/components/public/ComingSoon";

export const metadata = { title: "Coming soon" };

export default function ComingSoonPage() {
  return (
    <main>
      <Container>
        <ComingSoon title="Coming soon" />
      </Container>
    </main>
  );
}
