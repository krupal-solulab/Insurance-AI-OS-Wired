import { useQuery } from "@tanstack/react-query";

import { listConnectors } from "../client";

export const useConnectors = () => useQuery({ queryKey: ["connectors"], queryFn: listConnectors });
