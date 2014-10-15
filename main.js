define(function(require, exports, module) {
    "use strict";
	var LanguageManager = brackets.getModule("language/LanguageManager");
	var language = LanguageManager.getLanguage("javascript");
	language.addFileExtension("sjs");
	language.addFileExtension("cjs");
	var language = LanguageManager.getLanguage("typescript");
	if(language) {
		language.addFileExtension("sts");
		language.addFileExtension("cts");
	}
});
