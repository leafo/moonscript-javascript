.PHONY: deploy_targets deploy clean

CC=/usr/lib/emscripten/emcc
LUA_VERSION=5.5.1
LUA_DIR=lua-$(LUA_VERSION)
FLAGS=-I$(LUA_DIR)/src/ -std=gnu99 -Oz
EMSCRIPTEN_FLAGS=\
	-s WASM=1 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s EXPORTED_FUNCTIONS="['_compile_moonscript','_run_moonscript','_lint_moonscript']" \
	-s EXPORTED_RUNTIME_METHODS="['ccall']" \
	-s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=moonscript -s ENVIRONMENT='worker' \
	-s FILESYSTEM=0 \
	-s DISABLE_EXCEPTION_CATCHING=1 \
	-s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
	--closure 1

FILES=moonscript.c \
			moonscript/moonscript/parse/native.c \
			$(LUA_DIR)/src/lapi.c \
			$(LUA_DIR)/src/lauxlib.c \
			$(LUA_DIR)/src/lbaselib.c \
			$(LUA_DIR)/src/lcode.c \
			$(LUA_DIR)/src/lcorolib.c \
			$(LUA_DIR)/src/lctype.c \
			$(LUA_DIR)/src/ldblib.c \
			$(LUA_DIR)/src/ldebug.c \
			$(LUA_DIR)/src/ldo.c \
			$(LUA_DIR)/src/ldump.c \
			$(LUA_DIR)/src/lfunc.c \
			$(LUA_DIR)/src/lgc.c \
			$(LUA_DIR)/src/linit.c \
			$(LUA_DIR)/src/liolib.c \
			$(LUA_DIR)/src/llex.c \
			$(LUA_DIR)/src/lmathlib.c \
			$(LUA_DIR)/src/lmem.c \
			$(LUA_DIR)/src/loadlib.c \
			$(LUA_DIR)/src/lobject.c \
			$(LUA_DIR)/src/lopcodes.c \
			$(LUA_DIR)/src/loslib.c \
			$(LUA_DIR)/src/lparser.c \
			$(LUA_DIR)/src/lstate.c \
			$(LUA_DIR)/src/lstring.c \
			$(LUA_DIR)/src/lstrlib.c \
			$(LUA_DIR)/src/ltable.c \
			$(LUA_DIR)/src/ltablib.c \
			$(LUA_DIR)/src/ltm.c \
			$(LUA_DIR)/src/lundump.c \
			$(LUA_DIR)/src/lutf8lib.c \
			$(LUA_DIR)/src/lvm.c \
			$(LUA_DIR)/src/lzio.c \
			lpeg-1.1.0/lpcap.c \
			lpeg-1.1.0/lpcode.c \
			lpeg-1.1.0/lpcset.c \
			lpeg-1.1.0/lpprint.c \
			lpeg-1.1.0/lptree.c \
			lpeg-1.1.0/lpvm.c

app.js: app/index.jsx $(wildcard app/*.js) moonscript-worker.js
	npx esbuild --bundle app/index.jsx --format=esm --minify --sourcemap --outfile=$@

moonscript-worker.js: worker/moonscript.js $(wildcard worker/*.js)
	npx esbuild --bundle worker/index.js --format=esm --minify --sourcemap --outfile=$@

moonscript.js: moonscript-worker.js app/moonscript.js
	npx esbuild --bundle app/moonscript.js --format=esm --minify --sourcemap --outfile=$@

worker/moonscript.js: $(LUA_DIR) lpeg-1.1.0 build/moonscript.h $(FILES)
	$(CC) $(FLAGS) $(EMSCRIPTEN_FLAGS) $(FILES) -o $@

MOONSCRIPT_LUA=$(shell find moonscript/moonscript moonscript/moon -name '*.lua' 2>/dev/null)

# same recipe the moonscript repo uses to generate bin/binaries/moonscript.h
# slow/grammar are excluded: the native C parser replaces them, and eagerly
# loading moonscript here would require moonscript.parse.native before the C
# module is registered
build/moonscript.h: $(MOONSCRIPT_LUA)
	@test -n "$(MOONSCRIPT_LUA)" || { echo "moonscript submodule is empty, run: git submodule update --init"; exit 1; }
	mkdir -p build
	cd moonscript && bin/splat.moon -x moonscript.parse.slow -x moonscript.parse.grammar moonscript moon > ../build/moonscript.lua
	cd build && xxd -i moonscript.lua > moonscript.h
	rm build/moonscript.lua

$(LUA_DIR):
	curl -O https://www.lua.org/ftp/$(LUA_DIR).tar.gz
	tar xzf $(LUA_DIR).tar.gz

lpeg-1.1.0:
	curl -O https://www.inf.puc-rio.br/~roberto/lpeg/lpeg-1.1.0.tar.gz
	tar xzf lpeg-1.1.0.tar.gz

deploy_targets:
	@echo index.html style.css app.js moonscript-worker.js moonscript.wasm moonscript.js img/github-icon.svg .htaccess
	@find -L ./fonts -type f -name '*.woff' -o -name '*.woff2' -o -name 'stylesheet.css' | sed 's|^\./||'

deploy: app.js moonscript.js moonscript-worker.js
	rsync -RvuzL $$(make -s deploy_targets) leaf@leafo.net:www/moonscript.org/compiler

clean:
	rm -f worker/moonscript.js worker/moonscript.wasm app.js app.js.map moonscript-worker.js moonscript-worker.js.map
	rm -rf build

