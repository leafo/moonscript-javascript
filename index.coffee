
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
    @highlighter = new LuaHighlighter()

    {
      code_input: ""
      last_output: ""
    }

  componentDidMount: ->
    @setState initial_loading: true

    MoonScript.get_version().then (version) =>
      @setState {
        initial_loading: false
        version: version
      }

      @try_compile()

  do_execute: ->
    @setState {
      input_timeout: null
      loading: true
      executing: true
    }

    to_execute = @state.code_input
    MoonScript.execute(to_execute).then (res) =>
      return unless to_execute == @state.code_input

      @setState {
        last_output: res
        loading: false
        executing: false
      }


  do_compile: ->
    @setState {
      input_timeout: null
      loading: true
    }

    to_compile = @state.code_input
    MoonScript.compile(to_compile).then (res) =>
      return unless to_compile == @state.code_input

      @setState {
        last_output: res
        loading: false
      }

  try_compile: ->
    return if @state.initial_loading
    return if @state.executing

    if @state.input_timeout
      clearTimeout @state.input_timeout

    @setState {
      input_timeout: setTimeout @do_compile, 50
    }

  render: ->
    div children: [
      div className: "header", children: [
        "MoonScript online compiler"
        " "
        a className: "return_link", href: "http://moonscript.org", "← Return to MoonScript.org"

        div className: "header_right", children: [
          if @state.initial_loading
            span className: "status_flag loading", "Loading..."
          else
            a href: "https://github.com/leafo/moonscript/blob/master/CHANGELOG.md", className: "status_flag ready", "#{@state.version}"

          a className: "github_link", href: "https://github.com/leafo/moonscript-javascript",
            img width: "30", height: "30", src: "img/github-icon.svg"
        ]
      ]

      div className: "code_column", children: [
        textarea {
          value: @state.code_input
          className: "code_input"
          placeholder: "Write MoonScript here..."
          onChange: (e) =>
            @setState code_input: e.target.value
            @try_compile()
        }
        div className: "button_toolbar", children: [
          button {
            className: "button"
            onClick: @do_execute
          }, "Execute"
        ]
      ]

      div className: "output_column", children: [
        div className: "output_status", children: [
          if @state.initial_loading
            "Warming up compiler..."
          else if @state.executing
            "Executing..."
          else if @state.loading
            "Compiling..."
          else
            "Ready"
        ]

        pre {
          className: "value code_output"
          key: "code_output"
          dangerouslySetInnerHTML: {
            __html: @highlighter.format_text @state.last_output
          }
        }
      ]

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

blank_promise = new Promise (r) -> r ""

MoonScript.compile = (code) ->
  return blank_promise if code == ""

  worker = MoonScript.get_worker()
  worker.send "compile", code

MoonScript.execute = (code) ->
  return blank_promise if code == ""
  worker = MoonScript.get_worker()
  worker.send "execute", code

MoonScript.get_version = ->
  MoonScript.execute "print require('moonscript.version').version"

MoonScript.render = ->
  body = document.querySelector("#body")
  component = R.MoonScriptCompiler {}
  ReactDOM.render(component, body)

