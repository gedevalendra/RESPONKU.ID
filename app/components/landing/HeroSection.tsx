import { Article } from "@/lib/types";
import { publicProfile } from "@/lib/community";
import HeroCarousel from "./HeroCarousel";

export default async function HeroSection({ stories }: { stories: Article[] }) {
  const slides = await Promise.all(stories.map(async (article) => ({
    article,
    authorAvatarUrl: article.authorId
      ? (await publicProfile(article.authorId).catch(() => null))?.avatarUrl || ""
      : "",
  })));
  return <HeroCarousel stories={slides} />;
}
