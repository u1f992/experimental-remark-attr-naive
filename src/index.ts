import type * as mdast from "mdast";
import type unified from "unified";
import type * as unist from "unist";
import { visit } from "unist-util-visit";

import type { Config } from "./config.js";
export type { Config } from "./config.js";
import * as blockHeading from "./block-heading.js";
import * as inlineHeading from "./inline-heading.js";
import * as inlineContent from "./inline-content.js";
import * as codeBlock from "./code-block.js";

export const SUPPORTED_ELEMENTS = new Set([
  "link",
  "heading",
  "strong",
  "emphasis",
  "delete",
  "inlineCode",
  "code",
  "linkReference",
  "image",
  "footnoteReference",
  "footnoteCall",
] as const);

const remarkAttr: unified.Plugin<[Readonly<Partial<Config>>?]> = (
  userConfig: Readonly<Partial<Config>> = {},
) => {
  const defaultConfig: Readonly<Config> = {
    allowDangerousDOMEventHandlers: false,
    elements: SUPPORTED_ELEMENTS,
    extend: {},
    scope: "extended",
    mdAttrConfig: undefined,
    enableAtxHeaderInline: true,
    disableBlockElements: false,
  };
  const config: Readonly<Config> = { ...defaultConfig, ...userConfig };

  return (tree: unist.Node) => {
    visit(tree as mdast.Root, (node, index, parent) => {
      // Skip root node
      if (typeof index !== "number" || parent === null) {
        return;
      }
      // Handle paragraphs that start with a leading space
      if (
        node.type === "paragraph" &&
        node.position &&
        node.position.start.column > 1
      ) {
        // Check if the first child is not a text node, meaning the leading space was lost
        if (node.children.length > 0 && node.children[0]?.type !== "text") {
          // Inject a leading space text node
          node.children.unshift({
            type: "text",
            value: " ",
          });
        }
      }

      if (
        !(
          new Set(config.elements).has(node.type) &&
          (SUPPORTED_ELEMENTS as Set<string>).has(node.type)
        )
      ) {
        return;
      }

      for (const { test, transform } of [
        blockHeading,
        inlineHeading,
        inlineContent,
        codeBlock,
      ] as const) {
        if (test(node, config)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transform(node as any, index, parent, config);
        }
      }
    });
  };
};

export default remarkAttr;
