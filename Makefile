
worker.js: worker_head.js min.js
	cat worker_head.js > $@
	cat min.js >> $@

min.js: moonscript.js
	closure < $< > $@
