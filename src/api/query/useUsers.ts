import { useQuery } from "@tanstack/react-query";

import { listUsers } from "../client";

export const useUsers = () => useQuery({ queryKey: ["users"], queryFn: listUsers });
