#include "lua.h"
#include "lualib.h"
#include "lauxlib.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "moonscript.h"

extern int luaopen_lpeg(lua_State *l);

lua_State *l;

char *last_error = 0;

int _format_error(lua_State *l) {
	int msg = lua_gettop(l);

	lua_getfield(l, LUA_GLOBALSINDEX, "debug");
	lua_getfield(l, -1, "traceback");

	lua_pushvalue(l, msg);
	lua_pushinteger(l, 2);

	lua_call(l, 2, 1);

	return 1;
}

int run_lua(char *code) {
	lua_pushcfunction(l, _format_error);
	luaL_loadstring(l, code);
	if (lua_pcall(l, 0, 0, -2)) {
		// store the error
		if (last_error) {
			free(last_error);
			last_error = 0;
		}

		size_t str_len;
		const char *str = luaL_checklstring(l, -1, &str_len);
		last_error = malloc(str_len + 1);
		memcpy(last_error, str, str_len);
		last_error[str_len] = 0;

		return 1;
	}
	lua_pop(l, 1); // remove handler
	return 0;
}

void write_error() {
	if (last_error) {
		printf("%s\n", last_error);
		free(last_error);
		last_error = 0;
	}
}

int main(int argc, char **argv) {
	printf("%d arguments:\n", argc);
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
}