
window.MoonScript ||= {}

{ div, span, a, p, ol, ul, li, strong, em, img,
  form, label, input, textarea, button,
  h1, h2, h3, h4, h5, h6, pre, code } = React.DOM

window.R = (name, data, p=R, prefix="") ->
  data.displayName = "R.#{prefix}#{name}"
  cl = React.createClass(data)
  p[name] = React.createFactory(cl)
  p[name]._class = cl

R "MoonScriptCompiler", {
  getInitialState: ->
    {
      code_input: ""
      last_output: ""
    }

  render: ->
    div children: [
      div className: "header", "MoonScript compiler"

      textarea {
        value: @state.code_input
        className: "code_input"
        placeholder: "Write MoonScript here..."
        onChange: (e) =>
          @setState {
            code_input: e.target.value
            loading: true
          }

          MoonScript.compile(e.target.value).then (res) =>
            @setState {
              last_output: res
              loading: false
            }
      }

      pre className: "value code_output", @state.last_output
    ]
}


class MoonWorker
  id: 0

  constructor: ->
    @worker = new Worker "worker.js"
    @listeners = {}
    @worker.onmessage = (e) =>
      [return_id, result] = e.data
      if @listeners[return_id]?
        fn = @listeners[return_id]
        fn result

  send: (args...) ->
    send_id = @id
    @id += 1

    @worker.postMessage [send_id, args...]
    new Promise (resolve) =>
      @listen send_id, resolve

  listen: (id, fn) ->
    @listeners[id] = fn

MoonScript.get_worker = ->
  MoonScript.worker ||= new MoonWorker

MoonScript.compile = (code) ->
  if code == ""
    return new Promise (r) -> r ""

  worker = MoonScript.get_worker()
  worker.send "compile", code

MoonScript.render = ->
  body = document.querySelector("#body")
  component = R.MoonScriptCompiler {}
  ReactDOM.render(component, body)

