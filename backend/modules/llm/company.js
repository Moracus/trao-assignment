import { z } from "zod";
import { openai, MODEL } from "./openai.js";
import { withRetry } from "./retry.js";

const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
});

const JSON_SCHEMA = {
  name: "company_brief",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: { type: "string" },
      what_they_do: { type: "string" },
    },
    required: ["summary", "what_they_do"],
    additionalProperties: false,
  },
};

function buildContext(pages) {
  return pages
    .map(
      (page) => `
### ${page.type.toUpperCase()}
Title: ${page.title ?? "Untitled"}
URL: ${page.url}

${page.text}
`,
    )
    .join("\n\n");
}

export async function generateCompanyBrief(pages) {
  const context = buildContext(pages);

  return withRetry(async () => {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: `
You summarize companies using ONLY the provided webpage text.

Rules:
- Do not invent facts.
- Do not mention technologies unless explicitly stated.
- Do not infer hiring practices.
- If information is missing, keep the summary general.
- Produce exactly the requested JSON.
          `.trim(),
        },
        {
          role: "user",
          content: context,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...JSON_SCHEMA,
        },
      },
    });

    return CompanyBriefSchema.parse(JSON.parse(response.output_text));
  });
}

let pages = [
  {
    type: "homepage",
    url: "https://posthog.com/",
    title: "PostHog – We make your product self-driving",
    text: 'ProductsPricingDocsCommunityCompanyMoreGet started – freeMake your product self-drivingPostHog already has your analytics and errors. Now it ships code to help you build a better product.Join 500,000+ teams already shipping with PostHog.Built-in tools for your agents:Product AnalyticsWeb AnalyticsSession ReplayFeature FlagsExperimentsSurveysError TrackingManaged warehouseCDPWorkflowsLogsAI ObservabilityEndpointsInboxTracesHeatmapsReplay VisionNo-code A/B TestingProduct AnalyticsWeb AnalyticsSession ReplayFeature FlagsExperimentsSurveysError TrackingManaged warehouseCDPWorkflowsLogsAI ObservabilityEndpointsInboxTracesHeatmapsReplay VisionNo-code A/B TestingSocial proofYes they actually use us, no it\'s not just some random engineer who tried us out 2+ years ago.Colorful logos"Sleek" logosOpen CustomersAll your data, working togetherBuilt-in, the context warehouse ships with:A data warehouse 120+ sources/destinationsSQL editor + BI + data vizUser activity feed (CDP-lite)API, webhooksWhether you\'re analyzing customer usage or directing AI, you should be operating with the full context. Combine everything in PostHog\'s context warehouse so that you, your agents, and your dashboard can query it directly. That includes: Data from 120+ external sources like Stripe, Postgres, and HubSpot Insights from every other PostHog tool like Session Replays and Experiments The data your agents need to make good decisions is already here. Ready to turn "tell me what happened" into "here\'s what to fix next."Connect your first data sourceUsage-based pricingOur whole philosophy is that you shouldn\'t have to worry about pricing. All our paid products are pay-per-use with generous monthly free tiers. In fact, 98% of our customers use PostHog for free. We aim to match the cheapest option at scale – PostHog should be a no-brainer. You never have to "jump on a quick call" with sales. Here are some examples of how we charge for most popular products:1.Product AnalyticsFree tier: 1 million events/moPricing: $0.00005/event2.Session ReplayFree tier: 5,000 recordings/moPricing: $0.005/recording3.Feature FlagsFree tier: 1 million requests/moPricing: $0.0001/request4.Managed warehouseFree tier: 1 million rows/moPricing: $0.000015/rowProductFree tierPricing (decreases with volume)1Product Analytics1 million events/mo$0.00005/event2Session Replay5,000 recordings/mo$0.005/recording3Feature Flags1 million requests/mo$0.0001/request4Managed warehouse1 million rows/mo$0.000015/rowExplore pricingWhy PostHog?We\'re different from most companies for a bunch of reasons: Transparency. You can read our company handbook, our sales manual, and company strategy. We ship fast. See our changelog. Actually-technical support. Our support folks all have engineering backgrounds.Read more about usBedtime readingStill here? We\'ve got some links that may be mildly interesting to you: demo.mov Technical docs API Ask a question Small teams at PostHog Shameless CTAIf nothing else has sold you on PostHog, hopef',
  },
  {
    type: "about",
    url: "https://posthog.com/about",
    title: "About PostHog",
    text: "ProductsPricingDocsCommunityCompanyMoreGet started – freeFrom the desk ofFrom the desk ofJames HawkinsCo-founderjames406There are other AI companies, but they not like us We're here to help make your product self-drivingLiterally every piece of software that a product engineer needs.This includes agents and tools for building products, talking to customers, and making sense of all your customer data.PostHog is a single platform for people who build things.Explore product suiteSo how did we get here?James HawkinsCo-CEOTim GlaserCo-CEOPostHog was hatched in Y Combinator's W20 batch.We launched on Hacker News with our MVP in 2020 – just 4 weeks after we started writing code. The response was overwhelmingly positive.Since then, we've grown far beyond analytics – into an entire product & data toolkit – used by 500,000+ teams.But our approach to building PostHog is very different.Read our storyWhy we're differentWarning: If you like the way most companies treat you, you might not like us. See 15 reasons why PostHog might be wrong for you.We're building the company we've always wanted to work for. This means rejecting all the annoying parts of the SaaS industry that have somehow become industry-standard.If it gives you the ick, you know it gives us the ick too.You can sum it up our ideology with this: we try to treat you how we'd want to be treated.We just do the right thingTNTLDR Founders NewsletterJune 18, 2025PostHog vs. The IndustryPostHog [breaks] every SaaS rule:Open source productsGenerous free tiersInbound-led salesPrice cuts instead of increasesProtection against viral usage spikesWhile Salesforce hikes prices 6% annually, PostHog proves there's room for startups that do the exact opposite of what private equity-backed software companies typically do.The TLDR newsletter highlighted an article that covered some of the key things that make us different. Here are a few more they missed:No loss leaders. We don't sell products at a loss - we run the company default alive. This means we've never had layoffs, and we don't take huge risks that could result in the company disappearing overnight.No sleazy renewal tactics. We don't screw you on contract terms like auto-renewal. And while most companies will try to increase your prices every year, you won't find that here.Use it without talking to us. You can use all our stuff monthly until you want to lock things in with us. We don't pressure people.Actually technical support. We don't offshore our support. In fact, the entire Support TeamSupport Team has engineering backgrounds!Here for the long haul. We have zero intention of selling our business. We want to see just how crazy huge this gigantic software stack can get - and we think that it will reach at least $100bn in value. We'll be around and fighting for a long, long time. It's our life's work.Honest communication. Even in our content, it's more honest and not like the marketing-speak you've come to expect from other companies. It actively helps de",
  },
  {
    type: "handbook",
    url: "https://posthog.com/handbook",
    title: "Handbook - PostHog",
    text: "ProductsPricingDocsCommunityCompanyMoreGet started – freeThe Book of PostHogTable of contentsChaptersWorking hereHow we workTools & processesPeople opsPay & perksHiringResourcesBlitzscaleBrandContentEngineeringGrowthMarketingPeople & OpsProductRevOpsSales, CS & OnboardingSupportWebsiteWizard & DocsCompany handbookThis handbook simply explains how we work. It is one of the most important things we've ever made.ChaptersWhy does PostHog exist?1How we got here2How we get users3Who we are building for4How we make users happy5How we make money6Enduringly low prices7Deciding which products to build8A wide company with small teams9How we're building a world-class team10What we value11Providing a world-class engineering environment12Not running out of money13Where are we going?14How you can help15",
  },
  {
    type: "handbook",
    url: "https://posthog.com/handbook/why-does-posthog-exist",
    title:
      "Why does PostHog exist? Our mission and strategy - Handbook - PostHog",
    text: "ProductsPricingDocsCommunityCompanyMoreGet started – freeThe Book of PostHogTable of contentsChapters1. Why does PostHog exist?2. How we got here3. How we get users4. Who we are building for5. How we make users happy6. How we make money7. Enduringly low prices8. Deciding which products to build9. A wide company with small teams10. How we're building a world-class team11. What we value12. Providing a world-class engineering environment13. Not running out of money14. Where are we going?15. How you can helpWorking hereHow we workTools & processesPeople opsPay & perksHiringResourcesBlitzscaleBrandContentEngineeringGrowthMarketingPeople & OpsProductRevOpsSales, CS & OnboardingSupportWebsiteWizard & DocsCopy pageWhy does PostHog exist? Our mission and strategyContentsOur missionWhy is that our mission?Our strategy1. Be the source of truth for all product context2. Provide every tool engineers need to build successful products3. Get in first4. Automate the iteration processSecret master planOur missionEquip every developer to build successful products.Why is that our mission?Since the beginning, we've believed that engineers should be way more involved in making product decisions than they've been historically. In order to help them do that, we've built a collection of tools for engineers. Similar tools to the ones we've built have existed for a long time, but they were always built with other users in mind. By building things like product analytics, session replays, feature flags and a data warehouse for engineers first, we give engineers the ability to make product decisions themselves. This massively increases the speed at which engineers can make good decisions.The other way PostHog helps engineers is by combining all the tools they need into one product. This avoids a ton of work integrating and linking up various products, both when integrating and ongoingly.We try to help engineers from the very beginning, when their product is just being built. We do that by having generous free tiers, and no need to talk to sales to get started.Our strategy1. Be the source of truth for all product contextBuilding a successful product is hard; doing so when you don't understand your customers is even harder. It's wild that no one has already provided a complete record of everything engineers need to ship products. This has happened because the entire industry has focused on integration instead of consolidation.Traditionally, as companies scale, their data warehouse becomes the source of truth, and non-warehouse native tools (like product analytics) become less relevant as engineers lose trust in the data they collect, simply because they are misused and divorced from the source of truth. Every company winds up with a huge mess of data spaghetti, with their business logic still spread across dozens or hundreds of tools.We provide developer infrastructure - by providing every tool engineers need in one place, we can:Enhance the utility of all the tools when used t",
  },
  {
    type: "handbook",
    url: "https://posthog.com/handbook/growth/sales/overview",
    title: "Overview - Handbook - PostHog",
    text: "ProductsPricingDocsCommunityCompanyMoreGet started – freeThe Book of PostHogTable of contentsChaptersWorking hereHow we workTools & processesPeople opsPay & perksHiringResourcesBlitzscaleBrandContentEngineeringGrowthMarketingPeople & OpsProductRevOpsSales, CS & OnboardingOverviewAccounts overviewOverviewCSM and TAM dual coverageTeam leadsWho we do business withNew businessProduct-led salesCustomer SuccessForward deployed engineeringShareable guidesOnboardingUse-case sellingCross-sellingAccount managementContracts & billingTools & systemsEnablement & resourcesGTM engineeringSupportWebsiteWizard & DocsCopy pageOverviewContentsOur teamsOur visionThings we want to be great atThings we're interested in trying outThings we don't want to spend time onHow to work with different types of customer'Enterprise' customersWho we areStaying current with what we shipOur primary focus is on making our paying customers successful, not forcing sales through. This mostly means an inbound sales model, but we are also running some outbound sales experiments.While this means working with a smaller number of users than typical B2B SaaS companies, we know that the people we talk to are mostly already pre-qualified and genuinely interested in potentially using PostHog. Our teams act as genuine partners with our users. We should feel as motivated to help and delight users as if we were on their team. In practical terms, this means:No BS sales-y talk - we are direct, open and honest with customers. We share as much as possible publicly, rather than hiding it behind a mandatory demo call. We are honest when we don't know the answer, or if we're not sure that PostHog is the right solution for a customer.Speed - we are weirdly responsive. If a customer is in a rush, we do our best to work at their pace. We are clear about expectations, and do not promise what we cannot deliver to close a deal. Engineers helping engineers - there is nothing more frustrating than talking to a salesperson who can't give you all the answers. We keep 'let me find out from the team' to an absolute minimum.Being power users of PostHog is a must - otherwise we won't be credible. PostHog is a big and growing platform, so this is a challenge to stay on top of!We prioritize getting people set up on multiple products as early as is feasible, as this makes PostHog far more valuable to them and increases our chances of retaining them.We don't do margin negative deals in order to win - this doesn't set us up for a successful long term relationship with a paying customer if we're ultimately losing money to land them. Yes, this includes fancy companies whose logos would make us look good. Our teamsWe're not one big Sales team. We're several small teams, each owning a different part of the customer journey:New Business Sales – our Technical Account Executives (TAEs) own initial inbound contact and make it easy for users to become paying customers. Our business development representatives (BDRs) sit here too, ru",
  },
  {
    type: "page",
    url: "https://posthog.com/product-analytics",
    title: "Product Analytics – Understand your product with PostHog",
    text: "ProductsPricingDocsCommunityCompanyMoreGet started – freeProduct AnalyticsProductPricingDocsProduct AnalyticsProduct analytics with autocaptureProduct Analytics is one of the tools that makes your product self-driving: the measurement agents use to see what works. Built to natively work with session replay, feature flags, experiments, and surveys.Get started - freeInstall with AIInstall with AI in a single promptPaste into your terminal or code editor and make AI do the work.npx @posthog/wizardLearn moreMCP•Watch a demo•Talk to a humanWhat does it do?Product Analytics turns what people do in your product into answers you can act on. Autocapture tracks pageviews, clicks, and form submissions without extra code. From there you build trends, funnels, retention curves, paths, and SQL queries – then jump straight into the session recordings behind any data point when you need the 'why'.Who is it for?Product Analytics is used across teams depending on your role.RoleUse casesProduct EngineersCheck whether what you shipped is being used – and fix drop-off before the next releaseProduct ManagersDig into funnels, retention, and paths to guide roadmap decisions with real usage dataGrowth EngineersFind conversion leaks, measure experiments, and track activation end to endFoundersMonitor KPIs on a shared dashboard without waiting on a data teamSupport EngineersPull the events behind a customer report and jump into the matching session replayHow do I use it?There are a few ways to explore Product Analytics.Editor / MCPInsightsDashboardsQuery product data without leaving your editorQuery trends, funnels, retention, and usage metrics from Cursor, Claude Code, VS Code, or any MCP-compatible agent.Query any metric from your editorPull trends, funnels, retention, paths, or custom SQL without switching to a dashboard.Investigate metric changesConnect drops or spikes in user behavior to recent code changes.Save and share what you findTurn a query into a saved insight and add it to a PostHog dashboard.Ship with more contextGround your next PR in actual usage data instead of assumptions.Install the PostHog MCPLearn morenpx @posthog/wizard mcp addSupports Next.js, React, Python, and 24 moreClaudeCursorVS CodeWindsurfCodexZedLovableReplitv0Top featuresFunnelsTrendsRetentionSQLMCPMCP AnalyticsFind drop-off across a series of actionsFind where people drop off across a series of actions – then jump from any step into the matching session recordings.FilteringSet filters for individual steps – or the entire funnel – by person property, group or cohort, or event propertyGraph typesTrack user progression between steps, conversion time between each step, and how a funnel's conversion rate changes over timeStep orderingChoose between a sequential series of steps, a strict order, or any order of steps that lead to conversionCorrelation AnalysisAutomatically identify significant factors that impact user behavior and conversion rates.AI promptsAsk PostHog AI to answer product questi",
  },
];

// console.log("gpting..")
// const res = await generateCompanyBrief(pages);
// console.log(res)
