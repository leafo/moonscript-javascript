var Module = typeof Module !== 'undefined' ? Module : {};
var __moduleReadyResolve;
var __moduleReadyReject;

Module.ready = new Promise(function(resolve, reject) {
  __moduleReadyResolve = resolve;
  __moduleReadyReject = reject;
});

var existingPostRun = Module.postRun;
if (!existingPostRun) {
  Module.postRun = [];
} else if (typeof existingPostRun === 'function') {
  Module.postRun = [existingPostRun];
}
Module.postRun.push(function() {
  if (__moduleReadyResolve) {
    __moduleReadyResolve();
    __moduleReadyResolve = null;
  }
});

var previousOnAbort = Module.onAbort;
Module.onAbort = function(reason) {
  if (__moduleReadyReject) {
    var error = reason instanceof Error ? reason : new Error(String(reason));
    __moduleReadyReject(error);
    __moduleReadyReject = null;
  }
  if (typeof previousOnAbort === 'function') {
    try {
      previousOnAbort(reason);
    } catch (err) {
      console.error(err);
    }
  }
};

if (typeof Module.locateFile !== 'function') {
  Module.locateFile = function(path) {
    return path;
  };
}

if (typeof self !== 'undefined') {
  self.Module = Module;
} else if (typeof global !== 'undefined') {
  global.Module = Module;
}
