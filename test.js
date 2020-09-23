var test = require('tape')
var micromark = require('micromark')
var syntax = require('.')
var html = require('./html')

var custom = {type: 'custom', marker: {open: '<', close: '>'}}
var json = {type: 'json', fence: {open: '{', close: '}'}}
var yamlAnywhere = {type: 'yaml', marker: '-', anywhere: true}

test('core', function (t) {
  t.throws(
    function () {
      syntax([1])
    },
    /^Error: Expected matter to be an object, not `1`/,
    'should throw if not given a preset or a matter'
  )

  t.throws(
    function () {
      syntax('jsonml')
    },
    /^Error: Missing matter definition for `jsonml`/,
    'should throw if given an unknown preset'
  )

  t.throws(
    function () {
      syntax({marker: '*'})
    },
    /^Error: Missing `type` in matter `{"marker":"\*"}`/,
    'should throw if given a matter without `type`'
  )

  t.throws(
    function () {
      syntax({type: 'jsonml'})
    },
    /^Error: Missing `marker` or `fence` in matter `{"type":"jsonml"}`/,
    'should throw if given a matter without `marker`'
  )

  t.end()
})

test('markdown -> html (micromark)', function (t) {
  t.deepEqual(
    micromark('---', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<hr />',
    'should not support a single yaml fence (thematic break)'
  )

  t.deepEqual(
    micromark('---\n---', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '',
    'should support empty yaml'
  )

  t.deepEqual(
    micromark('---\na\n\nb\n---', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '',
    'should support yaml w/ content'
  )

  t.deepEqual(
    micromark('---\na\n\nb\n---\n# Heading\n***\n    code', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<h1>Heading</h1>\n<hr />\n<pre><code>code\n</code></pre>',
    'should support content after yaml'
  )

  t.deepEqual(
    micromark('+++\na\n\nb\n+++\na\n=', {
      extensions: [syntax('toml')],
      htmlExtensions: [html('toml')]
    }),
    '<h1>a</h1>',
    'should support toml'
  )

  t.deepEqual(
    micromark(' ---\n---', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<hr />\n<hr />',
    'should not support a prefix (indent) before a yaml opening fence'
  )

  t.deepEqual(
    micromark('---\n ---', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<hr />\n<hr />',
    'should not support a prefix (indent) before a yaml closing fence'
  )

  t.deepEqual(
    micromark('---  \n---\t ', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '',
    'should parse an arbitrary suffix after the opening and closing fence of yaml'
  )

  t.deepEqual(
    micromark('--- --\n---', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<hr />\n<hr />',
    'should not support other characters after the suffix on the opening fence of yaml'
  )

  t.deepEqual(
    micromark('---\n--- x', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<hr />\n<p>--- x</p>',
    'should not support other characters after the suffix on the closing fence of yaml'
  )

  t.deepEqual(
    micromark('----\n---', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<hr />\n<hr />',
    'should not support an opening yaml fence of more than 3 characters'
  )

  t.deepEqual(
    micromark('---\n----', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<hr />\n<hr />',
    'should not support a closing yaml fence of more than 3 characters'
  )

  t.deepEqual(
    micromark('--\n---', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<h2>--</h2>',
    'should not support an opening yaml fence of less than 3 characters'
  )

  t.deepEqual(
    micromark('---\n--', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<hr />\n<p>--</p>',
    'should not support a closing yaml fence of less than 3 characters'
  )

  t.deepEqual(
    micromark('---\na\nb\n---', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '',
    'should support content in yaml'
  )

  t.deepEqual(
    micromark('---\na\n\nb\n---', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '',
    'should support blank lines in yaml'
  )

  var customOptions = {
    extensions: [syntax(custom)],
    htmlExtensions: [html(custom)]
  }

  t.deepEqual(
    micromark('<<<\na\n\nb\n>>>', customOptions),
    '',
    'should support a custom matter (1)'
  )

  t.deepEqual(
    micromark('<<<\na\n\nb\n>>>', customOptions),
    '',
    'should support a custom matter (2)'
  )

  t.deepEqual(
    micromark('{\na\n\nb\n}', {
      extensions: [syntax(json)],
      htmlExtensions: [html(json)]
    }),
    '',
    'should support a custom matter (3)'
  )

  t.deepEqual(
    micromark('# Hello\n---\na\n\nb\n---\n+++', {
      extensions: [syntax()],
      htmlExtensions: [html()]
    }),
    '<h1>Hello</h1>\n<hr />\n<p>a</p>\n<h2>b</h2>\n<p>+++</p>',
    'should not support yaml frontmatter in the middle'
  )

  t.deepEqual(
    micromark('# Hello\n---\na\n\nb\n---\n+++', {
      extensions: [syntax(yamlAnywhere)],
      htmlExtensions: [html(yamlAnywhere)]
    }),
    '<h1>Hello</h1>\n<p>+++</p>',
    'should not support custom matters in the middle'
  )

  t.end()
})
