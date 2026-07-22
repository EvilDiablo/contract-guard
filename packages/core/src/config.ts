import { z } from "zod";
import type { ContractGuardConfig } from "./types.js";

const endpointSchema = z.object({
  name: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string().min(1),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
});

export const contractGuardConfigSchema = z.object({
  ignorePaths: z.array(z.string()).optional(),
  side: z.enum(["response", "request"]).optional(),
  additiveSeverity: z.enum(["info", "warning"]).optional(),
  failOn: z.enum(["breaking", "warning", "never"]).optional(),
  endpoints: z.array(endpointSchema).optional(),
  baseUrl: z.string().optional(),
});

/** @deprecated Use contractGuardConfigSchema */
export const apiDiffConfigSchema = contractGuardConfigSchema;

export function parseConfig(raw: unknown): ContractGuardConfig {
  return contractGuardConfigSchema.parse(raw) as ContractGuardConfig;
}

export function loadConfigFromJson(text: string): ContractGuardConfig {
  const raw = JSON.parse(text) as unknown;
  return parseConfig(raw);
}

/** Default config filename candidates. */
export const CONFIG_FILENAMES = [
  "contractguard.config.json",
  ".contractguardrc",
  ".contractguardrc.json",
] as const;
