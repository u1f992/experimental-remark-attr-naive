import type * as mdast from "mdast";
import type * as unist from "unist";

import type { Config } from "./config.js";
import { parseAttributes, applyAttributes } from "./attribute.js";

type InlineContent =
  | mdast.Link
  | mdast.Strong
  | mdast.Emphasis
  | mdast.Delete
  | mdast.InlineCode
  | mdast.LinkReference
  | mdast.Image
  | mdast.FootnoteReference;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function test(node: unist.Node, _config: Config): node is InlineContent {
  return (
    node.type === "link" ||
    node.type === "strong" ||
    node.type === "emphasis" ||
    node.type === "delete" ||
    node.type === "inlineCode" ||
    node.type === "linkReference" ||
    node.type === "image" ||
    node.type === "footnoteReference" ||
    node.type === "footnoteCall"
  );
}

export function transform(
  node: InlineContent,
  index: number,
  parent: mdast.Parent,
  config: Pick<
    Config,
    "scope" | "extend" | "allowDangerousDOMEventHandlers" | "mdAttrConfig"
  >,
) {
  // Look for the next sibling text node that might contain attributes
  const nextSibling = parent && parent.children[index + 1];
  if (nextSibling && nextSibling.type === "text") {
    const text = nextSibling.value;
    if (text.startsWith("{")) {
      // Handle normal case
      const attributes = parseAttributes(text, 0, config);
      if (attributes && attributes.eaten) {
        // Always apply attributes (filtering happens inside applyAttributes)
        applyAttributes(node, attributes, config);

        // Always consume the attribute text, regardless of whether attributes were applied
        const remainingText = text.slice(attributes.eaten.length);
        if (remainingText.length > 0) {
          nextSibling.value = remainingText;
        } else {
          // Remove the text node entirely if it's empty
          parent.children.splice(index + 1, 1);
        }

        return;
      }

      // Handle complex case where attribute contains URLs that got auto-linked
      const attrMatch = reconstructAttributeText(parent, index + 1);
      if (attrMatch) {
        const attributes = parseAttributes(attrMatch.fullText, 0, config);
        if (attributes && attributes.eaten) {
          // Always apply attributes (filtering happens inside applyAttributes)
          applyAttributes(node, attributes, config);

          // Always consume the attribute text, regardless of whether attributes were applied
          removeAttributeNodes(
            parent,
            index + 1,
            attrMatch,
            attributes.eaten.length,
          );
        }
      }
    }
  }
}

function reconstructAttributeText(parent: mdast.Parent, startIndex: number) {
  // Try to reconstruct attribute text that was split by auto-linking
  let fullText = "";
  let nodeCount = 0;
  let braceCount = 0;

  for (let i = startIndex; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (!child) {
      continue;
    }
    nodeCount++;

    if (child.type === "text") {
      fullText += child.value;
      braceCount += (child.value.match(/{/g) || []).length;
      braceCount -= (child.value.match(/}/g) || []).length;
    } else if (child.type === "link") {
      // For auto-links, use the URL itself
      fullText += child.url;
      braceCount += (child.url.match(/{/g) || []).length;
      braceCount -= (child.url.match(/}/g) || []).length;
    } else {
      // Stop if we encounter other node types
      break;
    }

    // Stop when braces are balanced (complete attribute)
    if (braceCount === 0 && fullText.endsWith("}")) {
      break;
    }

    // Safety check: don't go beyond reasonable limits
    if (nodeCount > 10) {
      break;
    }
  }

  // Validate that this looks like an attribute
  if (fullText.startsWith("{") && fullText.endsWith("}") && braceCount === 0) {
    return { fullText, nodeCount };
  }

  return null;
}

function removeAttributeNodes(
  parent: mdast.Parent,
  startIndex: number,
  attrMatch: { fullText: string; nodeCount: number },
  eatenLength: number,
) {
  // Remove nodes that contained the attribute text
  const nodesToRemove = [];
  let remainingText = "";

  // If the eaten length is less than full text, calculate remaining
  if (eatenLength < attrMatch.fullText.length) {
    remainingText = attrMatch.fullText.slice(eatenLength);
  }

  // Remove the nodes or adjust the last one
  for (let i = 0; i < attrMatch.nodeCount; i++) {
    if (i === attrMatch.nodeCount - 1 && remainingText) {
      // For the last node, if there's remaining text, update it
      const lastNode = parent.children[startIndex + i]!;
      if (lastNode.type === "text") {
        lastNode.value = remainingText;
      } else {
        // Replace link with text node
        parent.children[startIndex + i] = {
          type: "text",
          value: remainingText,
        };
      }
    } else {
      nodesToRemove.push(startIndex + i);
    }
  }

  // Remove nodes in reverse order to maintain indices
  for (let i = nodesToRemove.length - 1; i >= 0; i--) {
    parent.children.splice(nodesToRemove[i]!, 1);
  }
}
