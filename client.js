(function() {
  $ = function() {
    return document.getElementById.apply(document, arguments);
  }

  function escape_html(text) {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_");
  }

  function get(url, finish) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
      if (req.readyState == 4) {
        if (req.status == 200)
          finish(req);
        else 
          finish({error:true})
      }
    }

    req.open("GET", url, true);
    req.send();
  }

  ExamplePicker = function() {
    this.example_path = "examples/";
    this.examples = {}
    var self = this;
    this.get = function(name, res) {
      name = slug(name);
      if (this.examples[name]) {
        return res(this.examples[name]);
      }

      get(this.example_path + name + ".moon", function(req) {
        if (req.error) {
          return "-- Failed to fetch example";
        }
        var text = req.responseText;
        self.examples[name] = text;
        res(text);
      });
    }

  }

  window.onload = function() {
    var highlighter = new Lua();
    var examples = new ExamplePicker();

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

    worker.push_handler("ready", function(data) {
      set_success(escape_html(data.msg));
      $("compile").disabled = false;
      $("run").disabled = false;
    });

    function compile_moon(code, result) {
      worker.postMessage({type:"compile", code:code});
      worker.push_handler("compile", result);
    }

    function execute_moon(code, result) {
      worker.postMessage({type:"execute", code:code});
      worker.push_handler("execute", result);
    }


    var status_node = $("status");
    function set_loading() {
      status_node.innerHTML = '<img src="img/ajax-loader.gif" alt="X" /> Loading...';
      status_node.className = 'working';
    }

    function set_success(msg) {
      status_node.innerHTML = msg;
      status_node.className = 'success';
    }

    function set_error(msg) {
      status_node.innerHTML = msg;
      status_node.className = 'error';
    }

    $("clear").onclick = function() {
      $("input").value = "";
    }

    $("compile").onclick = function() {
      var start = new Date;
      set_loading();
      compile_moon($("input").value, function(data) {
        var lua_code = escape_html(data.code);
        $("out").innerHTML = highlighter.format_text(lua_code);
        set_success("Finished in " + (new Date - start) + "ms")
      });
    };

    $("run").onclick = function() {
      var start = new Date;
      set_loading();
      execute_moon($("input").value, function(data) {
        $("out").innerHTML = data.code == "" ?
          '<span class="meta">&rarr; No output</span>' : escape_html(data.code);

        set_success("Finished in " + (new Date - start) + "ms");
      });
    };

    set_loading();
    
    $("example-picker").onchange = function() {
      if (this.selectedIndex > 1) {
        examples.get(this.value, function(content) {
          $("input").value = content;
        });
      }
    }

  };

})();

