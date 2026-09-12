import DashboardLayout from "../components/layout/DashboardLayout";
import BuilderLayout from "../features/builder/BuilderLayout";
import useBuilderState from "../features/builder/hooks/useBuilderState";
import { mockKit } from "../features/builder/mock/mockKit";
import CompanyBriefSection from "../features/builder/sections/CompanyBriefSection";
import QuestionsSection from "../features/builder/sections/QuestionsSection";

export default function BuilderPage() {
  const builder = useBuilderState(mockKit);

  return (
    <BuilderLayout kit={builder.kit} dirty={builder.dirty}>
      {(section) => {
        if (section === "brief") {
          return (
            <CompanyBriefSection
              brief={builder.kit.companyBrief}
              updateBrief={builder.updateBrief}
            />
          );
        }

        if (section === "questions") {
          return <QuestionsSection {...builder} />;
        }

        return <div>Coming soon</div>;
      }}
    </BuilderLayout>
  );
}
