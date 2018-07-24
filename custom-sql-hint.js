/**
 * Created by tianzhen.wtz on 2014/12/24 0024.
 */

/**
 *
 * @returns {keywords|*}
 */
function getCustomWords() {
  var words=[];
  for (var i in customValues){
      if(i){
          words.push(i);
      }
  }
  return words;
}

var CM_START = ['SELECT','INSERT INTO','UPDATE','DELETE FROM'];
var CM_FUNC = ['DISTINCT','COUNT','MAX','MIN','SUM'];
var CM_STAR = ['*'];
var CM_BRACKETS = ['()'];
var CM_FROM = ['FROM',',','AS'];
var CM_AND_OR = ['AND','OR'];
var CM_CONDITIONS = ['WHERE','GROUP BY','ORDER BY','AS','ON'];
var CM_CONN = [',','IN','LIKE','NOT LIKE','IS NULL','IS NOT NULL'];
var CM_JOIN = ['LEFT JOIN','INNER JOIN','RIGHT JOIN'];
var CM_SET = ['SET'];
var CM_ALL_KEYS = CM_START.concat(CM_FUNC).concat(CM_FROM).concat(CM_AND_OR).concat(CM_CONDITIONS).concat(CM_CONN).concat(CM_SET);

var CM_NOW_DATABASE = "";
var CM_DATABASES = {};
var CM_NOW_SCHEMA = "";
var CM_SCHEMAS = {};
var CM_NOW_TABLE = "";
var CM_TABLES = {};
var CM_NOW_COLUMNS = {};
var CM_COMMENT_PROPERTY='__cm__comment';
var CM_DATA_INFO_PROPERTY='__cm__datainfo';

/**
* 鏍规嵁鑷畾涔塻ql鍚嶇О鍚戝垪琛ㄤ腑澧炲姞sql
* @param word
* @param result
*/
function pushCustomWords(word,result,typeResults){
  if(customValues[word]){
      result.push(customValues[word]);
      typeResults();
  }
}

function containValue(list,value){
  for (var i in list){
      if(list[i]==value){
          return true;
      }
  }
  return false;
}


/**
* 鏍规嵁鏁版嵁搴撶被鍨嬭幏鍙朿m鐨勬ā寮�
* @param dbType
* @returns {string}
*/
function getCmMode(dbType){
  var mode='text/x-mysql';
  if(dbType==='oracle'){mode='text/x-plsql'}else if(dbType==='sqlserver'){mode='text/x-mssql'}
  else if(dbType==='oceanbase'){mode='text/x-ob'}
  return mode;
}

/**
* 琛ㄥ悕鍔犲伐
* @param cm
* @param value
*/
function addPreSufFix(cm, value) {
if(cm.options.escape){
  if (cm.options.mode==='text/x-mysql') {
    value = value.replace(/(^`*)|(`*$)/g, "");
    value = value.replaceAll('`', '``');
    return '`' + value + '`';
  } else if (cm.options.mode==='text/x-ob' || cm.options.mode==='text/x-plsql') {
    value = value.replace(/(^"*)|("*$)/g, "");
    value = value.replaceAll('"', '""');
    return '"' + value + '"';
  } else if (cm.options.mode==='text/x-mssql') {
    var result_str = "";
    var valueArray = value.split(".");
    for (var i = 0; i < valueArray.length; i ++) {
      var tmpValue = valueArray[i];
      tmpValue = tmpValue.replace(/(^\[*)|(\]*$)/g, "");
      //tmpValue = tmpValue.replaceAll("\\[", "[[");
      tmpValue = tmpValue.replaceAll("\\]", "]]");
      tmpValue = "[" + tmpValue + "]";
      result_str += tmpValue + "."
    }
    result_str = result_str.substring(0, result_str.length - 1);
    return result_str;
  }
}
return value;
}
function tableNameFilter(cm,value,type) {
if (type == 0 || type == 1 || type == 7 || type == 8) {
  var reg = /^\./i;
  if (reg.test(value)) {//鍒ゆ柇鏄惁鏈�"."
    value = value.substring(1, value.length);
    value = addPreSufFix(cm, value);
    return "." + value;
  } else {
    return addPreSufFix(cm, value);
  }
} else {
  return value;
}
}
function getRegEnd(cm) {
var tmpMode = cm.options.mode;
if (tmpMode === 'text/x-mysql') {
  return new RegExp(/`$/g);
} else if (tmpMode === 'text/x-ob' || tmpMode === 'text/x-plsql') {
  return new RegExp(/"$/g);
} else if (tmpMode === 'text/x-mssql') {
  return new RegExp(/\]$/g);
}
}
function getRegName(cm) {
var tmpMode = cm.options.mode;
if (tmpMode === 'text/x-mysql') {
  return new RegExp(/^[.`\w@]\w*$/);
} else if (tmpMode === 'text/x-ob' || tmpMode === 'text/x-plsql') {
  return new RegExp(/^[."\w@]\w*$/);
} else if (tmpMode === 'text/x-mssql') {
  return new RegExp(/^[.\[\w@]\w*$/);
}
}
function getDbScTbNameReg(cm) {
var tmpMode = cm.options.mode;
if (tmpMode === 'text/x-mysql') {
  return new RegExp(/^[.`\w@]\w*`?$/);
} else if (tmpMode === 'text/x-ob' || tmpMode === 'text/x-plsql') {
  return new RegExp(/^[."\w@]\w*"?$/);
} else if (tmpMode === 'text/x-mssql') {
  return new RegExp(/^[.\[\w@]\w*\]?$/);
}
}
function getEscapeCharacter(cm) {
var tmpMode = cm.options.mode;
if (tmpMode === 'text/x-mysql') {
  return "`";
} else if (tmpMode === 'text/x-ob' || tmpMode === 'text/x-plsql') {
  return "\"";
} else if (tmpMode === 'text/x-mssql') {
  return "[";
}
}
function getRegTableReplace(cm) {
var tmpMode = cm.options.mode;
if (tmpMode === 'text/x-mysql') {
  return new RegExp(/(^`*)|(`*$)/g);
} else if (tmpMode === 'text/x-ob' || tmpMode === 'text/x-plsql') {
  return new RegExp(/(^"*)|("*$)/g);
} else if (tmpMode === 'text/x-mssql') {
  return new RegExp(/(^\[*)|(\]*$)/g);
}
}
function getRegColumnReplace(cm) {
var tmpMode = cm.options.mode;
if (tmpMode === 'text/x-mysql') {
  return new RegExp(/(^[`.]*)|(`*$)/g);
} else if (tmpMode === 'text/x-ob' || tmpMode === 'text/x-plsql') {
  return new RegExp(/(^[".]*)|("*$)/g);
} else if (tmpMode === 'text/x-mssql') {
  return new RegExp(/(^[\[.]*)|(\]*$)/g);
}
}

/**
* 蹇界暐鑷姩鎻愮ず鐨則oken
* @type {string[]}
*/
var ignore=["","#","!","-","=","@","$","%","&","+",";","(",")","*"];
function ignoreToken(text){
  if(text[0]){
      for (var i in ignore){
          if(ignore[i]==text[0]){
              return true;
          }
      }
  }else{
      return true;
  }
  return false;
}

/**
* 鐢ㄦ埛鑷畾涔塻ql {name:value}
* @type {{my_sql: string}}
*/
var customValues={
  //my_sql:'select * from xxxx',
  //mysql1:'select * from tddl_meta_logic_table_ex limit 20',
//mysql2:'鎴戠殑鑷畾涔塖QL2',
//select1:'鑷畾涔塖QL1',
//mysql3:'鎴戠殑鑷畾涔塖QL33333333333333333333333333333333333333333333333'
};


//鍊欓€夎瘝绫诲瀷鍥炬爣

var tablesIcon="/share/js/codemirrorAuto/addon/img/DataTables.png",tableType=0;
var columnIcon="/share/js/codemirrorAuto/addon/img/dataColumn.png",columnType=1;
var fieldIcon="/share/js/codemirrorAuto/addon/img/field.png",fieldType=2;
var functionIcon="/share/js/codemirrorAuto/addon/img/Function.png",functionType=3;
var propertyIcon="/share/js/codemirrorAuto/addon/img/property.png",propertyType=4;
var customIcon="/share/js/codemirrorAuto/addon/img/custom.png",customType=5;
var keyIcon="/share/js/codemirrorAuto/addon/img/key.png",keyType=6;
var sourceIcon="/share/js/codemirrorAuto/addon/img/DataSource.png",sourceType=7;
var schemaIcon="/share/js/codemirrorAuto/addon/img/dataSchema.png",schemaType=8;
var icons=[
  tablesIcon,
  columnIcon,
  fieldIcon,
  functionIcon,
  propertyIcon,
  customIcon,
  keyIcon,
  sourceIcon,
  schemaIcon
];

var cmLastWord={type:-1,value:''};

function updateSqlserverDbSchemaTables(nowValueArray, editor) {
if (typeof(nowValueArray) == 'object' && nowValueArray.constructor == Array) {
  for (var iter = 0; iter < nowValueArray.length; iter ++) {
    var nowValue = nowValueArray[iter];
    if (editor) {
      nowValue = nowValue.replace(getRegTableReplace(editor), "");
    }
    if (CM_DATABASES.hasOwnProperty(nowValue) && !CM_DATABASES[nowValue]) {//鍚堟硶鏁版嵁搴� 涓旀湭鍔犺浇
      ajax({
        async:false,
        url:getTableColumnUrl(),
        params:{type:getDbChangeType(), dbName:nowValue},
        success:function(resp) {
          var json = jsonDecode(resp.responseText);
          if (json.success) {
            var stList = json.root;
            var scObject = {};
            for (var i = 0; i < stList.length; i ++) {
              var schemaTable = stList[i].split(".");
              var schemaName = schemaTable[0];
              var tableName = schemaTable[1];
              if (!scObject.hasOwnProperty(schemaName)) {
                scObject[schemaName] = {};
                scObject[schemaName][tableName] = null;
              } else {
                scObject[schemaName][tableName] = null;
              }
            }
            CM_DATABASES[nowValue] = scObject;
          }
        }
      });
    }
  }
}
}

function updateSqlserverTableColumns(nowValueArray, editor) {
CM_NOW_TABLE = "";
CM_NOW_COLUMNS = {};
if (typeof(nowValueArray) == 'object' && nowValueArray.constructor == Array) {
  for (var iter = 0; iter < nowValueArray.length; iter ++) {
    var nowValue = nowValueArray[iter];
    var dbScTable = nowValue.split(".");
    if (dbScTable.length <= 0 || dbScTable.length > 3) {
      continue;
    }
    var tableName = dbScTable[dbScTable.length - 1].replace(getRegTableReplace(editor), "");
    var schemaName = dbScTable.length >= 2 ? dbScTable[dbScTable.length - 2].replace(getRegTableReplace(editor), "") : CM_NOW_SCHEMA;
    var dbName = dbScTable.length === 3 ? dbScTable[0] : CM_NOW_DATABASE;
    if (CM_DATABASES.hasOwnProperty(dbName) && CM_DATABASES[dbName] &&
      CM_DATABASES[dbName].hasOwnProperty(schemaName) && CM_DATABASES[dbName][schemaName] &&
      CM_DATABASES[dbName][schemaName].hasOwnProperty(tableName)) {
      CM_NOW_TABLE = dbName.concat(".").concat(schemaName).concat(".").concat(tableName);
      if (!CM_DATABASES[dbName][schemaName][tableName]) {
        ajax({
          async:false,
          url:getTableColumnUrl(),
              params:{type:getParamType(),dbName:dbName,schemaName:schemaName,objectName:tableName},
              success:function(resp) {
                var json = jsonDecode(resp.responseText);
                if (json.success) {
                  CM_NOW_COLUMNS = [];
                  var columnObject = {};
                  var data = json.root;
                  for (var i = 0; i < data.length; i ++) {
                    CM_NOW_COLUMNS.push(data[i]["realName"]);
                    columnObject[data[i]["realName"]] = null;
                  }
                  CM_DATABASES[dbName][schemaName][tableName] = columnObject;
                  if (dbName === CM_NOW_DATABASE) {
                    CM_SCHEMAS = CM_DATABASES[CM_NOW_DATABASE];
                    CM_TABLES = CM_SCHEMAS[CM_NOW_SCHEMA];
                  }
                }
              }
        });
      } else {
        CM_NOW_COLUMNS = {};
        CM_NOW_COLUMNS = CM_DATABASES[dbName][schemaName][tableName];
      }
    }
    
  }
}
}

function notYetLoadColumns(tableObject) {
if (!tableObject) {
  return true;
}
var properties = Object.getOwnPropertyNames(tableObject);
var proLen = properties.length;
if (proLen == 0) {
  return true;
} else if (proLen == 1) {
  if (tableObject.hasOwnProperty("__cm__comment")) {
    return true;
  }
}
return false;
}

function objectExtend(dstObj, srcObj) {
if (!dstObj || !srcObj) {
  return dstObj;
}
for (var p in srcObj) {
  dstObj[p] = srcObj[p];
}
return dstObj;
}

function updateMysqlDatabaseTables(nowValueArray, editor) {//tmpNowDBName
if (typeof(nowValueArray) == 'object' && nowValueArray.constructor == Array) {
  for (var iter = 0; iter < nowValueArray.length; iter ++) {
    var tmpNowDBName = nowValueArray[iter];
    if (editor) {
      tmpNowDBName = tmpNowDBName.replace(getRegTableReplace(editor), "");
    }
    if (CM_DATABASES.hasOwnProperty(tmpNowDBName) && !CM_DATABASES[tmpNowDBName]) {
      ajax({
        async:false,
        url:getTableColumnUrl(),
        params:{type:"table_group", dbName:tmpNowDBName},
        success:function(resp) {
          var json = jsonDecode(resp.responseText);
          if (json.success) {
            var tableData = json.root;
            var tableResObj = {};
            for (var i = 0; i < tableData.length; i ++) {
              var tmpName = tableData[i].tableName;
              var tmpComment = tableData[i].tableComment;
              tableResObj[tmpName] = {"__cm__comment":tmpComment};
            }
            CM_DATABASES[tmpNowDBName] = tableResObj;
          }
        }
      });
    }
  }
}
}

function updateMysqlTableColumns(nowValueArray, editor) {
CM_NOW_TABLE = "";
CM_NOW_COLUMNS = {};
if (typeof(nowValueArray) == 'object' && nowValueArray.constructor == Array) {
  for (var iter = 0; iter < nowValueArray.length; iter ++) {
    var nowValue = nowValueArray[iter];
    var dbTable = nowValue.split(".");
    if (dbTable.length <= 0 || dbTable.length > 2) {
      continue;
    }
    var tableName = dbTable[dbTable.length - 1].replace(getRegTableReplace(editor), "");
    var dbName = dbTable.length >= 2 ? dbTable[dbTable.length - 2].replace(getRegTableReplace(editor), "") : CM_NOW_DATABASE;
    if (CM_DATABASES.hasOwnProperty(dbName) && CM_DATABASES[dbName] && CM_DATABASES[dbName].hasOwnProperty(tableName)) {
      CM_NOW_TABLE = dbName.concat(".").concat(tableName);
      if (notYetLoadColumns(CM_DATABASES[dbName][tableName])) {
        ajax({
          async:false,
          url:getTableColumnUrl(),
          params:{type:getParamType(),name:tableName,dbName:dbName},
          success:function(resp) {
            var json = jsonDecode(resp.responseText);
            if (json.success) {
              CM_NOW_COLUMNS = {};
              var columnData = json.root;
              for (var i = 0; i < columnData.length; i ++) {
                var tmpName = columnData[i].columnName;
                var tmpType = columnData[i].columnType;
                var tmpComment = columnData[i].columnComment;
                CM_NOW_COLUMNS[tmpName] = {"__cm__datainfo": tmpType, "__cm__comment": tmpComment};
              }
              CM_DATABASES[dbName][tableName] = CM_NOW_COLUMNS;
              if (dbName === CM_NOW_DATABASE) {
                CM_TABLES[tableName] = CM_NOW_COLUMNS;
              }
            }
          }
        });
      } else {
        CM_NOW_COLUMNS = CM_DATABASES[dbName][tableName];
      }
    }
  }
}
}

function completeSqlserverCmType(cm) {
var cmNowType = cmLastWord.type;
var cmNowValue = cmLastWord.value;
var cursor = cm.getCursor();
if (cmNowType === sourceType) {//鏁版嵁搴撶被鍨�
  updateSqlserverDbSchemaTables([cmNowValue], cm);
} else if (cmNowType === schemaType) {
} else if (cmNowType === tableType) {
  var iterLine = cursor.line;
  var token = cm.getTokenAt(cursor);
  var tableName = token.string;
  var prevToken = cm.getTokenAt({line:iterLine, ch:token.start});
  while (prevToken.string && prevToken.string.match(getDbScTbNameReg(cm))) {
    tableName = prevToken.string.concat(tableName);
    prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
  }
  if (prevToken.string && !prevToken.string.trim()) {
    prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
  }
  while ((!prevToken.string || prevToken.string.length <= 0) && iterLine > 0) {
    prevToken = cm.getTokenAt({line:-- iterLine});
    while (prevToken.string && !prevToken.string.trim()) {
      prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
    }
  }
  var preString = prevToken.string;
  updateSqlserverTableColumns([tableName], cm);
  if (preString && preString.toUpperCase() === "INTO") {
    cm.replaceRange(CM_BRACKETS, cursor);
    cursor.ch ++;
    cm.setCursor(cursor);
  } else {
    cm.replaceRange(' ', cursor);//闈濱NTO绫诲瀷杈撳叆绌烘牸
  }
} else if (cmNowType === columnType || cmNowValue === '*') {
  var iterLine = cursor.line;
  var token = cm.getTokenAt({line:iterLine, ch:cursor.ch});
  var nowString = token.string;
  var prevToken = cm.getTokenAt({line:iterLine, ch:token.start});
  while (prevToken.string && prevToken.string.match(getDbScTbNameReg(cm))) {
    nowString = prevToken.string.concat(nowString);
    prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
  }
  if (prevToken.string && !prevToken.string.trim()) {
    prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
  }
  while ((!prevToken.string || prevToken.string.length <= 0) && iterLine > 0) {
    prevToken = cm.getTokenAt({line:-- iterLine});
    while (prevToken.string && !prevToken.string.trim()) {
      prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
    }
  }
  
  var regEnd = getRegEnd(cm);
  if (prevToken.string === '(' && !regEnd.test(cm.getTokenAt({line:iterLine, ch:prevToken.start}).string)) {
    var cursor = {line:cursor.line, ch:cursor.ch + 1};
      var tmpToken = cm.getTokenAt(cursor);
      while (tmpToken.string === ')') {
        cursor.ch = cursor.ch + 1;
        var nextToken = cm.getTokenAt(cursor);
        if ((nextToken.start === tmpToken.start) && (nextToken.end == tmpToken.end)) {
          break;
        } else {
          tmpToken = nextToken;
        }
      }
      cm.setCursor(cursor);
      cm.replaceRange(' ', cursor);
  } else {
    cm.replaceRange(' ', cursor);
  }
  } else if ((cmNowType === functionType && cmNowValue != "*") || (cmNowType === keyType && cmNowValue === "VALUES")) {
    cm.replaceRange(CM_BRACKETS, cursor);
    cursor.ch ++;
    cm.setCursor(cursor);
  } else {
    cm.replaceRange(' ', cursor);//闈炲嚱鏁拌緭鍏ョ┖鏍�
  }
}

function completeMysqlCmType(cm) {
var cmNowType = cmLastWord.type;
var cmNowValue = cmLastWord.value;
var cursor = cm.getCursor();
if (cmNowType === sourceType) {//鏁版嵁搴撶被鍨�
  updateMysqlDatabaseTables([cmNowValue], cm);
} else if (cmNowType === tableType) {
  var iterLine = cursor.line;
  var token = cm.getTokenAt(cursor);
  var tableName = token.string;
  var prevToken = cm.getTokenAt({line:iterLine, ch:token.start});
  while (prevToken.string && prevToken.string.match(getDbScTbNameReg(cm))) {
    tableName = prevToken.string.concat(tableName);
    prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
  }
  if (prevToken.string && !prevToken.string.trim()) {
    prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
  }
  while ((!prevToken.string || prevToken.string.length <= 0) && iterLine > 0) {
    prevToken = cm.getTokenAt({line:-- iterLine});
    while (prevToken.string && !prevToken.string.trim()) {
      prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
    }
  }
  var preString = prevToken.string;
  updateMysqlTableColumns([tableName], cm);
  if (preString && preString.toUpperCase() === "INTO") {
    cm.replaceRange(CM_BRACKETS, cursor);
    cursor.ch ++;
    cm.setCursor(cursor);
  } else {
    cm.replaceRange(' ', cursor);//闈濱NTO绫诲瀷杈撳叆绌烘牸
  }
} else if (cmNowType === columnType || cmNowValue === '*') {
  var iterLine = cursor.line;
  var token = cm.getTokenAt({line:iterLine, ch:cursor.ch});
  var nowString = token.string;
  var prevToken = cm.getTokenAt({line:iterLine, ch:token.start});
  while (prevToken.string && prevToken.string.match(getDbScTbNameReg(cm))) {
    nowString = prevToken.string.concat(nowString);
    prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
  }
  if (prevToken.string && !prevToken.string.trim()) {
    prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
  }
  while ((!prevToken.string || prevToken.string.length <= 0) && iterLine > 0) {
    prevToken = cm.getTokenAt({line:-- iterLine});
    while (prevToken.string && !prevToken.string.trim()) {
      prevToken = cm.getTokenAt({line:iterLine, ch:prevToken.start});
    }
  }
  
  var regEnd = getRegEnd(cm);
  if (prevToken.string === '(' && !regEnd.test(cm.getTokenAt({line:iterLine, ch:prevToken.start}).string)) {
    var cursor = {line:cursor.line, ch:cursor.ch + 1};
      var tmpToken = cm.getTokenAt(cursor);
      while (tmpToken.string === ')') {
        cursor.ch = cursor.ch + 1;
        var nextToken = cm.getTokenAt(cursor);
        if ((nextToken.start === tmpToken.start) && (nextToken.end == tmpToken.end)) {
          break;
        } else {
          tmpToken = nextToken;
        }
      }
      cm.setCursor(cursor);
      cm.replaceRange(' ', cursor);
  } else {
    cm.replaceRange(' ', cursor);
  }
//    	var nameStart = cm.getTokenAt(cursor).start;
//		if (cm.getTokenAt({line:cursor.line, ch:nameStart}).string === '.') {
//			nameStart = cm.getTokenAt({line:cursor.line, ch:nameStart - 1}).start;
//		}
//		var regEnd = getRegEnd(cm);
//		if (cm.getTokenAt({line:cursor.line, ch:nameStart}).string === '(' && !regEnd.test(cm.getTokenAt({line:cursor.line, ch:nameStart - 1}).string)) {
//			var cursor = {line:cursor.line, ch:cursor.ch + 1};
//    		var tmpToken = cm.getTokenAt(cursor);
//    		while (tmpToken.string === ')') {
//    			cursor.ch = cursor.ch + 1;
//    			var nextToken = cm.getTokenAt(cursor);
//    			if ((nextToken.start === tmpToken.start) && (nextToken.end == tmpToken.end)) {
//    				break;
//    			} else {
//    				tmpToken = nextToken;
//    			}
//    		}
//    		cm.setCursor(cursor);
//    		cm.replaceRange(' ', cursor);
//		} else {
//			cm.replaceRange(' ', cursor);
//		}
  } else if ((cmNowType === functionType && cmNowValue != "*") || (cmNowType === keyType && cmNowValue === "VALUES")) {
    cm.replaceRange(CM_BRACKETS, cursor);
    cursor.ch ++;
    cm.setCursor(cursor);
  } else {
    cm.replaceRange(' ', cursor);//闈炲嚱鏁拌緭鍏ョ┖鏍�
  }
}

function execAutocomplete(that) {
var cm = that.completion.cm;
var mode = cm.options.mode;
var cmNowType = that.data.type[that.selectedHint];
var cmNowValue = that.data.list[that.selectedHint];
cmNowValue = cmNowValue.split(/\s+/).pop();//鍙彇" "鍚庣殑鍏抽敭璇�
  cmLastWord={type:cmNowType,value:cmNowValue};//鏇存柊cmLastWord
  if (mode === "text/x-mssql") {
    completeSqlserverCmType(cm);
  } else {
    completeMysqlCmType(cm);
  }
  if (!onlyInputPrompt) {
    cm.execCommand("autocomplete");
  }
}