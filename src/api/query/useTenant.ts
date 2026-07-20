import { useQuery } from "@tanstack/react-query";

import { getTenant } from "../client";

export const useTenant = () => useQuery({ queryKey: ["tenant"], queryFn: getTenant });
