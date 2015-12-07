
window.MoonScript ||= {}

id = 0
worker = null

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

      pre className: "value", @state.last_output
    ]
}

MoonScript.compile = (code) ->
  if code == ""
    return new Promise (r) -> r ""

  worker ||= new Worker "worker.js"
  id += 1
  send_id = id
  worker.postMessage [send_id, code]
  new Promise (resolve) ->
    worker.onmessage = (e) ->
      [return_id, compiled] = e.data
      if send_id == return_id
        resolve compiled

MoonScript.render = ->
  body = document.querySelector("#body")
  component = R.MoonScriptCompiler {}
  ReactDOM.render(component, body)

