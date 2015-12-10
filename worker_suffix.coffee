
p = new Promise (resolve) ->
  Module.onRuntimeInitialized = resolve

@onmessage = (e) ->
  [id, action, code] = e.data
  switch action
    when "compile"
      p.then ->
        Module.print = console.log
        res = Module.ccall "compile_moonscript", "string", ["string"], [code]
        @postMessage [id, res]
    when "execute"
      p.then ->
        buffer = []

        Module.print = (line) ->
          buffer.push line

        res = Module.ccall "run_moonscript", "string", ["string"], [code]

        buffer.push res
        @postMessage [id, buffer.join "\n"]

