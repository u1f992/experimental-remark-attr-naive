import parseAttr, { type Result as ParseResult } from "md-attr-parser";
import { htmlElementAttributes } from "html-element-attributes";

import type * as unist from "unist";

import type { Config } from "./config.js";

export function parseAttributes(
  text: string,
  startIndex: number,
  { mdAttrConfig }: Pick<Config, "mdAttrConfig">,
) {
  try {
    return parseAttr(text, startIndex, mdAttrConfig);
  } catch {
    return null;
  }
}

const DOMEventHandler = [
  "onabort",
  "onautocomplete",
  "onautocompleteerror",
  "onblur",
  "oncancel",
  "oncanplay",
  "oncanplaythrough",
  "onchange",
  "onclick",
  "onclose",
  "oncontextmenu",
  "oncuechange",
  "ondblclick",
  "ondrag",
  "ondragend",
  "ondragenter",
  "ondragexit",
  "ondragleave",
  "ondragover",
  "ondragstart",
  "ondrop",
  "ondurationchange",
  "onemptied",
  "onended",
  "onerror",
  "onfocus",
  "oninput",
  "oninvalid",
  "onkeydown",
  "onkeypress",
  "onkeyup",
  "onload",
  "onloadeddata",
  "onloadedmetadata",
  "onloadstart",
  "onmousedown",
  "onmouseenter",
  "onmouseleave",
  "onmousemove",
  "onmouseout",
  "onmouseover",
  "onmouseup",
  "onmousewheel",
  "onpause",
  "onplay",
  "onplaying",
  "onprogress",
  "onratechange",
  "onreset",
  "onresize",
  "onscroll",
  "onseeked",
  "onseeking",
  "onselect",
  "onshow",
  "onsort",
  "onstalled",
  "onsubmit",
  "onsuspend",
  "ontimeupdate",
  "ontoggle",
  "onvolumechange",
  "onwaiting",
] as const;

/* Table conversion between type and HTML tagName */
const convTypeTag: Readonly<Record<string, string>> = {
  image: "img",
  link: "a",
  heading: "h1",
  strong: "strong",
  emphasis: "em",
  delete: "s",
  inlineCode: "code",
  code: "code",
  linkReference: "a",
  "*": "*",
};

function filterAttributes(
  prop: ParseResult["prop"],
  {
    scope,
    extend,
    allowDangerousDOMEventHandlers,
  }: Pick<Config, "scope" | "extend" | "allowDangerousDOMEventHandlers">,
  type: string,
) {
  const specific = htmlElementAttributes;

  const extendTag = ((extend) => {
    const t: Record<string, string[]> = {};
    Object.getOwnPropertyNames(extend).forEach((p) => {
      if (typeof convTypeTag[p] !== "undefined" && extend[p]) {
        t[convTypeTag[p]] = extend[p];
      }
    });
    return t;
  })(extend);

  // Delete empty key/class/id attributes
  Object.getOwnPropertyNames(prop).forEach((p) => {
    if (p !== "key" && p !== "class" && p !== "id") {
      prop[p] = prop[p] || "";
    }
  });

  type InScopeFn = (p: string) => boolean;

  const isDangerous: InScopeFn = (p: string) =>
    (DOMEventHandler as readonly string[]).includes(p);
  const isSpecific: InScopeFn = (p: string) =>
    type in specific && specific[type]!.includes(p);
  const isGlobal: InScopeFn = (p: string) =>
    htmlElementAttributes["*"]!.includes(p) ||
    !!p.match(/^aria-[a-z][a-z.-_\d]*$/) ||
    !!p.match(/^data-[a-z][a-z_.-0-9]*$/);

  const or =
    (fn0: InScopeFn, fn1: InScopeFn): InScopeFn =>
    (p) =>
      fn0(p) || fn1(p);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let inScope: InScopeFn = (_) => false;

  // Respect the scope configuration
  switch (scope) {
    case "none": // Plugin is disabled
      break;
    case "permissive":
    case "every":
      if (allowDangerousDOMEventHandlers) {
        inScope = () => true;
      } else {
        inScope = (x) => !isDangerous(x);
      }

      break;
    case "extended":
    default:
      inScope = or(
        (p) => extendTag && type in extendTag && extendTag[type]!.includes(p),
        (p) => "*" in extendTag && extendTag["*"]?.includes(p),
      );
    // Or if it in the specific scope, fallthrough
    case "specific":
      inScope = or(inScope, isSpecific);
    // Or if it in the global scope fallthrough
    case "global":
      inScope = or(inScope, isGlobal);
      if (allowDangerousDOMEventHandlers) {
        // If allowed add dangerous attributes to global scope
        inScope = or(inScope, isDangerous);
      }
  }

  // If an attributes isn't in the scope, delete it
  Object.getOwnPropertyNames(prop).forEach((p) => {
    if (!inScope(p)) {
      delete prop[p];
    }
  });

  return prop;
}

export function applyAttributes(
  node: unist.Node,
  attributes: ParseResult,
  config: Pick<Config, "scope" | "extend" | "allowDangerousDOMEventHandlers">,
) {
  if (!attributes || !attributes.prop) {
    return;
  }

  const type = convTypeTag[node.type] || node.type;
  const filteredProp = filterAttributes(attributes.prop, config, type);

  if (Object.keys(filteredProp).length > 0) {
    if (!node.data) {
      node.data = {};
    }

    node.data.hProperties = {
      ...(node.data.hProperties || {}),
      ...filteredProp,
    };
  }
}
