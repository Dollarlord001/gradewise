import { notFound } from "next/navigation";
import { FlashcardReview } from "@/components/flashcards/FlashcardReview";

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  // const cards = await loadDeck(deckId)
  void deckId;
  notFound();
  return <FlashcardReview cards={[]} />;
}
