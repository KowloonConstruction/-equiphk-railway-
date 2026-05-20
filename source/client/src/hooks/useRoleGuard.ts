/**
 * useRoleGuard — Role-based access control hook for admin pages.
 *
 * Roles:
 *   admin     — Full access to everything
 *   manager   — Rental orders, member verification, HKID review, order status
 *   warehouse — Inventory only (add/edit equipment, availability, categories)
 *   user      — No admin access
 */
import { useAuth } from "@/_core/hooks/useAuth";

export type StaffRole = "admin" | "manager" | "warehouse";

/** Returns true if the current user has at least one of the given roles */
export function useHasRole(...roles: StaffRole[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return roles.includes(user.role as StaffRole);
}

/** Returns the current user's role or null */
export function useMyRole(): StaffRole | "user" | null {
  const { user } = useAuth();
  if (!user) return null;
  return user.role as StaffRole | "user";
}

/** Convenience: is the current user any kind of staff? */
export function useIsStaff(): boolean {
  return useHasRole("admin", "manager", "warehouse");
}

/** Convenience: can the user access inventory management? */
export function useCanManageInventory(): boolean {
  return useHasRole("admin", "warehouse");
}

/** Convenience: can the user access orders and members? */
export function useCanManageOrders(): boolean {
  return useHasRole("admin", "manager");
}

/** Convenience: is the user a full admin? */
export function useIsAdmin(): boolean {
  return useHasRole("admin");
}
