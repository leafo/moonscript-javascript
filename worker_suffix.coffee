
p = new Promise (resolve) ->
  Module.onRuntimeInitialized = resolve

@onmessage = (e) ->
  [id, action, code] = e.data
  switch action
    when "compile"
      p.then ->
        res = Module.ccall "compile_moonscript", "string", ["string"], [code]
        @postMessage [id, res]

