import React from 'react';
import ReactDOM from 'react-dom/client';
import { LuaHighlighter } from './highlight.js';

class MoonWorker {
  constructor() {
    this.id = 0;
    this.worker = new Worker('worker.js', { type: 'module' });
    this.listeners = {};

    this.worker.onmessage = (event) => {
      const [responseId, result] = event.data;
      if (this.listeners[responseId]) {
        const callback = this.listeners[responseId];
        delete this.listeners[responseId];
        callback(result);
      }
    };
  }

  send(...args) {
    const sendId = this.id;
    this.id += 1;

    this.worker.postMessage([sendId, ...args]);

    return new Promise((resolve) => {
      this.listen(sendId, resolve);
    });
  }

  listen(id, callback) {
    this.listeners[id] = callback;
  }
}

const blankPromise = Promise.resolve('');

const MoonScript =
  (typeof window !== 'undefined' && window.MoonScript) || {};

class MoonScriptCompiler extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      codeInput: '',
      lastOutput: '',
      initialLoading: false,
      loading: false,
      executing: false,
      version: null,
    };

    this.highlighter = new LuaHighlighter();
    this.inputTimeout = null;

    this.handleInputChange = this.handleInputChange.bind(this);
    this.doExecute = this.doExecute.bind(this);
    this.doCompile = this.doCompile.bind(this);
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
        loading: false,
        executing: false,
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
        loading: false,
      });
    });
  }

  tryCompile() {
    const { initialLoading, executing } = this.state;
    if (initialLoading || executing) {
      return;
    }

    this.clearInputTimeout();
    this.inputTimeout = setTimeout(this.doCompile, 50);
  }

  render() {
    const { initialLoading, executing, loading, version, codeInput, lastOutput } = this.state;

    let statusMessage = 'Ready';
    if (initialLoading) {
      statusMessage = 'Warming up compiler...';
    } else if (executing) {
      statusMessage = 'Executing...';
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
          />
          <div className="button_toolbar">
            <button className="button" onClick={this.doExecute} type="button">
              Execute
            </button>
          </div>
        </div>

        <div className="output_column">
          <div className="output_status">{statusMessage}</div>
          <pre
            className="value code_output"
            key="code_output"
            dangerouslySetInnerHTML={{
              __html: this.highlighter.formatText(lastOutput),
            }}
          />
        </div>
      </div>
    );
  }
}

MoonScript.getWorker = function getWorker() {
  if (!MoonScript.worker) {
    MoonScript.worker = new MoonWorker();
  }
  return MoonScript.worker;
};

MoonScript.compile = function compile(code) {
  if (!code) {
    return blankPromise;
  }

  const worker = MoonScript.getWorker();
  return worker.send('compile', code);
};

MoonScript.execute = function execute(code) {
  if (!code) {
    return blankPromise;
  }

  const worker = MoonScript.getWorker();
  return worker.send('execute', code);
};

MoonScript.getVersion = function getVersion() {
  return MoonScript.execute("return require('moonscript.version').version");
};

MoonScript.render = function render() {
  if (typeof document === 'undefined') {
    return;
  }
  const body = document.querySelector('#body');
  if (!body) {
    return;
  }
  const root = ReactDOM.createRoot(body);
  root.render(<MoonScriptCompiler />);
};

if (typeof window !== 'undefined') {
  window.MoonScript = MoonScript;
}

export { MoonScript, MoonWorker, MoonScriptCompiler };
