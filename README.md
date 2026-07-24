# MoonScript for JavaScript

This is a version of [MoonScript](http://moonscript.org) that has been compiled to
WebAssembly using [Emscripten](http://emscripten.org).

## About

The Lua source code of MoonScript, taken from the `moonscript` submodule, is
concatenated into a single file by that repo's `bin/splat.moon` and converted to
a header using `xxd`. This is included in a C file along with Lua 5.3.6 and LPeg
1.1.0 which are then compiled to WebAssembly using Emscripten.

A web interface provides an interactive editor for compiling and running MoonScript
in the browser using a Web Worker.

Check it out at <http://moonscript.org/compiler>.

## Building

```bash
git submodule update --init
npm install
make
```

Run `npm start` for a local dev server with watch mode.

