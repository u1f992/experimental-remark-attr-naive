import type * as mdast from "mdast";
import type * as unist from "unist";

import type { Config } from "./config.js";
import { parseAttributes, applyAttributes } from "./attribute.js";

type BlockHeading = mdast.Heading;

export function test(
  node: unist.Node,
  { disableBlockElements }: Pick<Config, "disableBlockElements">,
): node is BlockHeading {
  return node.type === "heading" && !disableBlockElements;
}

export function transform(
  node: BlockHeading,
  index: number,
  parent: mdast.Parent,
  config: Pick<
    Config,
    "scope" | "extend" | "allowDangerousDOMEventHandlers" | "mdAttrConfig"
  >,
) {
  const nextSibling = parent.children[index + 1];
  if (
    nextSibling &&
    nextSibling.type === "paragraph" &&
    nextSibling.children.length === 1 &&
    nextSibling.children[0] &&
    nextSibling.children[0].type === "text"
  ) {
    const text = nextSibling.children[0].value;
    if (text.trim().startsWith("{") && text.trim().endsWith("}")) {
      const attributes = parseAttributes(text.trim(), 0, config);
      if (attributes) {
        applyAttributes(node, attributes, config);
        // Remove the attribute paragraph
        parent.children.splice(index + 1, 1);
      }
    }
  }
}
