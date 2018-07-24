
var breakchars=" +><=!'"+String.fromCharCode(10)+String.fromCharCode(13)+String.fromCharCode(9);
var keywords=new Array("select","insert","update","delete","from","where","order","group","by","set","union","and","or");
var words = new Array();
var wordscnt=0;
var curr_status="word";

function formatsql(istr) {
	if (istr=="") {return "";}
	wordscnt=0;
	words = new Array();
	curr_status="word";
	buildwords(istr);
	return formatwords();
}
function showWords() {
	alert(words.toString());
	/*
	 * for (i=0;i<wordscnt;i++) { alert(words[i][0]+":"+words[i][1]); }
	 */
}
function iskeyword(istr) {
	for(var i=0;i<keywords.length;i++){   
		if(keywords[i]==istr.toLowerCase()){   
			return true; 
		}   
  	}  
	return false;
}
function addWords(type,value,status) {
	var temparray =new Array();
	temparray[0]=type;
	var reExtraSpace = /^\s*(.*?)\s+$/;
	temparray[1]=value.replace(reExtraSpace,"$1");// trim
	if (curr_status=="break") {
		temparray[1]=temparray[1].replace(/\s/g,"");
	}
	curr_status=status;
	words[wordscnt]=temparray;
	wordscnt++;
}
function buildwords(istr){
	var i=1;
	var pos1=0;
	var tempstr;
	if (breakchars.indexOf(istr.charAt(0))>=0) {
		curr_status="break";
	}else {
		curr_status="word";
	}
	while (i<istr.length) {
		if (curr_status=="string") {
			if (istr.charAt(i)=="'") {
				if (istr.charAt(i+1)=="'") {
					i++;
				} else {
					tempstr=istr.substring(pos1,i+1);
					addWords(curr_status,tempstr,"break");
					pos1=i+1;
				}
			}
		}else if ((curr_status=="comment") || (curr_status=="commentline")) {
			if  ((istr.charAt(i)=="*") && (istr.charAt(i+1)=="/")) {
					tempstr=istr.substring(pos1,i+2);
					addWords(curr_status,tempstr,"break");
					pos1=i+2;
					i++;
			}
		}else if (istr.charAt(i)=="'") {
			tempstr=istr.substring(pos1,i);
			addWords(curr_status,tempstr,"string");
			pos1=i;
		}else if ((istr.charAt(i)=="/") && (istr.charAt(i+1)=="*") && (istr.charAt(i+2)=="*")) {
			tempstr=istr.substring(pos1,i);
			addWords(curr_status,tempstr,"commentline");
			pos1=i;
			i++;
			i++;
		}else if ((istr.charAt(i)=="/") && (istr.charAt(i+1)=="*")) {
			tempstr=istr.substring(pos1,i);
			addWords(curr_status,tempstr,"comment");
			pos1=i;
			i++;
		}else if (breakchars.indexOf(istr.charAt(i))>=0) {
			if (curr_status=="word") {
				tempstr=istr.substring(pos1,i);
				addWords("word",tempstr,"break");
				pos1=i;	
			}
		}else if (istr.charAt(i)== ")") {
				tempstr=istr.substring(pos1,i);
				addWords(curr_status,tempstr,"break");
				pos1=i;	
		}else if (istr.charAt(i)== "(") {
				tempstr=istr.substring(pos1,i);
				addWords(curr_status,tempstr,"break");
				pos1=i;	
		}else if (istr.charAt(i)== ",") {
			tempstr=istr.substring(pos1,i);
			addWords(curr_status,tempstr,"break");
			pos1=i;	
		}else{
			if (curr_status=="break") {
				tempstr=istr.substring(pos1,i);
				addWords("break",tempstr,"word");
				pos1=i;
			}
		}
		i++;
	}
	tempstr=istr.substring(pos1,i);
	addWords(curr_status,tempstr);
}
function formatwords() {
	var tempstr="";
	var spacestr="";
	var brackets=0;
	var i=0;
	for (i=0;i<wordscnt;i++) {
		if (words[i][1]=="(") {
      		if (words[i-1][1] == 'in') {
        		tempstr = tempstr + ' (';
			}else {
        		tempstr = tempstr + '(';
			}
      		brackets++;
		}else if (words[i][1] == ")") {
      		tempstr = tempstr + ')';
      		brackets--;
		}else if (words[i][0]=="comment") {
      		tempstr = tempstr + " " + words[i][1] + "\n" + spacestr;
		}else if (words[i][0]=="commentline") {
      		tempstr = tempstr + "\n" + words[i][1] + "\n" + spacestr;
		}else if (words[i][1]==","){
			if (tempstr=="") {
				tempstr = tempstr + ',';
			}else if (brackets <= 0){
        		tempstr = tempstr +  words[i][1]+ "\n" + spacestr;
	  		}else{
        		tempstr = tempstr + ',';
	  		}
		}else if (iskeyword(words[i][1])==true) {
			lowerWords=words[i][1].toLowerCase();
			if (lowerWords=="select") {
				spacestr="       ";
				if (tempstr=="") { 
					tempstr=tempstr+words[i][1];
				}else {
					tempstr=tempstr+"\n"+words[i][1];
				}
			}else if (lowerWords=="update") {
				spacestr="       ";
				if (tempstr=="") { 
					tempstr=tempstr+words[i][1];
				}else {
					tempstr=tempstr+"\n"+words[i][1];
				}
			}else if (lowerWords=="insert") {
				spacestr="       ";
				if (tempstr=="") { 
					tempstr=tempstr+words[i][1];
				}else {
					tempstr=tempstr+"\n"+words[i][1];
				}
			}else if (lowerWords=="delete") {
				spacestr="       ";
				if (tempstr=="") { 
					tempstr=tempstr+words[i][1];
				}else {
					tempstr=tempstr+"\n"+words[i][1];
				}
			}else if (lowerWords=="values") {
				spacestr="       ";
				if (tempstr=="") { 
					tempstr=tempstr+words[i][1];
				}else {
					tempstr=tempstr+"\n"+words[i][1];
				}
			}else if (lowerWords=="set") {
				spacestr="       ";
				if (tempstr=="") { 
					tempstr=tempstr+"   "+words[i][1];
				}else {
					tempstr=tempstr+"\n   "+words[i][1];
				}
			}else if (lowerWords=="from") {
				spacestr="       ";
				if (tempstr=="") { 
					tempstr=tempstr+"  "+words[i][1];
				}else {
					tempstr=tempstr+"\n  "+words[i][1];
				}
			}else if (lowerWords=="where") {
				spacestr="       ";
				if (tempstr=="") { 
					tempstr=tempstr+" "+words[i][1];
				}else {
					tempstr=tempstr+"\n "+words[i][1];
				}
			}else if (lowerWords=="order") {
				spacestr="         ";
				if (tempstr=="") { 
					tempstr=tempstr+words[i][1];
				}else {
					tempstr=tempstr+"\n"+words[i][1];
				}
			}else if (lowerWords=="group") {
				spacestr="         ";
				if (tempstr=="") { 
					tempstr=tempstr+words[i][1];
				}else {
					tempstr=tempstr+"\n"+words[i][1];
				}
			}else if (lowerWords=="union") {
				spacestr="         ";
				if (tempstr=="") { 
					tempstr=tempstr+" "+words[i][1];
				}else {
					tempstr=tempstr+"\n "+words[i][1];
				}
			}else if (lowerWords=="and") {
				spacestr="         ";
				if (tempstr=="") { 
					tempstr=tempstr+"   "+words[i][1];
				}else {
					tempstr=tempstr+"\n   "+words[i][1];
				}
			}else if (lowerWords=="or") {
				spacestr="         ";
				if (tempstr=="") { 
					tempstr=tempstr+"    "+words[i][1];
				}else {
					tempstr=tempstr+"\n    "+words[i][1];
				}
			}else {
				tempstr=tempstr+" "+words[i][1];
			}
		}else if (words[i][1]=="") {
			// none
		}else{
			if ((i > 0) && (words[i-1][1] == "(")) {
        		tempstr = tempstr + words[i][1];
			}else if ((tempstr.charAt(tempstr.length-1)==" ") || tempstr=="") {
				tempstr=tempstr+words[i][1];
			}else if (words[i][0]=="break") {
				tempstr=tempstr+words[i][1];
			}else{
				tempstr=tempstr+" "+words[i][1];
			}
		}
	}
	return tempstr;
}