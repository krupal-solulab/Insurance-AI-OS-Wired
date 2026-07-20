import { useQuery } from "@tanstack/react-query";

import { getRuleVersion, listRuleAudit, listRuleGroups } from "../client";

/** Rule groups across all packs, with this tenant's effective published/previous version. */
export const useRuleGroups = () =>
  useQuery({ queryKey: ["rule-groups"], queryFn: listRuleGroups });

/** A specific ruleset version (rules + params) — immutable pack data. */
export const useRuleVersion = (group: string | null, version: string | null) =>
  useQuery({
    queryKey: ["rule-version", group, version],
    queryFn: () => getRuleVersion(group as string, version as string),
    enabled: Boolean(group) && Boolean(version),
  });

/** Rule-lifecycle audit (publish/rollback), optionally filtered to one group. */
export const useRuleAudit = (group?: string) =>
  useQuery({ queryKey: ["rule-audit", group ?? "all"], queryFn: () => listRuleAudit(group) });
