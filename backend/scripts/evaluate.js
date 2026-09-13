import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { buildKit } from "../modules/pipeline/buildkits.js";


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

const isUsableKit = (kit) => {
  if (!kit || typeof kit !== "object") return false;

  const hasRequiredSections =
    kit.source &&
    typeof kit.source.company_url === "string" &&
    kit.role &&
    Array.isArray(kit.role.requirements) &&
    kit.company_brief &&
    typeof kit.company_brief.what_they_do === "string" &&
    Array.isArray(kit.schedule?.days);

  return Boolean(hasRequiredSections);
};

async function main() {
  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI is not set; continuing without DB connectivity for pure buildKit evaluation");
  }

  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
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

      const usable = isUsableKit(kit);

      kits.push({
        id: c.id,
        status: usable ? "ok" : "failed",
        kit: usable ? kit : null,
        error: usable ? null : {
          code: "KIT_NOT_USABLE",
          message: "The generator could not produce a usable kit shell for this case.",
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

  if (process.env.MONGO_URI) {
    await mongoose.disconnect();
  }

  console.log(`Generated ${kits.length} kits → ${outputPath}`);
}

main().catch(async (err) => {
  console.error(err);
  if (process.env.MONGO_URI) {
    await mongoose.disconnect();
  }
  process.exit(1);
});