.PHONY: deploy_targets deploy clean

CC=/usr/lib/emscripten/emcc
FLAGS=-Ilua-5.3.6/src/ -std=gnu99 -DLUA_COMPAT_5_2 -Oz
EMSCRIPTEN_FLAGS=\
	-s WASM=1 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s EXPORTED_FUNCTIONS="['_compile_moonscript','_run_moonscript']" \
	-s EXPORTED_RUNTIME_METHODS="['ccall']" \
	-s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=moonscript -s ENVIRONMENT='worker' \
	-s FILESYSTEM=0 \
	-s DISABLE_EXCEPTION_CATCHING=1 \
	-s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
	--closure 1

FILES=moonscript.c \
			lua-5.3.6/src/lapi.c \
			lua-5.3.6/src/lauxlib.c \
			lua-5.3.6/src/lbaselib.c \
			lua-5.3.6/src/lbitlib.c \
			lua-5.3.6/src/lcode.c \
			lua-5.3.6/src/lcorolib.c \
			lua-5.3.6/src/lctype.c \
			lua-5.3.6/src/ldblib.c \
			lua-5.3.6/src/ldebug.c \
			lua-5.3.6/src/ldo.c \
			lua-5.3.6/src/ldump.c \
			lua-5.3.6/src/lfunc.c \
			lua-5.3.6/src/lgc.c \
			lua-5.3.6/src/linit.c \
			lua-5.3.6/src/liolib.c \
			lua-5.3.6/src/llex.c \
			lua-5.3.6/src/lmathlib.c \
			lua-5.3.6/src/lmem.c \
			lua-5.3.6/src/loadlib.c \
			lua-5.3.6/src/lobject.c \
			lua-5.3.6/src/lopcodes.c \
			lua-5.3.6/src/loslib.c \
			lua-5.3.6/src/lparser.c \
			lua-5.3.6/src/lstate.c \
			lua-5.3.6/src/lstring.c \
			lua-5.3.6/src/lstrlib.c \
			lua-5.3.6/src/ltable.c \
			lua-5.3.6/src/ltablib.c \
			lua-5.3.6/src/ltm.c \
			lua-5.3.6/src/lundump.c \
			lua-5.3.6/src/lutf8lib.c \
			lua-5.3.6/src/lvm.c \
			lua-5.3.6/src/lzio.c \
			lpeg-1.1.0/lpcap.c \
			lpeg-1.1.0/lpcode.c \
			lpeg-1.1.0/lpcset.c \
			lpeg-1.1.0/lpprint.c \
			lpeg-1.1.0/lptree.c \
			lpeg-1.1.0/lpvm.c

index.js: index.jsx highlight.js worker.js
	npx esbuild --bundle index.jsx --format=esm --minify --sourcemap --outfile=$@

worker.js: worker/index.js moonscript.js
	npx esbuild --bundle worker/index.js --format=esm --minify --sourcemap --outfile=$@

moonscript.js: lua-5.3.6 lpeg-1.1.0 $(FILES)
	$(CC) $(FLAGS) $(EMSCRIPTEN_FLAGS) $(FILES) -o $@

lua-5.3.6:
	curl -O https://www.lua.org/ftp/lua-5.3.6.tar.gz
	tar xzf lua-5.3.6.tar.gz

lpeg-1.1.0:
	curl -O https://www.inf.puc-rio.br/~roberto/lpeg/lpeg-1.1.0.tar.gz
	tar xzf lpeg-1.1.0.tar.gz

deploy_targets:
	@echo index.html style.css index.js worker.js moonscript.wasm img/github-icon.svg .htaccess
	@find -L ./fonts -type f -name '*.woff' -o -name '*.woff2' -o -name 'stylesheet.css' | sed 's|^\./||'

deploy:
	rsync -RvuzL $$(make -s deploy_targets) leaf@leafo.net:www/moonscript.org/compiler

clean:
	rm -f moonscript.js moonscript.wasm index.js index.js.map worker.js worker.js.map

