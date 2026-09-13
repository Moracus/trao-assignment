import {
  WorkspacesOutlined,
  LogoutRounded,
  AccountCircleRounded,
  MenuRounded,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const {signOut} = useAuth()
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 hover:bg-surface md:hidden"
          >
            <MenuRounded fontSize="small" />
          </button>

          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-accent p-2 text-bg">
              <WorkspacesOutlined fontSize="small" />
            </div>
            <span className="text-lg font-bold tracking-tight">intraowow</span>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="h-10 w-72 rounded-xl border border-border bg-surface px-4 text-sm text-muted flex items-center">
            Search (coming soon)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-xl p-2 hover:bg-surface">
            <AccountCircleRounded />
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-2" onClick={signOut}>
            <LogoutRounded fontSize="small" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}