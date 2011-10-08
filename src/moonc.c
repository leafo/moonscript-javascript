#include "lua.h"
#include "lualib.h"
#include "lauxlib.h"

#include <stdio.h>

#include "moonscript.h"

extern int luaopen_lpeg(lua_State *l);

lua_State *l;

void run_lua(char *code) {
	luaL_loadstring(l, code);
	lua_call(l, 0, 0);
}

int main(int argc, char **argv) {
	printf("there are %d arguments.\n", argc);
	for (int i = 0; i < argc; i++) {
		printf(" * %s\n", argv[i]);
	}

	l = luaL_newstate();
	luaL_openlibs(l);

	luaopen_lpeg(l);

	if (!luaL_loadbuffer(l, (const char *)moonscript_lua, moonscript_lua_len, "moonscript.lua") == 0) {
		fprintf(stderr, "Failed to load moonscript.lua\n");
		return 1;
	}
	lua_call(l, 0, 0);

	//_luaL_loadstring(l, "print 'hello i am leafo' require 'moonscript' print(moonscript)");
	//_lua_call(l, 0, 0);
}