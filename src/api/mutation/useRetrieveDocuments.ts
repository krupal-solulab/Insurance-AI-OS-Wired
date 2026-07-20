import { useMutation } from "@tanstack/react-query";

import { retrieve } from "../client";

/** On-demand knowledge search (not cached — driven by the search box). */
export const useRetrieveDocuments = (topK = 8) =>
  useMutation({ mutationFn: (query: string) => retrieve(query, topK) });
