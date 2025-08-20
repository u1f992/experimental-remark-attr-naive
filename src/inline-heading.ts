import { isWhitespaceCharacter } from "is-whitespace-character";
import type * as mdast from "mdast";
import type * as unist from "unist";

import type { Config } from "./config.js";
import { parseAttributes, applyAttributes } from "./attribute.js";

type InlineHeading = mdast.Heading;

export function test(
  node: unist.Node,
  { enableAtxHeaderInline }: Pick<Config, "enableAtxHeaderInline">,
): node is InlineHeading {
  return node.type === "heading" && enableAtxHeaderInline;
}

export function transform(
  node: InlineHeading,
  _index: number,
  _parent: mdast.Parent,
  config: Pick<
    Config,
    "scope" | "extend" | "allowDangerousDOMEventHandlers" | "mdAttrConfig"
  >,
) {
  // Only handle ATX headings (setext headings span multiple lines)
  if (
    node.children.length === 0 ||
    (node.position && node.position.start.line !== node.position.end.line)
  ) {
    return;
  }

  const lastChild = node.children[node.children.length - 1];
  if (!lastChild || lastChild.type !== "text") {
    return;
  }

  const text = lastChild.value;
  const braceIndex = text.lastIndexOf("{");
  if (braceIndex <= 0 || !text.endsWith("}")) {
    return;
  }

  const beforeBrace = text.slice(0, braceIndex);
  const attrText = text.slice(braceIndex);

  // Check for whitespace before the brace
  let whitespaceIndex = braceIndex - 1;
  while (
    whitespaceIndex >= 0 &&
    isWhitespaceCharacter(beforeBrace[whitespaceIndex]!)
  ) {
    whitespaceIndex--;
  }

  if (whitespaceIndex >= 0) {
    const attributes = parseAttributes(attrText, 0, config);
    if (attributes) {
      applyAttributes(node, attributes, config);
      lastChild.value = beforeBrace.slice(0, whitespaceIndex + 1);
    }
  }
}
