import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createRuleDraft,
  deleteRuleDraft,
  evaluateRuleVersion,
  publishRuleGroup,
  rollbackRuleGroup,
  updateRuleDraft,
  type RuleDraftInput,
} from "../client";

/** Publish / rollback a rule group's live version (owner/admin), then refresh the registry
 *  + audit so the console reflects the new published version immediately. */
export const useRuleGovernance = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["rule-groups"] });
    qc.invalidateQueries({ queryKey: ["rule-audit"] });
  };
  const publish = useMutation({
    mutationFn: ({ group, version }: { group: string; version: string }) =>
      publishRuleGroup(group, version),
    onSuccess: invalidate,
  });
  const rollback = useMutation({
    mutationFn: ({ group }: { group: string }) => rollbackRuleGroup(group),
    onSuccess: invalidate,
  });
  // Draft authoring (admin only — backend gates it).
  const createDraft = useMutation({
    mutationFn: ({ group, body }: { group: string; body: RuleDraftInput }) =>
      createRuleDraft(group, body),
    onSuccess: invalidate,
  });
  const updateDraft = useMutation({
    mutationFn: ({
      group,
      version,
      body,
    }: {
      group: string;
      version: string;
      body: RuleDraftInput;
    }) => updateRuleDraft(group, version, body),
    onSuccess: invalidate,
  });
  const deleteDraft = useMutation({
    mutationFn: ({ group, version }: { group: string; version: string }) =>
      deleteRuleDraft(group, version),
    onSuccess: invalidate,
  });
  return { publish, rollback, createDraft, updateDraft, deleteDraft };
};

/** Read-only dry-run of a version against facts (both roles). */
export const useEvaluateRule = () =>
  useMutation({
    mutationFn: ({
      group,
      version,
      facts,
    }: {
      group: string;
      version: string;
      facts: Record<string, unknown>;
    }) => evaluateRuleVersion(group, version, facts),
  });
