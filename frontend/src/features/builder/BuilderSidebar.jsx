import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BusinessIcon from "@mui/icons-material/Business";
import QuizIcon from "@mui/icons-material/Quiz";
import StyleIcon from "@mui/icons-material/Style";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

const sections = [
  { id: "brief", label: "Company Brief", icon: BusinessIcon },
  { id: "questions", label: "Questions", icon: QuizIcon },
  { id: "flashcards", label: "Flashcards", icon: StyleIcon },
  { id: "schedule", label: "Schedule", icon: CalendarMonthIcon },
  { id: "coverage", label: "Coverage", icon: AnalyticsIcon },
];

export default function BuilderSidebar({ active, onChange, kitId }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const resolvedKitId = kitId ?? params?.kitId;

  const handleSectionChange = (sectionId) => {
    onChange(sectionId);
    setMobileOpen(false);
  };

  const goToPractice = () => {
    if (!resolvedKitId) return;
    navigate(`/builder/${resolvedKitId}/practice`);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sections</p>

          <button
            type="button"
            className="rounded-lg p-1 text-slate-500 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sections menu"
          >
            <CloseRoundedIcon fontSize="small" />
          </button>
        </div>

        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
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

      <div className="mt-auto border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={goToPractice}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <AutoAwesomeRoundedIcon fontSize="small" />
          Practice mode
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">{sidebarContent}</aside>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="flex w-full items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700"
          aria-expanded={mobileOpen}
          aria-label="Toggle sections menu"
        >
          <span>Sections</span>
          <MenuRoundedIcon fontSize="small" />
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-30 bg-slate-900/25" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-x-0 bottom-0 max-h-[72vh] overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="max-h-[72vh] overflow-y-auto">{sidebarContent}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}