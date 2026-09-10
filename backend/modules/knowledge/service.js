import Knowledge from "../../models/Knowledge.js";
import Flashcard from "../../models/Flashcard.js";
import { generateFlashcards } from "../llm/flashcards.js";

export async function getFlashcardsForRequirement(requirement) {
  // 1. Try exact slug via aliases
  const existing = await Knowledge.findOne({
    $or: [
      { title: new RegExp(`^${requirement.text}$`, "i") },
      { aliases: requirement.text.toLowerCase() },
      { slug: requirement.text.toLowerCase().replace(/\s+/g, "-") },
    ],
  });

  if (existing) {
    console.log("cahche-hit")
    const cards = await Flashcard.find({
      knowledge_slug: existing.slug,
    }).lean();

    return cards.map((card) => ({
      front: card.front,
      back: card.back,
      knowledge_slug: existing.slug,
      requirement_ids: [requirement.id],
    }));
  }
  console.log("cache miss")

  // 2. Generate new knowledge
  const generated = await generateFlashcards(requirement);

  await Knowledge.create({
    slug: generated.slug,
    title: generated.title,
    category: generated.category,
    aliases: generated.aliases,
  });

  await Flashcard.insertMany(
    generated.cards.map((card) => ({
      knowledge_slug: generated.slug,
      front: card.front,
      back: card.back,
    }))
  );

  return generated.cards.map((card) => ({
    front: card.front,
    back: card.back,
    knowledge_slug: generated.slug,
    requirement_ids: [requirement.id],
  }));
}

const requirement = 
  {
    id: "r1",
    text: "React",
    kind: "technical",
    priority: "must",
  }

console.log("gpting")
console.log(await getFlashcardsForRequirement(requirement))