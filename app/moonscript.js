class MoonWorker {
  constructor() {
    this.id = 0;
    this.worker = new Worker('moonscript-worker.js', { type: 'module' });
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

const MoonScript = {};

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

export { MoonScript, MoonWorker };
