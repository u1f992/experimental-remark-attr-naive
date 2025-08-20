import assert from "node:assert";
import test from "node:test";

import remarkAttr, { type Config } from "./index.js";

import unified from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFootnotes from "remark-footnotes";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

import { parse as $ } from "parse5";

const renderDefault = (text: string) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkAttr)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text),
  );

const render = (text: string) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkAttr, {
        allowDangerousDOMEventHandlers: true,
        scope: "permissive",
      })
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text),
  );

const renderFootnotes = (text: string) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkFootnotes, { inlineNotes: true })
      .use(remarkAttr, {
        allowDangerousDOMEventHandlers: false,
        scope: "permissive",
      })
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text),
  );

const renderRaw = (text: string) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkAttr, {
        allowDangerousDOMEventHandlers: true,
        scope: "permissive",
      })
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeStringify)
      .processSync(text),
  );

const renderExtended = (text: string, config: Partial<Config>) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkAttr, config)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text),
  );

const MAIN_TEST_STRING =
  'Inline *test*{style="em:4"} paragraph. Use **multiple**{ style="color:pink"} inline ~~block~~ tag. Line `tagCode`{ style="color:yellow"}.';

/* Basic tests */

test("basic-default", () => {
  assert.deepStrictEqual(
    $(renderDefault(MAIN_TEST_STRING)),
    $(
      '<p>Inline <em style="em:4">test</em> paragraph. Use <strong style="color:pink">multiple</strong> inline <del>block</del> tag. Line <code style="color:yellow">tagCode</code>.</p>',
    ),
  );
});

test("basic", () => {
  assert.deepStrictEqual(
    $(render(MAIN_TEST_STRING)),
    $(`
<p>Inline <em style="em:4">test</em> paragraph. Use <strong style="color:pink">multiple</strong> inline <del>block</del> tag. Line <code style="color:yellow">tagCode</code>.</p>`),
  );
});

test("basic-raw", () => {
  assert.deepStrictEqual(
    $(renderRaw(MAIN_TEST_STRING)),
    $(`
<p>Inline <em style="em:4">test</em> paragraph. Use <strong style="color:pink">multiple</strong> inline <del>block</del> tag. Line <code style="color:yellow">tagCode</code>.</p>`),
  );
});

/* Support tests
 *
 * They test the support of one element each.
 */

test("em", () => {
  assert.deepStrictEqual(
    $(
      render(
        "textexamplenointerest **Important**{style=4em} still no interest",
      ),
    ),
    $(
      '<p>textexamplenointerest <strong style="4em">Important</strong> still no interest</p>',
    ),
  );
});

test("fenced code", () => {
  assert.deepStrictEqual(
    $(
      render(`~~~lang info=string
This is an awesome code

~~~
`),
    ),
    $(`<pre><code class="language-lang" info="string">This is an awesome code

</code></pre>`),
  );
});

test("fenced code brackets", () => {
  assert.deepStrictEqual(
    $(
      render(`~~~lang {info=string}
This is an awesome code

~~~
`),
    ),
    $(`<pre><code class="language-lang" info="string">This is an awesome code

</code></pre>`),
  );
});

test("fenced code brackets and spaces", () => {
  assert.deepStrictEqual(
    $(
      render(`~~~lang   {info=string}
This is an awesome code

~~~
`),
    ),
    $(`<pre><code class="language-lang" info="string">This is an awesome code

</code></pre>`),
  );
});

test("image", () => {
  assert.deepStrictEqual(
    $(render('![Test image](url.com){ alt="This is alt"  longdesc="qsdf"}')),
    $('<p><img src="url.com" alt="This is alt" longdesc="qsdf"/></p>'),
  );
});

test("link", () => {
  assert.deepStrictEqual(
    $(
      render(
        'This is a link :[Test link](ache.one){ ping="https://ache.one/big.brother"}',
      ),
    ),
    $(
      '<p>This is a link :<a href="ache.one" ping="https://ache.one/big.brother">Test link</a></p>',
    ),
  );
});

test("autolink", () => {
  assert.deepStrictEqual(
    $(
      render(
        'This is a link :<https://ache.one>{ ping="https://ache.one/big.brother"}',
      ),
    ),
    $(
      '<p>This is a link :<a href="https://ache.one" ping="https://ache.one/big.brother">https://ache.one</a></p>',
    ),
  );
});

test("header", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(`
Title of the article
====================
{data-id="title"}

`),
    ),
    $('<h1 data-id="title">Title of the article</h1>'),
  );
});

test("atx header", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(`
# Title of the article
{data-id="title"}

`),
    ),
    $('<h1 data-id="title">Title of the article</h1>'),
  );
});

test("atx header inline", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(`
# Title of the article {data-id="title"}   

`),
    ),
    $('<h1 data-id="title">Title of the article</h1>'),
  );
});

test("atx header inline 2", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(`
# Title of the article{data-id="title"}

`),
    ),
    $('<h1 data-id="title">Title of the article</h1>'),
  );
});

test("header error inline", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(`
Title of the article {data-id="title"}
======================================

`),
    ),
    $('<h1>Title of the article {data-id="title"}</h1>'),
  );
});

test("not atx header inline", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(`
# {data-id="title"}

`),
    ),
    $('<h1>{data-id="title"}</h1>'),
  );
});

test("not atx header inline 2", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(`
# Header {data-id="title"

`),
    ),
    $('<h1>Header {data-id="title"</h1>'),
  );
});

test("not atx header inline 3", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(`
# Header data-id="title"}

`),
    ),
    $('<h1>Header data-id="title"}</h1>'),
  );
});

test("emphasis and strong", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(
        'Hey ! *That looks cool*{style="color: blue;"} ! No, that\'s **not**{.not} !',
      ),
    ),
    $(
      '<p>Hey ! <em style="color: blue;">That looks cool</em> ! No, that\'s <strong class="not">not</strong> !',
    ),
  );
});

test("linkReference", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(`[Google][google]{hreflang="en"}

[google]: https://google.com
`),
    ),
    $('<p><a href="https://google.com" hreflang="en">Google</a></p>'),
  );
});

test("footnote", () => {
  assert.deepStrictEqual(
    $(
      renderFootnotes(`Since XP is good we should always use XP[^xp]{data-id=xp}

[^xp]: Apply XP principe to XP.
`),
    ),
    $(`<p>Since XP is good we should always use XP<sup id="fnref-xp"><a href="#fn-xp" class="footnote-ref" data-id="xp">xp</a></sup></p>
<div class="footnotes">
<hr>
<ol>
<li id="fn-xp">Apply XP principe to XP.<a href="#fnref-xp" class="footnote-backref">↩</a></li>
</ol>
</div>`),
  );
});

const README = `
![alt](img){ height=50 }

[Hot babe with computer](https://rms.sexy){rel="external"}

### This is a title
{style="color:red;"}

Npm stand for *node*{style="color:yellow;"} packet manager.

This is a **Unicorn**{awesome} !

Your problem is ~~at line 18~~{style="color: grey;"}. My mistake, it's at line 14.

You can use the \`fprintf\`{language=c} function to format the output to a file.
`;

/* Readme tests
 *
 * Should be act acording to the README.md
 */

test("readme-default", () => {
  assert.deepStrictEqual(
    $(renderDefault(README)),
    $(`
<p><img src="img" alt="alt" height="50"></p>
<p><a href="https://rms.sexy" rel="external">Hot babe with computer</a></p>
<h3 style="color:red;">This is a title</h3>
<p>Npm stand for <em style="color:yellow;">node</em> packet manager.</p>
<p>This is a <strong>Unicorn</strong> !</p>
<p>Your problem is <del style="color: grey;">at line 18</del>. My mistake, it's at line 14.</p>
<p>You can use the <code>fprintf</code> function to format the output to a file.</p>`),
  );
});

test("readme", () => {
  assert.deepStrictEqual(
    $(render(README)),
    $(`
<p><img src="img" alt="alt" height="50"></p>
<p><a href="https://rms.sexy" rel="external">Hot babe with computer</a></p>
<h3 style="color:red;">This is a title</h3>
<p>Npm stand for <em style="color:yellow;">node</em> packet manager.</p>
<p>This is a <strong awesome="">Unicorn</strong> !</p>
<p>Your problem is <del style="color: grey;">at line 18</del>. My mistake, it's at line 14.</p>
<p>You can use the <code language="c">fprintf</code> function to format the output to a file.</p>`),
  );
});

/* Extended tests
 *
 * They test the support of the feature that extended the pool of attribute
 * that can be parsed.
 */

test("extended", () => {
  assert.deepStrictEqual(
    $(
      renderExtended(
        `*Wait* !
This is an awesome image : ![Awesome image](aws://image.jpg){ quality="80" awesomeness="max" }
`,
        { extend: { image: ["quality"] } },
      ),
    ),
    // NOTE: Fixed expected output to include quality="80" attribute as it should be allowed by extend config
    $(`<p><em>Wait</em> !
This is an awesome image : <img src="aws://image.jpg" alt="Awesome image" quality="80"></p>`),
  );
});

test("extended Dangerous", () => {
  assert.deepStrictEqual(
    $(
      renderExtended(
        `*Wait* !
This is an awesome image : ![Awesome image](aws://image.jpg){ quality="80" awesomeness="max" onload="launchAwesomeFunction();" }
`,
        {
          extend: { image: ["quality", "onload"] },
        },
      ),
    ),
    $(`<p><em>Wait</em> !
This is an awesome image : <img src="aws://image.jpg" alt="Awesome image" quality="80" onload="launchAwesomeFunction();"></p>`),
  );
});

test("extended-global", () => {
  assert.deepStrictEqual(
    $(
      renderExtended(' *Wait* ! You are **beautiful**{ ex-attr="true" } !', {
        extend: { "*": ["ex-attr"] },
      }),
    ),
    $(
      '<p> <em>Wait</em> ! You are <strong ex-attr="true">beautiful</strong> !</p>',
    ),
  );
});

test("extended-invalid-scope", () => {
  assert.deepStrictEqual(
    $(
      renderExtended(
        '*Wait* ! You are **beautiful**{ ex-attr="true" onload="qdss" pss="NOK" } !',
        {
          // @ts-expect-error extended-invalid-scope
          scope: "invalid",
          extend: { strong: ["ex-attr"] },
        },
      ),
    ),
    $(
      '<p><em>Wait</em> ! You are <strong ex-attr="true">beautiful</strong> !</p>',
    ),
  );
});

test("invalid-scope", () => {
  assert.deepStrictEqual(
    $(
      renderExtended(
        ' *Wait* ! I **love**{ exAttr="true" onload="qdss" pss="NOK" } you !',
        {
          // @ts-expect-error invalid-scope
          extend: "exAttr",
        },
      ),
    ),
    $("<p> <em>Wait</em> ! I <strong>love</strong> you !</p>"),
  );
});

test("invalid-extend", () => {
  assert.deepStrictEqual(
    $(
      renderExtended(
        ' *Wait* ! I **love**{ exAttr="true" onload="qdss" attr="NOK" style="color: red;"} you!',
        {
          // @ts-expect-error invalid-extend
          extend: "exAttr",
        },
      ),
    ),
    $(
      '<p> <em>Wait</em> ! I <strong style="color: red;">love</strong> you!</p>',
    ),
  );
});

/* Special attributes tests
 *
 * aria attributes: Focused on accessibility. They have the form aria-*
 * Global custom attributes: User ended attributes. They have the form data-*
 *
 */

test("global-aria", () => {
  assert.deepStrictEqual(
    $(
      renderDefault(
        ' *Wait* ! I **love**{ style="color: pink;" aria-love="true" } you!',
      ),
    ),
    $(
      '<p> <em>Wait</em> ! I <strong style="color: pink;" aria-love="true">love</strong> you!</p>',
    ),
  );
});

test("global custom attribute", () => {
  const result = renderExtended(
    `*Wait* !
This is a test image : ![test](img.jpg){data-id=2}
`,
    { extend: { image: ["quality"] } },
  );
  assert.deepStrictEqual(
    $(result),
    $(`<p><em>Wait</em> !
This is a test image : <img src="img.jpg" alt="test" data-id="2"></p>`),
  );

  assert.notDeepStrictEqual(
    $(result),
    $(`<p><em>Wait</em> !
This is a test image : <img src="img.jpg" alt="test"></p>`),
  );
});

test("global custom attributes 2", () => {
  const result = renderExtended(
    `*Wait* !
This is a test image : ![test](img.jpg){data-id-node=2}
`,
    { extend: { image: ["quality"] } },
  );
  assert.deepStrictEqual(
    $(result),
    $(`<p><em>Wait</em> !
This is a test image : <img src="img.jpg" alt="test" data-id-node="2"></p>`),
  );

  assert.notDeepStrictEqual(
    $(result),
    $(`<p><em>Wait</em> !
This is a test image : <img src="img.jpg" alt="test"></p>`),
  );
});

test("global custom attributes 3", () => {
  const result = renderExtended(
    `*Wait* !
This is a test image : ![test](img.jpg){data--id=2}
`,
    { extend: { image: ["quality"] } },
  );
  assert.deepStrictEqual(
    $(result),
    $(`<p><em>Wait</em> !
This is a test image : <img src="img.jpg" alt="test"></p>`),
  );
});

test("global custom attributes 4", () => {
  const result = renderExtended(
    `*Wait* !
This is a test image : ![test](img.jpg){data-i=2}
`,
    { extend: { image: ["quality"] } },
  );
  assert.deepStrictEqual(
    $(result),
    $(`<p><em>Wait</em> !
This is a test image : <img src="img.jpg" alt="test" data-i=2></p>`),
  );

  assert.notDeepStrictEqual(
    $(result),
    $(`<p><em>Wait</em> !
This is a test image : <img src="img.jpg" alt="test"></p>`),
  );
});
