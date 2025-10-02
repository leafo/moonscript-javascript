const isAlpha = (str) => /^[a-zA-Z_]+$/.test(str);

const wrapWord = (str) => (isAlpha(str) ? `\\b${str}\\b` : str);

const unescapeHtml = (text) => {
  if (typeof document === 'undefined') {
    return text;
  }
  const node = document.createElement('div');
  node.innerHTML = text;
  return node.childNodes.length > 0 ? node.childNodes[0].nodeValue : '';
};

const escapeHtml = (text) => (text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

class Highlighter {
  constructor({ name = '', matches = {}, theme = null, attrName = 'class' } = {}) {
    this.name = name;
    this.matches = matches;
    this.theme = theme;
    this.attrName = attrName;
    this.matchNameTable = [];

    const literalMatches = [];
    const patternMatches = [];

    Object.entries(this.matches).forEach(([matchName, patterns]) => {
      const patternList = Array.isArray(patterns) ? patterns : [patterns];
      patternList.forEach((pattern) => {
        if (pattern instanceof RegExp) {
          patternMatches.push([matchName, pattern.source]);
        } else {
          literalMatches.push([matchName, this.escape(pattern)]);
        }
      });
    });

    const byLengthDesc = (a, b) => b[1].length - a[1].length;
    literalMatches.sort(byLengthDesc);
    patternMatches.sort(byLengthDesc);

    const combined = literalMatches.concat(patternMatches);
    const groupedPatterns = combined.map(([matchName, pattern]) => {
      this.matchNameTable.push(matchName);
      return `(${wrapWord(pattern)})`;
    });

    this.pattern = groupedPatterns.join('|');
    this.regex = this.pattern ? new RegExp(this.pattern, 'g') : null;

    this.replaceAll();
  }

  replaceAll() {
    if (typeof document === 'undefined' || !this.regex) {
      return;
    }
    const classSelector = `.${this.name}-code`;
    const nodes = document.querySelectorAll(classSelector);
    nodes.forEach((node) => {
      node.innerHTML = this.formatText(unescapeHtml(node.innerHTML));
    });
  }

  formatText(text) {
    if (!text || !this.regex) {
      return text || '';
    }
    return text.replace(this.regex, (match, ...args) => {
      const groups = args.slice(0, this.matchNameTable.length);
      const index = groups.findIndex(Boolean);
      if (index === -1) {
        return match;
      }
      const style = this.getStyle(this.matchNameTable[index], match);
      return this.style(match, style);
    });
  }

  getStyle(name, value) {
    if (this.theme && name in this.theme) {
      const themed = this.theme[name];
      if (typeof themed === 'function') {
        return themed(value);
      }
      if (themed) {
        return themed;
      }
    }
    return `l_${name}`;
  }

  style(text, styleName) {
    const safeText = escapeHtml(text);
    return `<span ${this.attrName}="${styleName}">${safeText}</span>`;
  }

  escape(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }
}

const builtins = [
  'table.insert', 'assert', 'print',
  'ipairs', 'pairs', 'require', 'module',
  'package.seeall',
];

class LuaHighlighter extends Highlighter {
  constructor(options = {}) {
    super({
      name: 'lua',
      matches: {
        fn_symbol: ['function'],
        keyword: [
          'for', 'end', 'local', 'if', 'then', 'return', 'do',
          'and', 'or', 'else', 'not', 'while', 'elseif',
          'break',
        ],
        special: ['nil', 'true', 'false'],
        symbol: ['=', '.', '{', '}', ':'],
        builtins,
        atom: /[_A-Za-z][_A-Za-z0-9]*/,
        number: /-?\d+/,
        string: [/"[^"]*"/, /\[\[.*?]]/],
        comment: /--[^\n]*(?:\n|$)/,
      },
      theme: options.theme || null,
      attrName: options.attrName || 'class',
    });
  }
}

class MoonHighlighter extends Highlighter {
  constructor(options = {}) {
    super({
      name: 'moon',
      matches: {
        keyword: [
          'class', 'extends', 'if', 'then', 'super',
          'do', 'with', 'import', 'export', 'while',
          'elseif', 'return', 'for', 'in', 'from', 'when',
          'using', 'else', 'and', 'or', 'not', 'switch',
          'break', 'continue',
        ],
        special: ['nil', 'true', 'false'],
        builtins,
        self: ['self'],
        symbol: [
          '!', '\\', '=', '+=', '-=',
          '...', '*', '>', '<', '#',
        ],
        bold_symbol: [':', '.'],
        fn_symbol: ['->', '=>', '}', '{', '[', ']'],
        self_var: /@[a-zA-Z_][a-zA-Z_0-9]*/,
        table_key: /[_A-Za-z][a-zA-Z_0-9]*(?=:)/,
        proper: /[A-Z][a-zA-Z_0-9]*/,
        atom: /[_A-Za-z]\w*/,
        number: /-?\d+/,
        string: [/"[^"]*"/, /\[\[.*?]]/],
        comment: /--[^\n]*(?:\n|$)/,
      },
      theme: options.theme || null,
      attrName: options.attrName || 'class',
    });
  }
}

export { Highlighter, LuaHighlighter, MoonHighlighter };

if (typeof window !== 'undefined') {
  window.LuaHighlighter = LuaHighlighter;
  window.MoonHighlighter = MoonHighlighter;
}
