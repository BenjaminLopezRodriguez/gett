import type { UserPersona } from "@/server/db/schema";

export const PERSONA_LABELS: Record<UserPersona, string> = {
  employee: "Employee",
  employer: "Employer / HR",
  lawgroup: "Law group",
  insurer: "Insurer",
};

export const PERSONA_DASHBOARD_PATHS: Record<UserPersona, string> = {
  employee: "/dashboard/employee",
  employer: "/dashboard/employer",
  lawgroup: "/dashboard/lawgroup",
  insurer: "/dashboard/insurer",
};

export function getDashboardPath(persona: UserPersona): string {
  return PERSONA_DASHBOARD_PATHS[persona];
}

export const USER_PERSONAS = [
  "employee",
  "employer",
  "lawgroup",
  "insurer",
] as const satisfies readonly UserPersona[];

export function isUserPersona(value: string): value is UserPersona {
  return (USER_PERSONAS as readonly string[]).includes(value);
}

export function defaultCaseTitle(persona: UserPersona): string | null {
  switch (persona) {
    case "employee":
      return "My leave request";
    case "employer":
      return "Organization leave cases";
    default:
      return null;
  }
}
