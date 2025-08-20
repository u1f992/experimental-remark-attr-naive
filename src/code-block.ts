import type * as mdast from "mdast";
import type * as unist from "unist";

import type { Config } from "./config.js";
import { parseAttributes, applyAttributes } from "./attribute.js";

type CodeBlock = mdast.Code;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function test(node: unist.Node, _config: Config): node is CodeBlock {
  return node.type === "code";
}

export function transform(
  node: CodeBlock,
  _index: number,
  _parent: mdast.Parent,
  config: Pick<
    Config,
    "scope" | "extend" | "allowDangerousDOMEventHandlers" | "mdAttrConfig"
  >,
) {
  if (!node.meta) {
    return;
  }

  const attributes = parseAttributes(
    node.meta.startsWith("{") ? node.meta : `{${node.meta}}`,
    0,
    config,
  );
  if (attributes) {
    applyAttributes(node, attributes, config);
  }
}
