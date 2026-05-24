import { Link } from "@tanstack/react-router";
import { LogOut, User as UserIcon, FileBarChart2, Shield, ScrollText } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

export function UserMenu({ initial, email, role }: { initial: string; email: string; role: "admin" | "user" }) {
  const isAdmin = role === "admin";
  const onLogout = async () => {
    sessionStorage.removeItem("adminSessionStart");
    await supabase.auth.signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition border ${
            isAdmin ? "border-danger/50 bg-danger/10 hover:bg-danger/20" : "border-cyan/40 hover:bg-cyan/10"
          }`}
          aria-label="Account menu"
        >
          {isAdmin && <Shield className="h-3.5 w-3.5 text-danger" />}
          <span className={`grid place-items-center h-7 w-7 rounded-full font-display text-xs font-bold ${
            isAdmin ? "bg-danger text-white" : "bg-cyan text-[color:var(--bg-deep)]"
          }`}>{initial}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-strong border-[color:var(--border)]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-xs font-medium">{isAdmin ? "Administrator" : "Account"}</span>
            <span className="text-[11px] text-muted-foreground truncate">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin ? (
          <>
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center gap-2"><Shield className="h-4 w-4" /> Admin Panel</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center gap-2"><ScrollText className="h-4 w-4" /> Session Log</Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link to="/dashboard" className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard" className="flex items-center gap-2"><FileBarChart2 className="h-4 w-4" /> My Analyses</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-danger focus:text-danger">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
