import Hero from "@/components/home/Hero";
import CategorySection from "@/components/home/CategorySection";
import FeaturedGames from "@/components/home/FeaturedGames";
import CreateGameCTA from "@/components/home/CreateGameCTA";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <CategorySection />
      <FeaturedGames />
      <CreateGameCTA />
    </main>
  );
}
