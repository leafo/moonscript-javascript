
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
    }

  render: ->
    div children: [
      div className: "header", "MoonScript compiler"

      textarea {
        value: @state.code_input
        onChange: (e) =>
          @setState code_input: e.target.value
      }

      pre className: "value", MoonScript.compile @state.code_input
    ]
}

MoonScript.compile = (code) ->
  return "" if code == ""
  Module.ccall "compile_moonscript", "string", ["string"], [code]

MoonScript.render = ->
  body = document.querySelector("#body")
  component = R.MoonScriptCompiler {}
  ReactDOM.render(component, body)

