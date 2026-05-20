/**
 * AccessDenied — Shown when a user lacks the required role for a page.
 */
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface AccessDeniedProps {
  requiredRole?: string;
  message?: string;
}

export default function AccessDenied({ requiredRole, message }: AccessDeniedProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-concrete gap-4 px-4 text-center">
      <div className="p-4 rounded-full bg-red-100 border border-red-200">
        <ShieldX className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="text-2xl font-[Oswald] uppercase text-navy-deep">Access Denied</h1>
      <p className="text-muted-foreground max-w-sm">
        {message ||
          `You don't have permission to view this page.${
            requiredRole ? ` This area requires ${requiredRole} access.` : ""
          }`}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setLocation("/admin")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Admin Dashboard
        </Button>
        <Button variant="outline" onClick={() => setLocation("/")}>
          Back to Site
        </Button>
      </div>
    </div>
  );
}
