CC=/usr/lib/emscripten/emcc
FLAGS=-Ilua-5.3.2/src/ -std=gnu99 -DLUA_COMPAT_5_2 -O2 
EMSCRIPTEN_FLAGS=-s EXPORTED_FUNCTIONS="['_compile_moonscript']" -s ALLOW_MEMORY_GROWTH=1

FILES=moonscript.c \
			lua-5.3.2/src/lapi.c \
			lua-5.3.2/src/lauxlib.c \
			lua-5.3.2/src/lbaselib.c \
			lua-5.3.2/src/lbitlib.c \
			lua-5.3.2/src/lcode.c \
			lua-5.3.2/src/lcorolib.c \
			lua-5.3.2/src/lctype.c \
			lua-5.3.2/src/ldblib.c \
			lua-5.3.2/src/ldebug.c \
			lua-5.3.2/src/ldo.c \
			lua-5.3.2/src/ldump.c \
			lua-5.3.2/src/lfunc.c \
			lua-5.3.2/src/lgc.c \
			lua-5.3.2/src/linit.c \
			lua-5.3.2/src/liolib.c \
			lua-5.3.2/src/llex.c \
			lua-5.3.2/src/lmathlib.c \
			lua-5.3.2/src/lmem.c \
			lua-5.3.2/src/loadlib.c \
			lua-5.3.2/src/lobject.c \
			lua-5.3.2/src/lopcodes.c \
			lua-5.3.2/src/loslib.c \
			lua-5.3.2/src/lparser.c \
			lua-5.3.2/src/lstate.c \
			lua-5.3.2/src/lstring.c \
			lua-5.3.2/src/lstrlib.c \
			lua-5.3.2/src/ltable.c \
			lua-5.3.2/src/ltablib.c \
			lua-5.3.2/src/ltm.c \
			lua-5.3.2/src/lundump.c \
			lua-5.3.2/src/lutf8lib.c \
			lua-5.3.2/src/lvm.c \
			lua-5.3.2/src/lzio.c \
			lpeg-1.0.0/lpcap.c \
			lpeg-1.0.0/lpcode.c \
			lpeg-1.0.0/lpprint.c \
			lpeg-1.0.0/lptree.c \
			lpeg-1.0.0/lpvm.c

moonscript.js: $(FILES)
	$(CC) $(FLAGS) $(EMSCRIPTEN_FLAGS) $+ -o $@
	echo ";" >> $@

test.js: test.c
	$(CC) $(FLAGS) $+ -o $@

worker.js: worker_head.js min.js
	cat worker_head.js > $@
	cat min.js >> $@

min.js: moonscript.js
	closure < $< > $@





