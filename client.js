window.onload = function() {
  if (!window.Worker) {
    alert("This page requires javascript workers");
    return;
  }
  var worker = new Worker("worker.js");

  worker.onmessage = function(event) {
    var data = event.data;
    var handlers = this.handlers[data.type];
    if (handlers && handlers.length > 0) {
      handlers.shift()(data);
    } else {
      console.log("unhandled message:");
      console.log(data.type + ": " + data.msg);
    }
  }

  worker.handlers = {}
  worker.push_handler = function(type, func) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(func);
  }

  var compile_moon = function(code, result) {
    worker.postMessage({type:"compile", code:code});
    worker.push_handler("compile", result);
  }

  var execute_moon = function(code, result) {
    worker.postMessage({type:"execute", code:code});
    worker.push_handler("execute", result);
  }

  var escape_html = function(text) {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  $ = function() {
    return document.getElementById.apply(document, arguments);
  }

  $("compile").onclick = function() {
    var start = new Date;
    compile_moon($("input").value, function(data) {
      $("out").innerHTML = escape_html(data.code);
      $("time").innerHTML = new Date - start;
    });
  };

  $("run").onclick = function() {
    var start = new Date;
    execute_moon($("input").value, function(data) {
      $("out").innerHTML = escape_html(data.code);
      $("time").innerHTML = new Date - start;
    });
  };

};
