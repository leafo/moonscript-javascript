import moonscript from './moonscript.js';

const buildId = typeof BUILD_ID === 'string' ? BUILD_ID : 'dev';

const moduleConfig = {
  locateFile: (path) => `${path}?v=${buildId}`,
  print: (text) => {
    if (moduleConfig.printHandler) {
      moduleConfig.printHandler(text);
    } else {
      console.log(text);
    }
  },
  printErr: (text) => {
    console.error(text);
  },
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

const luaTableLiteral = (options) => {
  const fields = Object.entries(options || {}).map(([key, value]) => {
    switch (typeof value) {
      case 'boolean':
      case 'number':
        return `${key} = ${value}`;
      case 'string':
        return `${key} = ${JSON.stringify(value)}`;
      default:
        throw new Error(`Unsupported option value for ${key}`);
    }
  });
  return fields.length ? `{ ${fields.join(', ')} }` : '';
};

const compile = (Module, code, options) => {
  const originalHandler = moduleConfig.printHandler;
  try {
    moduleConfig.printHandler = console.log;
    return Module.ccall('compile_moonscript', 'string', ['string', 'string'], [code, luaTableLiteral(options)]);
  } finally {
    moduleConfig.printHandler = originalHandler;
  }
};

const lint = (Module, code) => {
  const originalHandler = moduleConfig.printHandler;
  try {
    moduleConfig.printHandler = console.log;
    return Module.ccall('lint_moonscript', 'string', ['string'], [code]);
  } finally {
    moduleConfig.printHandler = originalHandler;
  }
};

const execute = (Module, code) => {
  const originalHandler = moduleConfig.printHandler;
  const buffer = [];
  try {
    moduleConfig.printHandler = (line) => {
      buffer.push(line);
    };

    const result = Module.ccall('run_moonscript', 'string', ['string'], [code]);
    if (result) buffer.push(result);
    return buffer.join('\n');
  } finally {
    moduleConfig.printHandler = originalHandler;
  }
};

self.onmessage = (event) => {
  const [id, action, code, options] = event.data;

  withModule((Module) => {
    switch (action) {
      case 'compile':
        return compile(Module, code, options);
      case 'execute':
        return execute(Module, code);
      case 'lint':
        return lint(Module, code);
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
