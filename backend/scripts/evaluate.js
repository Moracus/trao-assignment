import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { buildKit } from "../modules/pipeline/buildkits.js";
import { AppendixASchema } from "../zod/appendixKit.schema.js";


dotenv.config();

const args = process.argv.slice(2);

const inputIndex = args.indexOf("--input");
const outputIndex = args.indexOf("--output");

if (inputIndex === -1 || outputIndex === -1) {
  console.error(
    "Usage: npm run evaluate -- --input cases.json --output kits.json"
  );
  process.exit(1);
}

const inputPath = path.resolve(args[inputIndex + 1]);
const outputPath = path.resolve(args[outputIndex + 1]);
const useDatabase = process.env.EVALUATE_WITH_DB === "true";

const validateAppendixKit = (kit) => AppendixASchema.safeParse(kit);

async function main() {
  if (useDatabase && process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
  } else {
    console.warn("Running batch evaluation without MongoDB (set EVALUATE_WITH_DB=true to opt in).");
  }

  const cases = JSON.parse(await fs.readFile(inputPath, "utf8"));

  const kits = [];

  for (const c of cases) {
    try {
      const kit = await buildKit({
        companyUrl: c.company_url,
        jobDescription: c.jd,
        daysAvailable: c.days,
      });

      const validation = validateAppendixKit(kit);

      kits.push({
        id: c.id,
        status: validation.success ? "ok" : "failed",
        // Preserve explicitly supported pipeline extensions (for example,
        // retrievalWarnings) while requiring the complete Appendix A core.
        kit: validation.success ? kit : null,
        error: validation.success ? null : {
          code: "KIT_SCHEMA_INVALID",
          message: "The generator did not produce the required Appendix A kit structure.",
        },
      });
    } catch (err) {
      kits.push({
        id: c.id,
        status: "failed",
        kit: null,
        error: {
          code: err?.code || "KIT_GENERATION_FAILED",
          message: err?.message || "Unknown kit generation error",
        },
      });
    }
  }

  const output = {
    version: "1.0",
    generated_at: new Date().toISOString(),
    kits,
  };

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));

  if (useDatabase && mongoose.connection.readyState) {
    await mongoose.disconnect();
  }

  console.log(`Generated ${kits.length} kits → ${outputPath}`);
}

main().catch(async (err) => {
  console.error(err);
  if (useDatabase && mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
