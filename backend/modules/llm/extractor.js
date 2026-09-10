import { z } from "zod";
import { openai, MODEL } from "./openai.js";
import { withRetry } from "./retry.js";

const RequirementSchema = z.object({
  text: z.string().min(2),
  kind: z.enum(["technical", "experience", "education", "soft-skill"]),
  priority: z.enum(["must", "should", "nice"]),
});

const RoleSchema = z.object({
  title: z.string(),
  seniority: z.enum([
    "Intern",
    "Junior",
    "Mid",
    "Senior",
    "Lead",
    "Staff",
    "Principal",
    "Unknown",
  ]),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema),
});

const JSON_SCHEMA = {
  name: "role_extraction",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      seniority: {
        type: "string",
        enum: [
          "Intern",
          "Junior",
          "Mid",
          "Senior",
          "Lead",
          "Staff",
          "Principal",
          "Unknown",
        ],
      },
      responsibilities: {
        type: "array",
        items: { type: "string" },
      },
      requirements: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            kind: {
              type: "string",
              enum: ["technical", "experience", "education", "soft-skill"],
            },
            priority: {
              type: "string",
              enum: ["must", "should", "nice"],
            },
          },
          required: ["text", "kind", "priority"],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "seniority", "responsibilities", "requirements"],
    additionalProperties: false,
  },
};

export async function extractRole(jobDescription) {
  const result = await withRetry(async () => {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: `
You extract ONLY role information from a software engineering job description.

Rules:
- Extract the job title.
- Infer seniority only from the JD.
- List concise responsibilities.
- Extract explicit requirements only.
- Do not include company information.
- Do not create IDs.
- Do not generate interview questions.
          `.trim(),
        },
        {
          role: "user",
          content: jobDescription,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...JSON_SCHEMA,
        },
      },
    });

    return RoleSchema.parse(JSON.parse(response.output_text));
  });

  return result;
}

// let jobDescription ="##  job\n\n**About Writesonic**\n\nEvery day, millions turn to AI for answers—and if your brand isn't there, you're nowhere. Writesonic is leading the way with the world's most advanced AI and Generative Engine Optimization (GEO) platform, helping monitor and improve visibility across AI search engines like ChatGPT, Claude, Perplexity, and Google AI Overviews.\n\nTrusted by marketers worldwide, Writesonic unifies GEO insights with traditional SEO—helping businesses understand how AI sees their brand and giving them the tools to fix it fast.\n\n**Requirements**\n\n**🚀 We're Hiring: Full Stack Developer**\n\nAre you passionate about building fast, scalable, and beautifully crafted products? Do you thrive in high-ownership roles and love the adrenaline of shipping great features at lightning speed?\n\nWe're looking for a sharp, motivated Full Stack Developer who enjoys solving real-world problems with code and is excited to build products that scale. If you're someone with a strong frontend focus, but confident across the full stack—and you care deeply about clean code and great UX—we'd love to chat.\n\n***🌟 We're especially excited to meet folks from Tier 1 engineering colleges (IITs, BITS, IIITs, NITs) or those who have worked at Y Combinator-backed startups.***\n\n**What You'll Be Doing** 🛠 Build and maintain high-performance, user-centric web apps using TypeScript, React/Next.js, and Python. 🤝 Collaborate with design, product, and backend teams to ship features end-to-end. 🎯 Translate UI/UX designs into responsive, pixel-perfect code. 🚀 Optimize applications for speed, performance, and scalability. 🔍 Debug, test, and fix bugs across the stack—ensuring a seamless user experience. 📈 Stay current with the latest in frontend/backend trends, tools, and best practices.\n\n**What We're Looking For**\n\n- 1-3 years of professional experience in full stack development (with a strong frontend bias)\n- Solid command of TypeScript and React/Next.js is a must\n- Strong understanding of HTML5, CSS3, and responsive design\n- Working knowledge of Python and backend logic\n- Experience integrating RESTful APIs\n- Familiar with auth frameworks like JWT\n- Natural problem-solver with a knack of debugging and optimization\n- Clear communicator—both in code and in conversation\n\n\n\n**Why You'll Love Working With Us** 💰 Competitive salary + performance-based opportunities. 🔁 Potential to **earn up to 1.5x your monthly pay as overtime**—we believe in rewarding hustle and commitment. ⚙️ Work alongside some of the **best engineering minds—learn fast, grow faster.** 🚀 We're a team that ships fast, and you'll gain hands-on exposure from day one. 🏝 **Flexible hours and remote-first culture.** 🎯 High-impact role with complete ownership and autonomy.\n\nWe're a small, fast-moving team that values raw talent, intellectual rigor, and execution speed. We're building a team of top-tier problem-solvers and creators—if you're from a Tier 1 CS/ECE program or have worked at a YC-backed company, you'll feel right at home.\n\nwrite a cover letter for this jd"
// console.log("gpting...")
// const res = await extractRole(jobDescription)
// console.log(res)
