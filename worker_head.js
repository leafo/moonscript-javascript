
var printer;
(function() {
  function PrintBuffer() {
    var buff = [];
    this.print = function(text) {
      buff.push(text);
    }

    this.clear = function() {
      buff = [];
    }

    this.get_str = function() {
      var str = buff.join("\n");
      buff = [];
      return str;
    }
  }
  printer = new PrintBuffer();
})();
print = printer.print;

function run_lua(code) {
  str = intArrayFromString(code);
  pt = allocate(str, "i8");
  _run_lua(pt);
}

function parse_moon(moon_code) {
  printer.clear();
  run_lua([
    "local tree = moonscript.parse.string([==[" + moon_code + "]==])",
    "print(moonscript.util.dump(tree))"
  ].join("\n"))

  return printer.get_str();
}

function compile_moon(moon_code) {
  printer.clear();
  run_lua([
    "local tree = moonscript.parse.string([==[" + moon_code + "]==])",
    "local code = moonscript.compile.tree(tree)",
    "print(code)"
  ].join("\n"));
  return printer.get_str()
}

function execute_moon(moon_code) {
  var lua = compile_moon(moon_code);
  printer.clear();
  run_lua(lua);
  return printer.get_str();
}

var start = new Date;

if (typeof document == "undefined") { // running inside of worker
  setTimeout(function() {
    var msg = "we are done loading after: " + (new Date - start);
    printer.clear();
    postMessage({type:"ready", msg: msg});

    onmessage = function(event) {
      var type = event.data.type;
      switch (type) {
        case "parse":
          postMessage({type:"parse", code: parse_moon(event.data.code)});
          break;
        case "compile":
          postMessage({type:"compile", code: compile_moon(event.data.code)});
          break;
        case "execute":
          postMessage({type:"execute", code: execute_moon(event.data.code)});
          break;
        default:
          postMessage({type: "error", msg: "Unknown message: " + type})
      }
    }

  }, 0);
}

