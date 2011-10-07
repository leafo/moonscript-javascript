
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

var start = +new Date;

setTimeout(function() {
  postMessage("we are done loading after: " + (new Date - start));
  printer.clear();
}, 0);

