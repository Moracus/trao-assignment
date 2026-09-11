import { z } from "zod";




export const jobRequestSchema = z.object({
  companyUrl: z.url({message:"Invalid url"}),
  jobDescription: z.string()
  .trim()
  .min(50, "Job description must be atleast 50 letters")
  .max(15000,"Max 15000 letters are allowed"),
  dayaAvailable: z.int().min(1,"you atleast should have one day remaing")

});
