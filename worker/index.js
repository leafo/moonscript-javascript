import moonscript from './../moonscript.js';

const moduleConfig = {
  locateFile: (path) => path,
};

let resolveModuleReady;
let rejectModuleReady;

const moduleReady = new Promise((resolve, reject) => {
  resolveModuleReady = resolve;
  rejectModuleReady = reject;
});

const modulePromise = moonscript(moduleConfig)
  .then((Module) => {
    if (typeof self !== 'undefined') {
      self.Module = Module;
    } else if (typeof globalThis !== 'undefined') {
      globalThis.Module = Module;
    }

    Module.ready = moduleReady;
    resolveModuleReady?.(Module);
    resolveModuleReady = null;

    const previousOnAbort = Module.onAbort;
    Module.onAbort = (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      try {
        previousOnAbort?.(reason);
      } catch (handlerError) {
        console.error(handlerError);
      }
      if (rejectModuleReady) {
        rejectModuleReady(error);
        rejectModuleReady = null;
      }
    };

    return Module;
  })
  .catch((error) => {
    rejectModuleReady?.(error);
    rejectModuleReady = null;
    throw error;
  });

const serializeError = (error) => ({
  error: error && error.message ? error.message : String(error),
});

const withModule = async (handler) => {
  const Module = await modulePromise;
  return handler(Module);
};

const compile = (Module, code) => {
  const originalPrint = Module.print;
  try {
    Module.print = console.log;
    return Module.ccall('compile_moonscript', 'string', ['string'], [code]);
  } finally {
    Module.print = originalPrint;
  }
};

const execute = (Module, code) => {
  const originalPrint = Module.print;
  const buffer = [];
  try {
    Module.print = (line) => {
      buffer.push(line);
    };

    const result = Module.ccall('run_moonscript', 'string', ['string'], [code]);
    buffer.push(result);
    return buffer.join('\n');
  } finally {
    Module.print = originalPrint;
  }
};

self.onmessage = (event) => {
  const [id, action, code] = event.data;

  withModule((Module) => {
    switch (action) {
      case 'compile':
        return compile(Module, code);
      case 'execute':
        return execute(Module, code);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  })
    .then((result) => {
      self.postMessage([id, result]);
    })
    .catch((error) => {
      self.postMessage([id, serializeError(error)]);
    });
};
