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

  function WebWorkerCompiler(msgs) {
    if (!window.Worker) {
      alert("This page requires javascript workers");
      return;
    }

    var worker = this.worker = new Worker("worker.js?1");
    set_loading("Loading Compiler...");

    worker.onmessage = function(event) {
      var data = event.data;
      if (data.type == "error") {
        msgs.error(data.msg);
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
      msgs.success(escape_html(data.msg));
    });

    this.compile = function(code, result) {
      worker.postMessage({type:"compile", code:code});
      worker.push_handler("compile", result);
    }

    this.execute = function(code, result) {
      worker.postMessage({type:"execute", code:code});
      worker.push_handler("execute", result);
    }
  }

  function AjaxCompiler(msgs) {
    var api = "proxy.php";
    var error_msg = "There was a fatal error";

    // warm up the compiler
    get("proxy.php?action=version", function(res) {
      $("version").innerHTML = "(" + res.responseText + ")";
    });

    msgs.success("Ready");

    this.compile = function(code, response) {
      msgs.loading();
      post(api+"?action=compile", {code: code}, function(res) {
        var obj = JSON.parse(res.responseText);
        if (obj.error) {
          msgs.error(error_msg, obj.msg);
        } else {
          response(obj);
        }
      });
    }

    this.execute = function(code, response) {
      msgs.loading();
      post(api+"?action=run", {code: code}, function(res) {
        msgs.success();
        var obj = JSON.parse(res.responseText);
        if (obj.error) {
          msgs.error(error_msg, obj.msg);
        } else {
          response({code: obj.stdout});
        }
      });
    }
  }

  window.onload = function() {
    var highlighter = new Lua();
    var examples = new ExamplePicker();
    var last_action;

    // create editor
    var editor = CodeMirror.fromTextArea(document.getElementById("input"), {
      tabMode: "shift",
      theme: "moon",
      lineNumbers: true
    });

    var status_node = $("status");
    function set_loading(msg) {
      msg = msg || "Loading..."
      status_node.innerHTML =
        '<img src="img/ajax-loader.gif" alt="X" /> ' + msg;
      status_node.className = 'working';

      $("compile").disabled = true;
      $("run").disabled = true;
    }

    function set_success(msg) {
      status_node.innerHTML = msg;
      status_node.className = 'success';

      $("compile").disabled = false;
      $("run").disabled = false;
    }

    function set_error(msg, body) {
      status_node.innerHTML = msg;
      status_node.className = 'error';
      $("out").innerHTML = body || "";

      $("compile").disabled = false;
      $("run").disabled = false;
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

    var msgs = {
      success: set_success,
      loading: set_loading,
      error: set_error
    }

    // var compiler = new WebWorkerCompiler(msgs);
    var compiler = new AjaxCompiler(msgs);

    $("clear").onclick = function() {
      editor.setValue("");
      editor.focus();
    }

    $("compile").onclick = function() {
      var start = new Date,
          input = editor.getValue();
      set_loading("Compiling...");
      compiler.compile(input, function(data) {
        set_output("compile", data.code);
        set_success("Finished in " + (new Date - start) + "ms")
        last_action = { type: "compile", input: input, output: data.code };
      });
    };

    $("run").onclick = function() {
      var start = new Date,
          input = editor.getValue();
      set_loading("Compiling...");
      compiler.execute(input, function(data) {
        set_output("run", data.code);
        set_success("Finished in " + (new Date - start) + "ms");
        last_action = { type: "run", input: input, output: data.code };
      });
    };

    $("example-picker").onchange = function() {
      if (this.selectedIndex > 1) {
        examples.get(this.value, function(content) {
          editor.setValue(content);
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

      if (!last_action || last_action.id) {
        alert("You must compile or execute before saving");
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

            editor.setValue(snippet.input);
            editor.focus();
            set_output(snippet.type, snippet.output);
            snippet.id = hash;
            last_action = snippet;
          });
        }
      }
    }

    window.onhashchange();
    editor.focus();
  };

})();

