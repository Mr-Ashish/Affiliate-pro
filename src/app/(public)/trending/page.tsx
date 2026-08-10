import { Container } from "@/components/ui/Container";
import { ComingSoon } from "@/components/public/ComingSoon";

export const metadata = { title: "Trending" };

export default function TrendingPage() {
  return (
    <main>
      <Container>
        <ComingSoon title="Trending" />
      </Container>
    </main>
  );
}
