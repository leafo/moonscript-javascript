

FILES= lua/lapi.bc lua/lauxlib.bc lua/lbaselib.bc lua/lcode.bc lua/ldblib.bc lua/ldebug.bc lua/ldo.bc lua/ldump.bc lua/lfunc.bc lua/lgc.bc lua/linit.bc lua/liolib.bc lua/llex.bc lua/lmathlib.bc lua/lmem.bc lua/loadlib.bc lua/lobject.bc lua/lopcodes.bc lua/loslib.bc lua/lparser.bc lua/lstate.bc lua/lstring.bc lua/lstrlib.bc lua/ltable.bc lua/ltablib.bc lua/ltm.bc lua/lundump.bc lua/lvm.bc lua/lzio.bc lua/print.bc lpeg/lpeg.bc moonc.bc


EMSCRIPTEN=/home/leafo/source/emscripten/emscripten.py
# SETTINGS=-O -s OPTIMIZE=1 -s ASSERTIONS=0 -s RELOOP=1
SETTINGS=-s ASSERTIONS=0

FLAG=-m32


moonscript.js: moonscript.bc
	$(EMSCRIPTEN) $(SETTINGS) $< > $@

moonscript.bc: $(FILES)
	llvm-link -o $@ $+

moonscript: moonscript.bc
	llvm-ld -native $+ -o $@ -lm

%.bc: %.c
	clang -c $(FLAG) -emit-llvm $< -o $@

clean:
	-rm $(FILES)
	-rm moonscript.bc
	-rm moonscript.js


