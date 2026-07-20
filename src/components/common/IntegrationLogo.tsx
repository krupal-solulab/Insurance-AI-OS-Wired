import { useState } from "react";

import { initials, logoUrl } from "../../lib/catalog";
import { cn } from "../../lib/utils";

// Renders an integration's brand logo from the Clearbit CDN, falling back to a
// tidy monogram tile when the logo can't be fetched (offline, unknown domain).
export function IntegrationLogo({
  name,
  domain,
  logo,
  className,
}: {
  name: string;
  domain?: string;
  logo?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  const src = logo ?? (domain ? logoUrl(domain) : undefined);

  if (!src || failed) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-lg bg-secondary text-[13px] font-semibold text-muted-foreground",
          className,
        )}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5",
        className,
      )}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-4/5 w-4/5 object-contain"
      />
    </span>
  );
}
