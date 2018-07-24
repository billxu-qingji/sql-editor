// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
	if (typeof exports == "object" && typeof module == "object") {// CommonJS
		mod(require("../../lib/codemirror"), require("../../mode/sql/sql"));
	} else if (typeof define == "function" && define.amd) {// AMD
		define([ "../../lib/codemirror", "../../mode/sql/sql" ], mod);
	} else {
		mod(CodeMirror);
	} // Plain browser env
})(function(CodeMirror) {
	"use strict";
	var keywords;
	var cmKeywords;
	var cmFunctions;
	var CONS = {
		QUERY_DIV : ";",
		ALIAS_KEYWORD : "AS"
	};
	var Pos = CodeMirror.Pos;
	var tablePrefixKey = ["INTO", "FROM", "UPDATE", "JOIN", "ON", "TABLE"];
	var columnPrefixKey = ["SET", "WHERE", "BY", "AND", "OR", ","];

	function getKeywords(editor) {
		var mode = editor.doc.modeOption;
		if (mode === "sql") {
			mode = "text/x-sql";
		}
		return CodeMirror.resolveMode(mode).keywords;
	}
	function getCmKeywords(editor) {
		var tmpKeywords = keywords || getKeywords(editor);
		var cloneKeywords = new Object();
		for (var key in tmpKeywords) {
			cloneKeywords[key] = tmpKeywords[key];
		}
		for (var i = 0; i < CM_ALL_KEYS.length; i ++) {
			delete cloneKeywords[CM_ALL_KEYS[i].toLowerCase()];
		}
		return cloneKeywords;
	}
	function getBuiltin(editor) {
		var mode = editor.doc.modeOption;
		if (mode === "sql") {
			mode = "text/x-sql";
		}
		return CodeMirror.resolveMode(mode).builtin;
	}
	function getFunction(editor) {
		var mode = editor.doc.modeOption;
		if (mode === "sql") {
			mode = "text/x-sql";
		}
		return CodeMirror.resolveMode(mode).functions;
	}
	function getCmFunctions(editor) {
		var tmpFunctions = getFunction(editor);
		var cloneFunctions = new Object();
		for (var func in tmpFunctions) {
			cloneFunctions[func] = tmpFunctions[func];
		}
		for (var i = 0; i < CM_FUNC.length; i ++) {
			delete cloneFunctions[CM_FUNC[i].toLowerCase()];
		}
		return cloneFunctions;
	}

	function match(string, word) {
		if (typeof word === 'string') {
			var len = string.length;
			var sub = word.substr(0, len);
			return string.toUpperCase() === sub.toUpperCase();
		}
	}

	// codemirror 婧愮敓鎺ュ彛
	function addMatches(result, search, wordlist, formatter) {
		for ( var word in wordlist) {
			if (!wordlist.hasOwnProperty(word))
				continue;
			if (Array.isArray(wordlist)) {
				word = wordlist[word];
			}
			if (match(search, word)) {
				pushCustomWords(word, result);
				result.push(formatter(word));
			}
		}
	}

	// codemirror rewrite addMatches鎺ュ彛 澧炲姞鍥捐〃绫诲瀷鐨勮緭鍏�
	function addMatches(result, search, wordlist, formatter, typeResults) {
		for ( var word in wordlist) {
			if (!wordlist.hasOwnProperty(word)) {
				continue;
			}
			if (word === CM_COMMENT_PROPERTY || word === CM_DATA_INFO_PROPERTY){//鐢ㄤ簬comment鍜宒atainfo鐨勪俊鎭洿鎺ヨ繃婊�
				continue;
			}
			if (Array.isArray(wordlist)) {
				word = wordlist[word];
			}
			if (match(search, word)) {
				pushCustomWords(word, result, typeResults);
				result.push(formatter(word));
				var otherData = typeResults();
				if (wordlist[word] && wordlist[word].__cm__comment) {//娣诲姞comment鐨勬暟鎹�
					otherData.comments.push(wordlist[word].__cm__comment);
				} else {
					otherData.comments.push('');
				}
				if (wordlist[word] && wordlist[word].__cm__datainfo) {
					otherData.datainfo.push(wordlist[word].__cm__datainfo);
				} else {
					otherData.datainfo.push('');
				}
			}
		}
	}
	
	function addTableMatches(result, search, wordlist, formatter, typeResults) {
		if (wordlist.hasOwnProperty(CM_NOW_TABLE) && match(search, CM_NOW_TABLE)) {
			pushCustomWords(CM_NOW_TABLE, result, typeResults);
			result.push(formatter(CM_NOW_TABLE));
			var otherData = typeResults();
			if (wordlist[CM_NOW_TABLE] && wordlist[CM_NOW_TABLE].__cm__comment) {
				otherData.comments.push(wordlist[CM_NOW_TABLE].__cm__comment);
			} else {
				otherData.comments.push('');
			}
			if (wordlist[CM_NOW_TABLE] && wordlist[CM_NOW_TABLE].__cm__datainfo) {
				otherData.datainfo.push(wordlist[CM_NOW_TABLE].__cm__datainfo);
			} else {
				otherData.datainfo.push('');
			}
		}
		for (var word in wordlist) {
			if (!wordlist.hasOwnProperty(word) || word === CM_NOW_TABLE) {
				continue;
			}
			if (word === CM_COMMENT_PROPERTY || word === CM_DATA_INFO_PROPERTY) {//杩囨护鎸囧畾瀛楁
				continue;
			}
			if (Array.isArray(wordlist)) {
				word = wordlist[word];
			}
			if (match(search, word)) {
				pushCustomWords(word, result, typeResults);
				result.push(formatter(word));
				var otherData = typeResults();
				if (wordlist[word] && wordlist[word].__cm__comment) {
					otherData.comments.push(wordlist[word].__cm__comment);
				} else {
					otherData.comments.push('');
				}
				if (wordlist[word] && wordlist[word].__cm__datainfo) {
					otherData.datainfo.push(wordlist[word].__cm__datainfo);
				} else {
					otherData.datainfo.push('');
				}
			}
		}
	}	

	function eachWord(lineText, f) {
		if (!lineText) {
			return;
		}
		var excepted = /[,;]/g;
		var words = lineText.split(/\s+/);
		for (var i = 0; i < words.length; i++) {
			f(words[i] ? words[i].replace(excepted, '') : '');
		}
	}

	function convertCurToNumber(cur) {
		// max characters of a line is 999,999.
		return cur.line + cur.ch / Math.pow(10, 6);
	}

	function convertNumberToCur(num) {
//		return Pos(Math.floor(num), +num.toString().split('.').pop());
		var line = Math.floor(num);
		var ch = (num - line) * Math.pow(10, 6);
		return Pos(line, ch);
	}

	function findTableByAlias(alias, editor) {
		var mode = editor.options.mode;
		var doc = editor.doc;
		var fullQuery = doc.getValue();
		var aliasUpperCase = alias.toUpperCase();
		var previousWord = "";
		var table = "";
		var separator = [];
		var validRange = {
			start : Pos(0, 0),
			end : Pos(editor.lastLine(), editor
					.getLineHandle(editor.lastLine()).length)
		};

		// add separator
		var indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV);
		while (indexOfSeparator != -1) {
			separator.push(doc.posFromIndex(indexOfSeparator));
			indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV,
					indexOfSeparator + 1);
		}
		separator.unshift(Pos(0, 0));
		separator.push(Pos(editor.lastLine(), editor.getLineHandle(editor
				.lastLine()).text.length));

		// find valid range
		var prevItem = 0;
		var current = convertCurToNumber(editor.getCursor());
		for (var i = 0; i < separator.length; i++) {
			var _v = convertCurToNumber(separator[i]);
			if (current > prevItem && current <= _v) {
				validRange = {
					start : convertNumberToCur(prevItem),
					end : convertNumberToCur(_v)
				};
				break;
			}
			prevItem = _v;
		}

		var query = doc.getRange(validRange.start, validRange.end, false);

		for (var i = 0; i < query.length; i++) {
			var lineText = query[i];
			eachWord(lineText, function(word) {
				var wordUpperCase = word.toUpperCase();
				if (wordUpperCase === aliasUpperCase) {
					if (mode === "text/x-mssql") {
						var previousArray = previousWord.split(".");
						var preLen = previousArray.length;
						var preTableName = previousArray[preLen - 1].replace(getRegTableReplace(editor), "");
						var preSchemaName = preLen >= 2 ? previousArray[preLen - 2].replace(getRegTableReplace(editor), "") : CM_NOW_SCHEMA;
						var preDbName = preLen === 3 ? previousArray[preLen - 3].replace(getRegTableReplace(editor), "") : CM_NOW_DATABASE;
						if (CM_DATABASES.hasOwnProperty(preDbName) && CM_DATABASES[preDbName] && 
							CM_DATABASES[preDbName].hasOwnProperty(preSchemaName) && CM_DATABASES[preDbName][preSchemaName] &&
							CM_DATABASES[preDbName][preSchemaName].hasOwnProperty(preTableName)) {
							table = preDbName.concat(".").concat(preSchemaName).concat(".").concat(preTableName);
						}
					} else {
						var dbTable = previousWord.split(".");
						if (dbTable.length <= 0 || dbTable.length > 2) {
							table = "";
						} else {
							var tableName = dbTable[dbTable.length - 1].replace(getRegTableReplace(editor), "");
							var dbName = dbTable.length >= 2 ? dbTable[dbTable.length - 2].replace(getRegTableReplace(editor), "") : CM_NOW_DATABASE;
							if (CM_DATABASES.hasOwnProperty(dbName) && CM_DATABASES[dbName] && CM_DATABASES[dbName].hasOwnProperty(tableName)) {
								table = dbName.concat(".").concat(tableName);
							}
						}
					}
				}
				if (wordUpperCase !== CONS.ALIAS_KEYWORD) {
					if (word.match(/`/g)) {//  MYSQL
						word = word.replace(/`/g, "");
					} else if (word.match(/"/g)) {//  PG
						// ORACLE
						word = word.replace(/"/g, "");
					} else if (word.match(/\[.*\]/g)) {// 褰撹〃鍚嶅姞宸ュ悗浣跨敤鍒悕鏃犳晥鐨勯棶棰樹慨澶�
						// SQLSERVER
						word = word.replace(/\[/g, "");
						word = word.replace(/\]/g, "");
					}
					previousWord = word;
				}
			});
			if (table)
				break;
		}
		return table;
	}
	
	function initSqlserverTableColumns(sql, editor) {
		if (!sql || sql.length <= 0) {
			return;
		}
		var resArray = [];
		//鍖归厤鍏抽敭瀛�
		var compareKeys = ["INTO", "FROM", "UPDATE", "JOIN", "TABLE"];//鍘绘帀ON
		for (var i= 0; i < compareKeys.length; i ++) {
			var idx = sql.toUpperCase().indexOf(compareKeys[i] + " ");//鍏抽敭瀛楀悗鍔犵┖鏍间互鍖哄垎鍏朵粬鍚嶇О鍐呭寘鍚叧閿瓧鐨勬儏鍐�
			if (idx >= 0) {
				var sqlArray = sql.substring(idx).split(/\s+/);
				if (sqlArray.length >= 2 && sqlArray[1].trim()) {
					var tableName_brackets = sqlArray[1];
					var idx_brackets = tableName_brackets.indexOf("(");
					var tableName = "";
					if (idx_brackets >= 0) {
						tableName = tableName_brackets.substring(0, idx_brackets);
					} else {
						tableName = tableName_brackets;
					}
					resArray.push(tableName);
				}
			}
		}
		//鎷嗗垎鎵€绛涢€夊嚭鐨勮〃鍚�
		var stArray = [];
		for (var iter = 0; iter < resArray.length; iter ++) {
			var dbTableArray = resArray[iter].split(".");
			if (dbTableArray.length >= 3) {
				var dbName = dbTableArray[0].replace(getRegTableReplace(editor), "");
				var schemaName = dbTableArray[1].replace(getRegTableReplace(editor), "");
				var tableName = dbTableArray[2].replace(getRegTableReplace(editor), "");
				if (CM_DATABASES.hasOwnProperty(dbName)) {
					//鏇存柊鎵€鐢ㄦ暟鎹簱琛ㄥ悕
					if (!CM_DATABASES[dbName]) {
						updateSqlserverDbSchemaTables([dbName], editor);
					}
					if (CM_DATABASES[dbName] && CM_DATABASES[dbName].hasOwnProperty(schemaName) && CM_DATABASES[dbName][schemaName] && CM_DATABASES[dbName][schemaName].hasOwnProperty(tableName)) {
						stArray.push(dbName.concat(".").concat(schemaName).concat(".").concat(tableName));
					}
				}					
			} else if (dbTableArray.length == 2) {
				var firstName = dbTableArray[0].replace(getRegTableReplace(editor), "");
				var secondName = dbTableArray[1].replace(getRegTableReplace(editor), "");
				if (CM_DATABASES.hasOwnProperty(firstName) && !CM_DATABASES[firstName]) {
					updateSqlserverDbSchemaTables([firstName], editor);
				}
				if (CM_SCHEMAS.hasOwnProperty(firstName) && CM_SCHEMAS[firstName] && CM_SCHEMAS[firstName].hasOwnProperty(secondName)) {
					stArray.push(firstName.concat(".").concat(secondName));
				}
			} else if (dbTableArray.length == 1) {
				var tmpName = dbTableArray[0].replace(getRegTableReplace(editor), "");
				if (CM_DATABASES.hasOwnProperty(tmpName) && !CM_DATABASES[tmpName]) {
					updateSqlserverDbSchemaTables([tmpName], editor);
				}				
				if (CM_TABLES.hasOwnProperty(tmpName)) {
					stArray.push(CM_NOW_SCHEMA.concat(".").concat(tmpName));
				}
			}
		}
		updateSqlserverTableColumns(stArray, editor);
	}
	
	function initMysqlTableColumns(sql, editor) {
		if (!sql || sql.length <= 0) {
			return;
		}
		var resArray = [];
		//鍖归厤鍏抽敭瀛�
		var compareKeys = ["INTO", "FROM", "UPDATE", "JOIN", "TABLE"];//鍘绘帀ON
		for (var i= 0; i < compareKeys.length; i ++) {//鍖归厤鍏抽敭瀛�
			var idx = sql.toUpperCase().indexOf(compareKeys[i] + " ");//涓よ竟鍔犱笂绌烘牸鐢ㄤ互鍖哄垎鍏朵粬鍚嶇О鍐呭寘鍚叧閿瓧鐨勬儏鍐�
			if (idx >= 0) {
				var sqlArray = sql.substring(idx).split(/\s+/);
				if (sqlArray.length >= 2 && sqlArray[1].trim()) {
					var tableName_brackets = sqlArray[1];
					var idx_brackets = tableName_brackets.indexOf("(");
					var tableName = "";
					if (idx_brackets >= 0) {
						tableName = tableName_brackets.substring(0, idx_brackets);
					} else {
						tableName = tableName_brackets;
					}
					resArray.push(tableName);
				}
			}
		}
		//鎷嗗垎鎵€绛涢€夊嚭鐨勮〃鍚�
		var stArray = [];
		for (var iter = 0; iter < resArray.length; iter ++) {
			var dbTableArray = resArray[iter].split(".");
			if (dbTableArray.length >= 2) {
				var dbName = dbTableArray[0].replace(getRegTableReplace(editor), "");
				var tableName = dbTableArray[1].replace(getRegTableReplace(editor), "");
				if (CM_DATABASES.hasOwnProperty(dbName)) {
					//鏇存柊鎵€鐢ㄦ暟鎹簱琛ㄥ悕
					if (!CM_DATABASES[dbName]) {
						updateMysqlDatabaseTables([dbName], editor);
					}
					if (CM_DATABASES[dbName] && CM_DATABASES[dbName].hasOwnProperty(tableName)) {
						stArray.push(dbName.concat(".").concat(tableName));
					}
				}
			} else if (dbTableArray.length == 1) {
				var tmpName = dbTableArray[0].replace(getRegTableReplace(editor), "");
				if (CM_DATABASES.hasOwnProperty(tmpName) && !CM_DATABASES[tmpName]) {
					updateMysqlDatabaseTables([tmpName], editor);
				}
				if (CM_TABLES.hasOwnProperty(tmpName)) {
					stArray.push(CM_NOW_DATABASE.concat(".").concat(tmpName));
				}
			}
		}
		updateMysqlTableColumns(stArray, editor);
	}
	
	function autoMatchLastWord(editor, result, search, otherData) {
		var type = cmLastWord.type;
		var value = cmLastWord.value;
		if (type === keyType && containValue(tablePrefixKey, value.toUpperCase())) {
			addTableMatches(result, search, CM_TABLES, function(w) {return w;}, function() {otherData.types.push(tableType); return otherData;});
			addTableMatches(result, search, CM_SCHEMAS, function(w) {return w;}, function() {otherData.types.push(schemaType); return otherData;});
			addTableMatches(result, search, CM_DATABASES, function(w) {return w;}, function() {otherData.types.push(sourceType); return otherData;});
		} else if (type === keyType && containValue(columnPrefixKey, value.toUpperCase())) {
			addMatches(result, search, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
		} else if (type === keyType && value.toUpperCase() === "SELECT") {
			addMatches(result, search, CM_STAR, function(w) {return w.toUpperCase();}, function() {otherData.types.push(functionType); return otherData;});
			addMatches(result, search, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
			addMatches(result, search, CM_FUNC, function(w) {return w;}, function() {otherData.types.push(functionType); return otherData;});			
			addTableMatches(result, search, CM_TABLES, function(w) {return w;}, function() {otherData.types.push(tableType); return otherData;});
		} else if (type === functionType && value === '*') {
			addMatches(result, search, CM_FROM, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
		} else if (type === columnType) {
			addMatches(result, search, CM_CONN, function(w) {return w;}, function() {otherData.types.push(keyType); return otherData;});
			addMatches(result, search, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
			addMatches(result, search, CM_AND_OR, function(w) {return w;}, function() {otherData.types.push(keyType); return otherData;});
		} else if (type === tableType) {
			addMatches(result, search, CM_CONDITIONS, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
			addMatches(result, search, CM_JOIN, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
			addMatches(result, search, CM_SET, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
		} else if (type === keyType && value.toUpperCase() === "NULL") {
			addMatches(result, search, CM_AND_OR, function(w) {return w;}, function() {otherData.types.push(keyType); return otherData;});
			addMatches(result, search, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
		} else if (type === keyType || type === sourceType || type === schemaType) {//鍏朵粬KEY鏆傛椂涓嶇粰鎻愮ず
	    } else {
			addMatches(result, search, getFunction(editor), function(w) {return w;}, function() {otherData.types.push(functionType); return otherData;});
			addMatches(result, search, getBuiltin(editor), function(w) {return w.toUpperCase();}, function() {otherData.types.push(propertyType); return otherData;});
			addMatches(result, search, keywords, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
		}
	}
	
	function autoMatchCursorWord(editor, result, search, otherData, cursorWord) {
		var mode = editor.options.mode;
		if (containValue(tablePrefixKey, cursorWord.toUpperCase())) {
			addTableMatches(result, search, CM_TABLES, function(w) {return w;}, function() {otherData.types.push(tableType); return otherData;});
			addTableMatches(result, search, CM_SCHEMAS, function(w) {return w;}, function() {otherData.types.push(schemaType); return otherData;});
			addTableMatches(result, search, CM_DATABASES, function(w) {return w;}, function() {otherData.types.push(sourceType); return otherData;});
		} else if (containValue(columnPrefixKey, cursorWord.toUpperCase())) {
			addMatches(result, search, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
		} else if (cursorWord.toUpperCase() === "SELECT") {
			addMatches(result, search, CM_STAR, function(w) {return w.toUpperCase();}, function() {otherData.types.push(functionType); return otherData;});
			addMatches(result, search, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
			addMatches(result, search, CM_FUNC, function(w) {return w;}, function() {otherData.types.push(functionType); return otherData;});			
			addTableMatches(result, search, CM_TABLES, function(w) {return w;}, function() {otherData.types.push(tableType); return otherData;});
		} else if (cursorWord === "(") {
			var tmpCursor = editor.getCursor();
			var iterLine = tmpCursor.line;
			var tmpToken = editor.getTokenAt(Pos(iterLine, tmpCursor.ch - 1));
			if (tmpToken.string && !tmpToken.string.trim()) {
				tmpToken = editor.getTokenAt(Pos(iterLine, tmpToken.start));
			}
			while ((!tmpToken.string || tmpToken.string.length <= 0) && iterLine > 0) {
				tmpToken = editor.getTokenAt(Pos(-- iterLine));
				while (tmpToken.string && !tmpToken.string.trim()) {
					tmpToken = editor.getTokenAt(Pos(iterLine, tmpToken.start));
				}
			}
			if (getRegEnd(editor).test(tmpToken.string)) {
				addMatches(result, search, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
			} else if (tmpToken.string.toUpperCase() != "VALUES") {
				addMatches(result, search, CM_STAR, function(w) {return w.toUpperCase();}, function() {otherData.types.push(functionType); return otherData;});
				addMatches(result, search, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
				addMatches(result, search, CM_FUNC, function(w) {return w;}, function() {otherData.types.push(functionType); return otherData;});			
				addTableMatches(result, search, CM_TABLES, function(w) {return w;}, function() {otherData.types.push(tableType); return otherData;});
				addTableMatches(result, search, CM_SCHEMAS, function(w) {return w;}, function() {otherData.types.push(schemaType); return otherData;});
				addTableMatches(result, search, CM_DATABASES, function(w) {return w;}, function() {otherData.types.push(sourceType); return otherData;});
			}
		} else if (cursorWord === "*" ||  cursorWord === ")") {
			addMatches(result, search, CM_FROM, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
		} else if (getRegEnd(editor).test(cursorWord)) {
			var cur = editor.getCursor();
			var iterLine = cur.line;
			var token = editor.getTokenAt(cur);
			if (token.string && !token.string.trim()) {
				token = editor.getTokenAt(Pos(iterLine, token.start));
			}
			while ((!token.string || token.string.length <= 0) && iterLine > 0) {
				token = editor.getTokenAt(Pos(-- iterLine));
				while (token.string && !token.string.trim()) {
					token = editor.getTokenAt(Pos(iterLine, token.start));
				}
			}
			var nowString = token.string;
			var prevToken = editor.getTokenAt(Pos(iterLine, token.start));
			while (prevToken.string && prevToken.string.match(getDbScTbNameReg(editor))) {//闃叉鎶婅〃鍚嶅墠闈㈢殑(绛夊唴瀹逛竴骞剁畻杩涙潵
				nowString = prevToken.string.concat(nowString);
				prevToken = editor.getTokenAt(Pos(iterLine, prevToken.start));
			}
			var nowArray = nowString.split(".");
			var nowArraylen = nowArray.length;
			var lastString = nowArray[nowArraylen - 1].replace(getRegTableReplace(editor), "");
			if (containValue(CM_NOW_COLUMNS, lastString)) {
				addMatches(result, search, CM_CONN, function(w) {return w;}, function() {otherData.types.push(keyType); return otherData;});
				addMatches(result, search, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
				addMatches(result, search, CM_AND_OR, function(w) {return w;}, function() {otherData.types.push(keyType); return otherData;});
			} else {
				var tbFlag = false;
				if (nowArraylen == 1) {
					if (CM_TABLES.hasOwnProperty(lastString)) {
						tbFlag = true;
					}
				} else if (nowArraylen == 2) {
					var firstString = nowArray[nowArraylen - 2].replace(getRegTableReplace(editor), "");
					if (CM_SCHEMAS.hasOwnProperty(firstString) && CM_SCHEMAS[firstString] && CM_SCHEMAS[firstString].hasOwnProperty(lastString)) {
						tbFlag = true;
					}
				} else if (nowArraylen == 3) {
					var firstString = nowArray[nowArraylen - 3].replace(getRegTableReplace(editor), "");
					var secondString = nowArray[nowArraylen - 2].replace(getRegTableReplace(editor), "");
					if (CM_DATABASES.hasOwnProperty(firstString) && CM_DATABASES[firstString] && CM_DATABASES[firstString].hasOwnProperty(secondString) 
							&& CM_DATABASES[firstString][secondString] && CM_DATABASES[firstString][secondString].hasOwnProperty(lastString)) {
						tbFlag = true;
					}
				}
				if (tbFlag) {
					addMatches(result, search, CM_CONDITIONS, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
					addMatches(result, search, CM_JOIN, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
					addMatches(result, search, CM_SET, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
				}
			}
		} else {
			if (search && search.length > 0) {
				var tmpCur = editor.getCursor();//澧炲姞鍏夋爣浣嶇疆鍒ゆ柇
				var iterLine = tmpCur.line;
				var tmpToken = editor.getTokenAt(Pos(iterLine, editor.getTokenAt(tmpCur).start));
				
				if (tmpToken.string && !tmpToken.string.trim()) {
					tmpToken = editor.getTokenAt(Pos(iterLine, tmpToken.start));
				}
				while ((!tmpToken.string || tmpToken.string.length <= 0) && iterLine > 0) {
					tmpToken = editor.getTokenAt(Pos(-- iterLine));
					while (tmpToken.string && !tmpToken.string.trim()) {
						tmpToken = editor.getTokenAt(Pos(iterLine, tmpToken.start));
					}
				}
				var nowString = tmpToken.string;
				var prevToken = editor.getTokenAt(Pos(iterLine, tmpToken.start));
				while (prevToken.string && prevToken.string.match(getDbScTbNameReg(editor))) {//闃叉鎶婅〃鍚嶅墠闈㈢殑(绛夊唴瀹逛竴骞剁畻杩涙潵
					nowString = prevToken.string.concat(nowString);
					prevToken = editor.getTokenAt(Pos(iterLine, prevToken.start));
				}
				var nowArray = nowString.split(".");
				var nowArraylen = nowArray.length;
				var lastString = nowArray[nowArraylen - 1].replace(getRegTableReplace(editor), "");
				var tbFlag = false;
				if (nowArraylen == 1) {
					if (CM_TABLES.hasOwnProperty(lastString)) {
						tbFlag = true;
					}
				} else if (nowArraylen == 2) {
					var firstString = nowArray[nowArraylen - 2].replace(getRegTableReplace(editor), "");
					var mode = editor.options.mode;
					if ((mode === "text/x-mssql") && CM_SCHEMAS.hasOwnProperty(firstString) && CM_SCHEMAS[firstString] && CM_SCHEMAS[firstString].hasOwnProperty(lastString)) {
						tbFlag = true;
				    } else if ((mode === "text/x-mysql") && CM_DATABASES.hasOwnProperty(firstString) && CM_DATABASES[firstString] && CM_DATABASES[firstString].hasOwnProperty(lastString)) {
				    	tbFlag = true;
				    }
				} else if (nowArraylen == 3) {
					var firstString = nowArray[nowArraylen - 3].replace(getRegTableReplace(editor), "");
					var secondString = nowArray[nowArraylen - 2].replace(getRegTableReplace(editor), "");
					if (CM_DATABASES.hasOwnProperty(firstString) && CM_DATABASES[firstString] && CM_DATABASES[firstString].hasOwnProperty(secondString) 
							&& CM_DATABASES[firstString][secondString] && CM_DATABASES[firstString][secondString].hasOwnProperty(lastString)) {
						tbFlag = true;
					}
				}
				if (tbFlag) {
					addMatches(result, search, CM_CONDITIONS, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
					addMatches(result, search, CM_JOIN, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
					addMatches(result, search, CM_SET, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
				} else if ("AS" === lastString.toUpperCase()) {//涓嶆彁绀�
			 	} else {
					addMatches(result, search, CM_AND_OR.concat(CM_CONDITIONS).concat(["FROM"]).concat(CM_CONN).concat(CM_START).concat(CM_SET), function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
					addMatches(result, search, CM_JOIN, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
					addMatches(result, search, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
					addMatches(result, search, CM_FUNC, function(w) {return w;}, function() {otherData.types.push(functionType); return otherData;});
					addMatches(result, search, cmFunctions, function(w) {return w;}, function() {otherData.types.push(functionType); return otherData;});
					addTableMatches(result, search, CM_TABLES, function(w) {return w;}, function() {otherData.types.push(tableType); return otherData;});
					addTableMatches(result, search, CM_SCHEMAS, function(w) {return w;}, function() {otherData.types.push(schemaType); return otherData;});
					addTableMatches(result, search, CM_DATABASES, function(w) {return w;}, function() {otherData.types.push(sourceType); return otherData;});
					addMatches(result, search, getBuiltin(editor), function(w) {return w.toUpperCase();}, function() {otherData.types.push(propertyType); return otherData;});
					addMatches(result, search, cmKeywords, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
				}
			}
		}
	}
	
	function nameSqlserverCompletion(result, editor, otherData) {
		var cur = editor.getCursor();
		var iterLine = cur.line;
		var token = editor.getTokenAt(cur);
		var useEscape = (token.string.charAt(0) == getEscapeCharacter(editor));
		var lastString = token.string.substr(1);
		var prevToken = editor.getTokenAt(Pos(iterLine, token.start));
		var nowString =  token.string;
		while (prevToken.string && prevToken.string.match(getDbScTbNameReg(editor))) {//闃叉鎶婅〃鍚嶅墠闈㈢殑(绛夊唴瀹逛竴骞剁畻杩涙潵
			nowString = prevToken.string.concat(nowString);
			prevToken = editor.getTokenAt(Pos(iterLine, prevToken.start));
		}
		if (prevToken.string && !prevToken.string.trim()) {
			prevToken = editor.getTokenAt(Pos(iterLine, prevToken.start));
		}
		while ((!prevToken.string || prevToken.string.length <= 0) && iterLine > 0) {
			prevToken = editor.getTokenAt(Pos(-- iterLine));
			while (prevToken.string && !prevToken.string.trim()) {
				prevToken = editor.getTokenAt(Pos(iterLine, prevToken.start));
			}
		}
		var columnFlag = containValue(columnPrefixKey, prevToken.string.toUpperCase()) || prevToken.string.endsWith("(");
		var nowArray = nowString.split(".");
		var nowArraylen = nowArray.length;
		if (nowArraylen == 1) {
			if (useEscape) {
				if (columnFlag) {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(columnType); return otherData;});
				}
				addMatches(result, lastString, CM_TABLES, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(tableType); return otherData;});
				addMatches(result, lastString, CM_SCHEMAS, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(schemaType); return otherData;});
				addMatches(result, lastString, CM_DATABASES, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(sourceType); return otherData;});
			} else {
				if (columnFlag) {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
				}
				addMatches(result, lastString, CM_TABLES, function(w) {return w;}, function() {otherData.types.push(tableType); return otherData;});
				addMatches(result, lastString, CM_SCHEMAS, function(w) {return w;}, function() {otherData.types.push(schemaType); return otherData;});
				addMatches(result, lastString, CM_DATABASES, function(w) {return w;}, function() {otherData.types.push(sourceType); return otherData;});
			}
		} else if (nowArraylen == 2) {
			var tmpString = nowArray[0].replace(getRegTableReplace(editor), "");
			if (CM_DATABASES.hasOwnProperty(tmpString)) {
				if (!CM_DATABASES[tmpString]) {
					updateSqlserverDbSchemaTables([tmpString], editor);
				}
				if (useEscape) {
					addMatches(result, lastString, CM_DATABASES[tmpString], function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(schemaType); return otherData;});
				} else {
					addMatches(result, lastString, CM_DATABASES[tmpString], function(w) {return "." + w;}, function() {otherData.types.push(schemaType); return otherData;});
				}
			} 
			if (CM_SCHEMAS.hasOwnProperty(tmpString)) {
				if (useEscape) {
					addMatches(result, lastString, CM_SCHEMAS[tmpString], function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(tableType); return otherData;});
				} else {
					addMatches(result, lastString, CM_SCHEMAS[tmpString], function(w) {return "." + w;}, function() {otherData.types.push(tableType); return otherData;});
				}
			} 
			if (CM_TABLES.hasOwnProperty(tmpString)) {
				updateSqlserverTableColumns([tmpString], editor);
				if (useEscape) {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(columnType); return otherData;});
				} else {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return "." + w;}, function() {otherData.types.push(columnType); return otherData;});
				}
			} 
			{
				var tableName = findTableByAlias(nowArray[0], editor);
				updateSqlserverTableColumns([tableName], editor);
				if (useEscape) {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(columnType); return otherData;});
				} else {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return "." + w;}, function() {otherData.types.push(columnType); return otherData;});
				}
			}
		} else if (nowArraylen == 3) {
			var firstString = nowArray[0].replace(getRegTableReplace(editor), "");
			var secondString = nowArray[1].replace(getRegTableReplace(editor), "");
			if (CM_DATABASES.hasOwnProperty(firstString)) {
				if (!CM_DATABASES[firstString]) {
					updateSqlserverDbSchemaTables([firstString], editor);
				}
				if (CM_DATABASES[firstString].hasOwnProperty(secondString) && CM_DATABASES[firstString][secondString]) {
					if (useEscape) {
						addMatches(result, lastString, CM_DATABASES[firstString][secondString], function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(tableType); return otherData;});
					} else {
						addMatches(result, lastString, CM_DATABASES[firstString][secondString], function(w) {return "." + w;}, function() {otherData.types.push(tableType); return otherData;});
					}
				}
			} 
			if (CM_SCHEMAS.hasOwnProperty(firstString) && CM_SCHEMAS[firstString] && CM_SCHEMAS[firstString].hasOwnProperty(secondString)) {
				updateSqlserverTableColumns([firstString.concat(".").concat(secondString)], editor);
				if (useEscape) {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(columnType); return otherData;});
				} else {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return "." + w;}, function() {otherData.types.push(columnType); return otherData;});
				}
			}
		} else if (nowArraylen == 4) {
			var tmpDbName = nowArray[0].replace(getRegTableReplace(editor), "");
			var tmpSchemaName = nowArray[1].replace(getRegTableReplace(editor), "");
			var tmpTableName = nowArray[2].replace(getRegTableReplace(editor), "");
			if (CM_DATABASES.hasOwnProperty(tmpDbName)) {
				if (!CM_DATABASES[tmpDbName]) {
					updateSqlserverDbSchemaTables([tmpDbName], editor);
				}
				if (CM_DATABASES[tmpDbName].hasOwnProperty(tmpSchemaName) && CM_DATABASES[tmpDbName][tmpSchemaName] 
					&& CM_DATABASES[tmpDbName][tmpSchemaName].hasOwnProperty(tmpTableName)) {
					updateSqlserverTableColumns([tmpDbName.concat(".").concat(tmpSchemaName).concat(".").concat(tmpTableName)], editor);
					if (useEscape) {
						addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(columnType); return otherData;});
					} else {
						addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return "." + w;}, function() {otherData.types.push(columnType); return otherData;});
					}
				}
			}
		}
	}

	function nameMysqlCompletion(result, editor, otherData) {
		var cur = editor.getCursor();
		var iterLine = cur.line;
		var token = editor.getTokenAt(cur);
		var useEscape = (token.string.charAt(0) == getEscapeCharacter(editor));
		var lastString = token.string.substr(1);
		var prevToken = editor.getTokenAt(Pos(iterLine, token.start));
		var nowString =  token.string;
		while (prevToken.string && prevToken.string.match(getDbScTbNameReg(editor))) {//闃叉鎶婅〃鍚嶅墠闈㈢殑(绛夊唴瀹逛竴骞剁畻杩涙潵
			nowString = prevToken.string.concat(nowString);
			prevToken = editor.getTokenAt(Pos(iterLine, prevToken.start));
		}
		if (prevToken.string && !prevToken.string.trim()) {
			prevToken = editor.getTokenAt(Pos(iterLine, prevToken.start));
		}
		while ((!prevToken.string || prevToken.string.length <= 0) && iterLine > 0) {
			prevToken = editor.getTokenAt(Pos(-- iterLine));
			while (prevToken.string && !prevToken.string.trim()) {
				prevToken = editor.getTokenAt(Pos(iterLine, prevToken.start));
			}
		}
		var columnFlag = containValue(columnPrefixKey, prevToken.string.toUpperCase()) || prevToken.string.endsWith("(");
		var nowArray = nowString.split(".");
		var nowArraylen = nowArray.length;
		if (nowArraylen == 1) {
			if (useEscape) {
				if (columnFlag) {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(columnType); return otherData;});
				}
				addMatches(result, lastString, CM_TABLES, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(tableType); return otherData;});
				addMatches(result, lastString, CM_DATABASES, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(sourceType); return otherData;});
			} else {
				if (columnFlag) {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return w;}, function() {otherData.types.push(columnType); return otherData;});
				}
				addMatches(result, lastString, CM_TABLES, function(w) {return w;}, function() {otherData.types.push(tableType); return otherData;});
				addMatches(result, lastString, CM_DATABASES, function(w) {return w;}, function() {otherData.types.push(sourceType); return otherData;});
			}
		} else if (nowArraylen == 2) {
			var tmpString = nowArray[0].replace(getRegTableReplace(editor), "");
			if (CM_DATABASES.hasOwnProperty(tmpString)) {
				if (!CM_DATABASES[tmpString]) {
					updateMysqlDatabaseTables([tmpString], editor);
				}
				if (useEscape) {
					addMatches(result, lastString, CM_DATABASES[tmpString], function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(tableType); return otherData;});
				} else {
					addMatches(result, lastString, CM_DATABASES[tmpString], function(w) {return "." + w;}, function() {otherData.types.push(tableType); return otherData;});
				}
			}
			if (CM_TABLES.hasOwnProperty(tmpString)) {
				updateMysqlTableColumns([tmpString], editor);
				if (useEscape) {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(columnType); return otherData;});
				} else {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return "." + w;}, function() {otherData.types.push(columnType); return otherData;});
				}
			}
			{
				var tableName = findTableByAlias(nowArray[0], editor);
				updateMysqlTableColumns([tableName], editor);
				if (useEscape) {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(columnType); return otherData;});
				} else {
					addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return "." + w;}, function() {otherData.types.push(columnType); return otherData;});
				}
			}
		} else if (nowArraylen == 3) {
			var tmpDbName = nowArray[0].replace(getRegTableReplace(editor), "");
			var tmpTableName = nowArray[1].replace(getRegTableReplace(editor), "");
			if (CM_DATABASES.hasOwnProperty(tmpDbName)) {
				if (!CM_DATABASES[tmpDbName]) {
					updateMysqlDatabaseTables([tmpDbName], editor);
				}
				if (CM_DATABASES[tmpDbName].hasOwnProperty(tmpTableName)) {
					updateMysqlTableColumns([tmpDbName.concat(".").concat(tmpTableName)], editor);
					if (useEscape) {
						addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return addPreSufFix(editor, w);}, function() {otherData.types.push(columnType); return otherData;});
					} else {
						addMatches(result, lastString, CM_NOW_COLUMNS, function(w) {return "." + w;}, function() {otherData.types.push(columnType); return otherData;});
					}
				}
			}
		}
	}
	
	function autoAddMatch(editor, result, search, tables, keywords, otherData) {
		var value = cmLastWord.value;
		var tmpCur = editor.getCursor();//澧炲姞鍏夋爣浣嶇疆鍒ゆ柇
		var iterLine = tmpCur.line;
		var tmpToken = editor.getTokenAt(tmpCur);
		if (tmpToken.string && !tmpToken.string.trim()) {
			tmpToken = editor.getTokenAt(Pos(iterLine, tmpToken.start));
		}
		while ((!tmpToken.string || tmpToken.string.length <= 0) && iterLine > 0) {
			tmpToken = editor.getTokenAt(Pos(-- iterLine));
			while (tmpToken.string && !tmpToken.string.trim()) {
				tmpToken = editor.getTokenAt(Pos(iterLine, tmpToken.start));
			}
		}
		if (tmpToken.string.replace(getRegTableReplace(editor), "") === value.replace(getRegColumnReplace(editor), "")) { //鍖归厤
			autoMatchLastWord(editor, result, search, otherData);
		} else {
			autoMatchCursorWord(editor, result, search, otherData, tmpToken.string);
		}
	}
	
	function autoMatchFilter(editor, options, result, search, otherData) {
		//鍒濆鍖栧尮閰嶅叧閿瘝
		keywords = keywords || getKeywords(editor);
		cmKeywords = cmKeywords || getCmKeywords(editor);
		cmFunctions = cmFunctions || getCmFunctions(editor);
		//鍒濆鍖栧綋鍓峴ql璇彞鐢ㄤ互鍒ゆ柇褰撳墠鎵€鐢ㄥ簱琛�
		var nowCursor = editor.getCursor();
		var tmpLine = nowCursor.line;
		var nowLineString = editor.getValue().split("\n")[tmpLine];
		var leftString = nowLineString.substring(0, nowCursor.ch);
		var lasttoken = "";
		while (leftString.lastIndexOf(';') === -1 && tmpLine > 0) {
			lasttoken = leftString + " " + lasttoken;
			leftString = editor.getValue().split("\n")[-- tmpLine];
		}
		lasttoken = leftString.substring(leftString.lastIndexOf(';') + 1) + " " + lasttoken;
		if (!lasttoken.trim()) {// 绌哄瓧绗︿覆
			addMatches(result, search, CM_START, function(w) {return w.toUpperCase();}, function() {otherData.types.push(keyType); return otherData;});
		} else {
			var rightString = nowLineString.substring(nowCursor.ch);
			tmpLine = nowCursor.line;
			while (rightString.lastIndexOf(';') === -1 && tmpLine < editor.getValue().split("\n").length - 1) {
				lasttoken += " " + rightString;
				rightString = editor.getValue().split("\n")[++ tmpLine];
			}
			if (rightString.lastIndexOf(';') >= 0) {
				lasttoken += " " + rightString.substring(0, rightString.lastIndexOf(';'));
			} else {
				lasttoken += " " + rightString.substring(0);
			}
			var mode = editor.options.mode;
			//initial table columns
			if (mode === "text/x-mssql") {
				initSqlserverTableColumns(lasttoken, editor);
			} else {
				initMysqlTableColumns(lasttoken, editor);
			}
			autoAddMatch(editor, result, search, CM_TABLES, keywords, otherData);
		}
	}
	
	function nameCompletionFilter(result, editor, otherData) {
		var mode = editor.options.mode;
		if (mode === "text/x-mssql") {
			nameSqlserverCompletion(result, editor, otherData);
		} else {
			nameMysqlCompletion(result, editor, otherData);
		}	
	}
	
	CodeMirror.registerHelper("hint", "sql", function(editor, options) {
		var cur = editor.getCursor();
		var result = [];
		var otherData = {types:[], comments:[], datainfo:[]};
		var token = editor.getTokenAt(cur), start, end, search;
		if (token.string.match(getRegName(editor))) {
			search = token.string;
			start = token.start;
			end = token.end;
		} else {
			start = end = cur.ch;
			search = "";
		}
		if (search.charAt(0) == "." || search.charAt(0) == getEscapeCharacter(editor)) {
			nameCompletionFilter(result, editor, otherData);
		} else {
			autoMatchFilter(editor, options, result, search, otherData, keywords)
		}
		return {
			list : result,
			type : otherData.types,
			comments: otherData.comments,
			datainfo: otherData.datainfo,
			from : Pos(cur.line, start),
			to : Pos(cur.line, end)
		};
	});
});