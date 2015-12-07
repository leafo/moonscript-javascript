
p = new Promise (resolve) ->
  Module.onRuntimeInitialized = resolve

@onmessage = (e) ->
  [id, code] = e.data
  p.then ->
    res = Module.ccall "compile_moonscript", "string", ["string"], [code]
    postMessage [id, res]

