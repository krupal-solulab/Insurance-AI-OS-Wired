import { useQuery } from "@tanstack/react-query";

import { listWorkflows } from "../client";

export const useWorkflows = () => useQuery({ queryKey: ["workflows"], queryFn: listWorkflows });
