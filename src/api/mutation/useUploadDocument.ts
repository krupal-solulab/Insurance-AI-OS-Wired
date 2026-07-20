import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadDocument } from "../client";

export const useUploadDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
};
