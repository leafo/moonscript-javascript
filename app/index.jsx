import React from 'react';
import ReactDOM from 'react-dom/client';
import { LuaHighlighter } from './highlight.js';
import { MoonScript } from './moonscript.js';

class MoonScriptCompiler extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      codeInput: '',
      lastOutput: '',
      outputKind: 'code',
      initialLoading: false,
      loading: false,
      executing: false,
      linting: false,
      version: null,
    };

    this.highlighter = new LuaHighlighter();
    this.inputTimeout = null;

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.doExecute = this.doExecute.bind(this);
    this.doCompile = this.doCompile.bind(this);
    this.doLint = this.doLint.bind(this);
    this.tryCompile = this.tryCompile.bind(this);
    this.clearInputTimeout = this.clearInputTimeout.bind(this);
  }

  componentDidMount() {
    this.setState({ initialLoading: true });

    MoonScript.getVersion().then((version) => {
      this.setState({
        initialLoading: false,
        version,
      });

      this.tryCompile();
    });
  }

  componentWillUnmount() {
    this.clearInputTimeout();
  }

  handleInputChange(event) {
    const { value } = event.target;
    this.setState({ codeInput: value }, this.tryCompile);
  }

  handleKeyDown(event) {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.doExecute();
    }
  }

  clearInputTimeout() {
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
      this.inputTimeout = null;
    }
  }

  doExecute() {
    this.clearInputTimeout();
    this.setState({
      loading: true,
      executing: true,
    });

    const { codeInput } = this.state;
    const toExecute = codeInput;

    MoonScript.execute(toExecute).then((result) => {
      if (toExecute !== this.state.codeInput) {
        return;
      }

      this.setState({
        lastOutput: result,
        outputKind: 'code',
        loading: false,
        executing: false,
      });
    });
  }

  doLint() {
    this.clearInputTimeout();
    this.setState({
      loading: true,
      linting: true,
    });

    const { codeInput } = this.state;
    const toLint = codeInput;

    MoonScript.lint(toLint).then((result) => {
      if (toLint !== this.state.codeInput) {
        return;
      }

      this.setState({
        lastOutput: result || 'No problems found',
        outputKind: 'text',
        loading: false,
        linting: false,
      });
    });
  }

  doCompile() {
    this.clearInputTimeout();
    this.setState({
      loading: true,
    });

    const { codeInput } = this.state;
    const toCompile = codeInput;

    MoonScript.compile(toCompile).then((result) => {
      if (toCompile !== this.state.codeInput) {
        return;
      }

      this.setState({
        lastOutput: result,
        outputKind: 'code',
        loading: false,
      });
    });
  }

  tryCompile() {
    const { initialLoading, executing, linting } = this.state;
    if (initialLoading || executing || linting) {
      return;
    }

    this.clearInputTimeout();
    this.inputTimeout = setTimeout(this.doCompile, 50);
  }

  render() {
    const { initialLoading, executing, linting, loading, version, codeInput, lastOutput, outputKind } = this.state;

    let statusMessage = 'Ready';
    if (initialLoading) {
      statusMessage = 'Warming up compiler...';
    } else if (executing) {
      statusMessage = 'Executing...';
    } else if (linting) {
      statusMessage = 'Linting...';
    } else if (loading) {
      statusMessage = 'Compiling...';
    }

    return (
      <div>
        <div className="header">
          MoonScript online compiler{' '}
          <a className="return_link" href="http://moonscript.org">
            ← Return to MoonScript.org
          </a>
          <div className="header_right">
            {initialLoading ? (
              <span className="status_flag loading">Loading...</span>
            ) : (
              <a
                href="https://github.com/leafo/moonscript/blob/master/CHANGELOG.md"
                className="status_flag ready"
              >
                {version}
              </a>
            )}
            <a className="github_link" href="https://github.com/leafo/moonscript-javascript">
              <img width="30" height="30" src="img/github-icon.svg" alt="GitHub" />
            </a>
          </div>
        </div>

        <div className="code_column">
          <textarea
            value={codeInput}
            className="code_input"
            placeholder="Write MoonScript here..."
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
          />
          <div className="button_toolbar">
            <button className="text_button" onClick={this.doLint} type="button">
              Lint
            </button>
            <button className="button" onClick={this.doExecute} type="button">
              Execute
            </button>
          </div>
        </div>

        <div className="output_column">
          <div className="output_status">{statusMessage}</div>
          {outputKind === 'text' ? (
            <pre className="value code_output" key="code_output">
              {lastOutput}
            </pre>
          ) : (
            <pre
              className="value code_output"
              key="code_output"
              dangerouslySetInnerHTML={{
                __html: this.highlighter.formatText(lastOutput),
              }}
            />
          )}
        </div>
      </div>
    );
  }
}

function render(selector) {
  if (typeof document === 'undefined') {
    return;
  }
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }
  const root = ReactDOM.createRoot(element);
  root.render(<MoonScriptCompiler />);
}

export { MoonScriptCompiler, render };
