import Knowledge from "../../models/Knowledge.js";
import Flashcard from "../../models/Flashcard.js";

import { resolveKnowledge } from "../llm/resolver.js";
import { generateFlashcards } from "../llm/flashcards.js";


export async function getFlashcardsForRequirement(requirement) {
  const topic = await resolveKnowledge(requirement);

  const result = await Knowledge.findOneAndUpdate(
    { slug: topic.slug },
    {
      $setOnInsert: {
        title: topic.title,
        category: topic.category,
        aliases: topic.aliases,
      },
    },
    {
      upsert: true,
      new: true,
      includeResultMetadata: true,
    },
  );

  const knowledge = result.value;
  const isNew = !result.lastErrorObject.updatedExisting;

  if (isNew) {
    console.log("cache miss");

    const generated = await generateFlashcards(topic);

    await Flashcard.insertMany(
      generated.cards.map((card) => ({
        knowledge_slug: topic.slug,
        front: card.front,
        back: card.back,
      })),
    );
  } else {
    console.log("cache hit");
  }

  const cards = await Flashcard.find({
    knowledge_slug: topic.slug,
  }).lean();

  return cards.map((card) => ({
    front: card.front,
    back: card.back,
    knowledge_slug: topic.slug,
    requirement_ids: [requirement.id],
  }));
}


//testing

// const connectDB = async () => {
//   try {
//     mongoose.set("strictQuery", true);

//     await mongoose.connect(process.env.MONGO_URI, {
//       dbName: "test",
//     });

//     console.log("MongoDB connected");
//   } catch (err) {
//     console.error("Failed to connect");
//     console.error(err);
//     process.exit(1);
//   }
// };

// await connectDB();

// const requirement = {
//   id: "r2",
//   text: "2+ years in React",
//   kind: "technical",
//   priority: "must",
// };
//  console.log("gpting")
//  console.log(await getFlashcardsForRequirement(requirement))
