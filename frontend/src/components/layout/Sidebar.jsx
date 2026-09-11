import {
  FolderOpenRounded,
  PendingActionsRounded,
  CheckCircleRounded,
  CloseRounded,
} from "@mui/icons-material";
import { cn } from "cn";

const items = [
  { id: "all", label: "My Kits", icon: FolderOpenRounded },
  { id: "progress", label: "In Progress", icon: PendingActionsRounded },
  { id: "completed", label: "Completed", icon: CheckCircleRounded },
];

export default function Sidebar({
  activeFilter,
  setActiveFilter,
  open,
  setOpen,
}) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 border-r border-border bg-bg p-5 transition-transform md:static md:z-auto md:h-[calc(100vh-4rem)] md:w-64 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 flex items-center justify-between md:hidden">
          <span className="text-lg font-bold">Menu</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 hover:bg-surface"
          >
            <CloseRounded fontSize="small" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Filters
          </p>

          {items.map((item) => {
            const Icon = item.icon;
            const active = activeFilter === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveFilter(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                  active
                    ? "bg-accent text-bg"
                    : "text-text hover:bg-surface"
                )}
              >
                <Icon fontSize="small" />
                {item.label}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}