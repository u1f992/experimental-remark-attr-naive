# @u1f992/experimental-remark-attr-naive

Historical context: when remark moved from v12 to v13, compatibility for plugins that extended the Markdown tokenizer was discontinued. Some plugins, including remark-attr, have not migrated and still target remark v12. [ref](https://github.com/arobase-che/remark-attr/issues/22)

This plugin provides almost the same functionality as [remark-attr](https://github.com/arobase-che/remark-attr) on remark v13 and later.

The approach is not ideal. The attribute syntax is not handled at the Markdown tokenizer layer (that is, as a micromark extension). Instead, the plugin acts as an mdast transformer that reinterprets specific patterns as attributes. This is less robust, but it keeps the code straightforward and easier to understand.

---

Why not a micromark extension? Beyond my limited familiarity with micromark, there is a pragmatic reason. When remark v13 was released, wooorm, the author of remark, described the previous implementation as "the 5+ year old internals" (October 2020)[ref](https://github.com/remarkjs/remark/releases/tag/13.0.0). As of 2025, roughly five more years have passed. A large-scale replacement would not be surprising at this point. By contrast, the behavior of Markdown parsers themselves and changes in mdast have been gradual. I therefore prefer to depend on those layers.

<!--
メモ
remark v13に対応させる

remark v13に対応するremark-parseはv9
remark v13が使っているunifiedはv9
remark-parseが@types/mdast v3に依存していて、@types/mdastは@types/unist v2に依存している
@types/unist v2に依存しているunist-util-visitはv4まで

remark v13でremark-gfmとremark-footnotesが切り出された
remark-gfm v2はunified v10に依存している　内部でunified v10を使っているだけならどうでもいいのか？
remark-gfm v1を使用

remark-footnotesはv3でmicromark対応＝remark v13対応とみなしてよさそう

remark-rehypeは、v8まで（本体であるmdast-util-to-hastが）mdast v3, unist v2
v9からはremark-rehypeがunified v10に依存している。内部で使っているだけならいいのか？

rehype-stringifyはv9まで（unist v2に依存する）hast v2を使っているが
v9ではunified v10に依存している。v8を使うのが正しいだろうか

hast-util-rawはv6でunified v10に依存している
-->