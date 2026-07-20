import { useQuery } from "@tanstack/react-query";

import { systemHealth } from "../client";

export const useSystemHealth = () => useQuery({ queryKey: ["health"], queryFn: systemHealth });
