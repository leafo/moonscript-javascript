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

  function encode(o) {
    var pairs = [];
    for (key in o) {
      pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(o[key]));
    }
    return pairs.join("&");
  }

  function http_req(method, url, body, finish) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
      if (req.readyState == 4) {
        if (req.status == 200)
          finish(req);
        else 
          finish({error:true})
      }
    }

    req.open(method, url, true);
    if (method == "POST" && typeof body != "string") {
      req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      body = encode(body);
    }
    req.send(body);
  }

  function get(url, finish) {
    return http_req("GET", url, null, finish);
  }

  function post(url, body, finish) {
    return http_req("POST", url, body, finish);
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
    var last_action;

    if (!window.Worker) {
      alert("This page requires javascript workers");
      return;
    }
    var worker = new Worker("worker.js?1");

    worker.onmessage = function(event) {
      var data = event.data;
      if (data.type == "error") {
        set_error(data.msg);
        return;
      }

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
    function set_loading(msg) {
      msg = msg || "Loading Compiler..."
      status_node.innerHTML =
        '<img src="img/ajax-loader.gif" alt="X" /> ' + msg;
      status_node.className = 'working';
    }

    function set_success(msg) {
      status_node.innerHTML = msg;
      status_node.className = 'success';
    }

    function set_error(msg) {
      status_node.innerHTML = msg;
      status_node.className = 'error';
      $("out").innerHTML = "";
    }

    function set_output(type, body) {
      body = escape_html(body);
      var out_node = $("out");
      if (type == "compile") {
        out_node.innerHTML = highlighter.format_text(body);
      } else {
        out_node.innerHTML = body == "" ?
          '<span class="meta">&rarr; No output</span>' : body;
      }
    }

    $("clear").onclick = function() {
      $("input").value = "";
    }

    $("compile").onclick = function() {
      var start = new Date,
          input = $("input").value;
      set_loading("Compiling...");
      compile_moon(input, function(data) {
        set_output("compile", data.code);
        set_success("Finished in " + (new Date - start) + "ms")
        last_action = { type: "compile", input: input, output: data.code };
      });
    };

    $("run").onclick = function() {
      var start = new Date,
          input = $("input").value;
      set_loading("Compiling...");
      execute_moon(input, function(data) {
        set_output("run", data.code);
        set_success("Finished in " + (new Date - start) + "ms");
        last_action = { type: "run", input: input, output: data.code };
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

    
    function status_error(msg) {
        var status_node = $("toolbar_status");
        status_node.innerHTML =
          '<span class="status_error"><b>Error:</b> '+msg+'</span>';
    }

    $("save_button").onclick = function() {
      var btn = this,
          status_node = $("toolbar_status"),
          output_node = $("snippet_url");

      if (!last_action) {
        alert("Compile or run some code first");
        return;
      }

      if (last_action.id) {
        alert("Modify the code and compile or run before saving");
        return;
      }

      if (last_action.input.match("^\s*$")) {
        alert("Can't save blank snippet");
        return;
      }

      btn.disabled = true;
      output_node.style.display = "none";
      status_node.innerHTML = '<img src="img/ajax-loader.gif" alt="X" /> Saving...';

      post("snippet.php?act=save", last_action, function(req) {
        var result = JSON.parse(req.responseText);
        btn.disabled = false;
        status_node.innerHTML = "Error: hello world";

        if (result.error) {
          status_node.innerHTML =
            '<span class="status_error"><b>Error:</b> '+result.msg+'</span>';
          return;
        }

        output_node.style.display = "inline";
        output_node.value = 'http://moonscript.org/compiler/#' + result.id;
        status_node.innerHTML = "Saved!";
        last_action.id = result.id;
        window.location.hash = "#" + result.id
      });
    }

    window.onhashchange = function() {
      var hash = window.location.hash,
          status_node = $("toolbar_status");

      if (hash) {
        if (last_action && "#" + last_action.id == hash) return;
        hash = hash.substr(1);
        if (hash.match(/^[0-9a-z]+$/i)) {

          status_node.innerHTML =
            '<img src="img/ajax-loader.gif" alt="X" /> Loading Snippet...';

          get("snippet.php?act=get&id=" + hash, function(req) {
            var snippet = JSON.parse(req.responseText);
            if (snippet.error) {
              status_error(snippet.msg);
              return;
            }

            status_node.innerHTML = "Loaded snippet #" + escape_html(hash);

            $("input").value = snippet.input;
            set_output(snippet.type, snippet.output);
            snippet.id = hash;
            last_action = snippet;
          });
        }
      }
    }

    window.onhashchange();
  };

})();

