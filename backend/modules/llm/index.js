import { extractRequirements } from "./extractor.js";


const jd = `
We are looking for a Full Stack Engineer with:
- 2+ years of React
- Node.js and Express
- MongoDB
- AWS is preferred
- Strong communication skills
`;

const result = await extractRequirements(jd);

console.log(result);