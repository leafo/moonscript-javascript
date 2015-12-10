is_alpha = (str) ->
  str.match /^[a-zA-Z_]+$/

wrap_word = (str) ->
  if is_alpha str
    "\\b#{str}\\b"
  else
    str

unescape_html = (text) ->
  node = document.createElement "div"
  node.innerHTML = text
  if node.childNodes.length > 0
    node.childNodes[0].nodeValue
  else
    ""

escape_html = (text) ->
  text.replace(/</g, "&lt;").replace(/>/g, "&gt;")

class Highlighter
  attr_name: "class"
  constructor: ->
    @match_name_table = []

    literal_matches = []
    pattern_matches = []
    for name, patterns of @matches
      patterns = [patterns] if patterns not instanceof Array
      for p in patterns
        if p instanceof RegExp
          pattern_matches.push [name, p.source]
        else
          literal_matches.push [name, @escape p]

    comp = (a,b) -> b[1].length - a[1].length
    literal_matches.sort comp
    pattern_matches.sort comp

    matches = literal_matches.concat pattern_matches
    matches = for i in [0...matches.length]
      [name, pattern] = matches[i]
      @match_name_table.push name
      "(" + wrap_word(pattern) + ")"

    @patt = matches.join("|")

    @r = new RegExp @patt, "g"
    @replace_all()

  replace_all: ->
    cls_name = "." + @name + "-code"
    nodes = document.querySelectorAll cls_name
    for node in nodes
      node.innerHTML = @format_text unescape_html node.innerHTML

  format_text: (text) ->
    text.replace @r, (match, params...) =>
      i = 0
      while not params[i] and i < params.length
        i++

      name = @match_name_table[i]
      @style match, @get_style name, match

  get_style: (name, value) ->
    fn = @theme?[name] or "l_#{name}"

    if typeof fn == "function"
      fn value
    else
      fn

  style: (text, style) ->
    text = escape_html text
    "<span #{@attr_name}=\"#{style}\">#{text}</span>"

  escape: (text) -> # pattern escape
    text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"

builtins = [
    "table.insert", "assert", "print"
    "ipairs", "pairs", "require", "module"
    "package.seeall"
]

class LuaHighlighter extends Highlighter
  name: "lua"
  matches:
    fn_symbol: ["function"]
    keyword: [
      "for", "end", "local", "if", "then", "return", "do"
      "and", "or", "else", "not", "while", "elseif"
      "break"
    ]
    special: ["nil", "true", "false"]
    symbol: ['=', '.', '{', '}', ':']
    builtins: builtins
    atom: /[_A-Za-z][_A-Za-z0-9]*/
    number: /-?\d+/
    string: [/"[^"]*"/, /\[\[.*?]]/]
    comment: /--[^\n]*(?:\n|$)/

class MoonHighlighter extends Highlighter
  name: "moon"
  matches:
    keyword: [
      "class", "extends", "if", "then", "super"
      "do", "with", "import", "export", "while"
      "elseif", "return", "for", "in", "from", "when"
      "using", "else", "and", "or", "not", "switch"
      "break", "continue"
    ]
    special: ["nil", "true", "false"]
    builtins: builtins
    self: ["self"]
    symbol: [
      '!', '\\', '=', '+=', '-='
      '...', '*', '>', '<', '#'
    ]
    bold_symbol: [':', '.']
    fn_symbol: ['->', '=>', '}', '{', '[', ']']
    self_var: /@[a-zA-Z_][a-zA-Z_0-9]*/
    table_key: /[_A-Za-z][a-zA-Z_0-9]*(?=:)/
    proper: /[A-Z][a-zA-Z_0-9]*/
    atom: /[_A-Za-z]\w*/
    number: /-?\d+/
    string: [/"[^"]*"/, /\[\[.*?]]/]
    comment: /--[^\n]*(?:\n|$)/

window.LuaHighlighter = LuaHighlighter
window.MoonHighlighter = MoonHighlighter
