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

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const cases = JSON.parse(await fs.readFile(inputPath, "utf8"));

  const kits = [];

  for (const c of cases) {
    try {
      const kit = await buildKit({
        companyUrl: c.company_url,
        jobDescription: c.jd,
        daysAvailable: c.days,
      });

      kits.push({
        id: c.id,
        status: "ok",
        kit,
        error: null,
      });
    } catch (err) {
      kits.push({
        id: c.id,
        status: "failed",
        kit: null,
        error: {
          code: err.code || "KIT_GENERATION_FAILED",
          message: err.message,
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

  await mongoose.disconnect();

  console.log(`Generated ${kits.length} kits → ${outputPath}`);
}

main().catch(async err => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});