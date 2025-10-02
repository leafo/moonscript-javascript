
ready = if Module?.ready?
  Module.ready
else
  new Promise (resolve, reject) ->
    Module.onRuntimeInitialized = resolve
    Module.onAbort = (reason) -> reject new Error reason

@onmessage = (e) ->
  [id, action, code] = e.data
  switch action
    when "compile"
      ready.then =>
        Module.print = console.log
        res = Module.ccall "compile_moonscript", "string", ["string"], [code]
        @postMessage [id, res]
      .catch (err) =>
        @postMessage [id, {error: err?.message ? String(err)}]
    when "execute"
      ready.then =>
        buffer = []

        Module.print = (line) ->
          buffer.push line

        res = Module.ccall "run_moonscript", "string", ["string"], [code]

        buffer.push res
        @postMessage [id, buffer.join "\n"]
      .catch (err) =>
        @postMessage [id, {error: err?.message ? String(err)}]
