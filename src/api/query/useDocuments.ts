import { useQuery } from "@tanstack/react-query";

import { listDocuments } from "../client";

export const useDocuments = () => useQuery({ queryKey: ["documents"], queryFn: listDocuments });
