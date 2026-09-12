import BusinessIcon from "@mui/icons-material/Business";
import QuizIcon from "@mui/icons-material/Quiz";
import StyleIcon from "@mui/icons-material/Style";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AnalyticsIcon from "@mui/icons-material/Analytics";

const sections = [
  { id: "brief", label: "Company Brief", icon: BusinessIcon },
  { id: "questions", label: "Questions", icon: QuizIcon },
  { id: "flashcards", label: "Flashcards", icon: StyleIcon },
  { id: "schedule", label: "Schedule", icon: CalendarMonthIcon },
  { id: "coverage", label: "Coverage", icon: AnalyticsIcon },
];

export default function BuilderSidebar({ active, onChange }) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 border-r bg-white md:block">
        <div className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Sections
          </p>

          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  onClick={() => onChange(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    active === section.id
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon fontSize="small" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile */}
      <div className="overflow-x-auto border-b bg-white md:hidden">
        <div className="flex w-max gap-2 p-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onChange(section.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                active === section.id
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}