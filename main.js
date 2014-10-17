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
	
	var nhpConfig = {
    	name: "clike",
		helperType: "nhp"
	};
	
	//TODO: Separate file for this maybe?
	var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");
	CodeMirror.defineMode("nhp", function(config, parserConfig) {
		var htmlMode = CodeMirror.getMode(config, "text/html");
		var jsMode = CodeMirror.getMode(config, "text/javascript");
		var nhpMode = CodeMirror.getMode(config, nhpConfig);

		function dispatch(stream, state) {
			var isNHP = state.curMode == nhpMode;
			var isJS = state.curMode == jsMode;
			if(stream.sol() && state.pending && state.pending != '"' && state.pending != "'")
				state.pending = null;
			if(!isNHP && !isJS) {
				if(stream.match(/<\?\w+/)) {
					state.curMode = nhpMode;
					state.curState = state.nhp;
					return "meta";
				} else if(stream.match("{{")) {
					state.curMode = jsMode;
					state.curState = state.js;
					return "meta";
				}
				return htmlMode.token(stream, state.curState);
			} else if(isNHP) {
				if(state.nhp.tokenize == null && stream.match("?>")) {
					state.curMode = htmlMode;
					state.curState = state.html;
					return "meta";
				} else {
					var ch = stream.next(); //Eat it all and render it as a string.
					return "string";
				}
			} else if(isJS) {
				if(stream.match("}}")) {
					state.curMode = htmlMode;
					state.curState = state.html;
					return "meta";
				} else {
					try { //TODO: Find out why exceptions occur...
						return jsMode.token(stream, state.curState);
					} catch(e) {
						stream.next();
						return "meta"
					}
				}
			}
		}
		
		return {
			startState: function() {
				var html = CodeMirror.startState(htmlMode),
					nhp = CodeMirror.startState(nhpMode),
					js = CodeMirror.startState(jsMode);
				return {
					html: html,
					nhp: nhp,
					js: js,
					curMode: htmlMode,
					curState: html,
					pending: null
				};
			},

			copyState: function(state) {
				var html = state.html,
					htmlNew = CodeMirror.copyState(htmlMode, html),
					nhp = state.nhp,
					nhpNew = CodeMirror.copyState(nhpMode, nhp),
					js = state.js,
					jsNew = CodeMirror.copyState(jsMode, js),
					cur;
				if (state.curMode == htmlMode)
					cur = htmlNew;
				else if (state.curMode == jsMode)
					cur = jsMode;
				else
					cur = nhpNew;
				return {
					html: htmlNew,
					nhp: nhpNew,
					js: jsNew,
					curMode: state.curMode,
					curState: cur,
					pending: state.pending
				};
			},
			
			token: dispatch,
			
			indent: function(state, textAfter) {
				if(state.curMode == jsMode) {
					return jsMode.indent(state.js, textAfter);
				} else if((state.curMode != nhpMode && /^\s*<\//.test(textAfter)) || (state.curMode == nhpMode && /^\?>/.test(textAfter)))
					return htmlMode.indent(state.html, textAfter);
				return state.curMode.indent(state.curState, textAfter);
			},
			
			innerMode: function(state) {
				return {
					state: state.curState,
					mode: state.curMode
				};
			}
		};
	}, "htmlmixed");

	CodeMirror.defineMIME("text/nhp", "nhp");
	
	LanguageManager.defineLanguage("nhp", {
		name: "NHP",
		mode: "nhp",
		fileExtensions: ["nhp"]
	});
});
