import type { Config as ParseConfig } from "md-attr-parser";

export type Config = {
  allowDangerousDOMEventHandlers: boolean;
  elements: Iterable<string>;
  extend: Record<string, string[]>;
  scope: "none" | "global" | "specific" | "extended" | "permissive" | "every";
  mdAttrConfig: ParseConfig | undefined;
  enableAtxHeaderInline: boolean;
  disableBlockElements: boolean;
};
