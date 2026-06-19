import { customAlphabet } from "nanoid";

/** Shareable handoff identifier — does not grant access by itself. */
export function generateCaseHash(): string {
  const id = customAlphabet("0123456789ABCDEFGHJKMNPQRSTVWXYZ", 12);
  return `GETT-${id()}`;
}
