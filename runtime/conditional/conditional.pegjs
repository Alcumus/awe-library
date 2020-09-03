Expression
  = head:Factor tail:(_ ("OR" / "AND" / "&" / "|" / ",") _ Factor)* _ {
      return tail.reduce(function(result, element) {
        if (element[1] === "OR" || element[1] === '|') {
        	if(result.or) return {or: [...result.or, element[3]]}
        	return {or:[result, element[3]]};
            }
        else {
        	if(result.and) return {and: [...result.and, element[3]]}
        	return {and:[result, element[3]]};
        }
      }, head);
    }


NOT "not"
 = "NOT"

String
  = '"' chars:DoubleStringCharacter* '"' { return chars.join(''); }
  / "'" chars:SingleStringCharacter* "'" { return chars.join(''); }

DoubleStringCharacter
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
  = !("'" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
  = "'"
  / '"'
  / "\\"

Factor
  = NOT _ "(" _ expr:Expression _ ")" { expr.not = true; return expr; }
  / "(" _ expr:Expression _ ")" { return expr; }
  / NOT _ expr:RoleOrFunction { return {or: [expr], not: true} }
  / RoleOrFunction

RoleOrFunction "term/function call"
  = r:Field "(" param:ValueList ")" { return {call:r, param: param || []} }
  / Term

Term "term"
  = f:Field Eq v:Value { let result = {}; result[f] = v; return result; }
  / f:Field In i:ValueList { let result = {}; result[f] = i; return result; }

Eq "="
  = _ [=] _

In "in"
  = _ "IN" _

ValueList "vlist"
  = _ value:Value "," _ list:ValueList { return [ value.trim(), ...list] }
  / _ value:Value { return [value.trim()] }

Value "value"
  = _ [a-zA-Z\-0-9]+ { return text(); }
  / String

Field "field"
  = _ [a-zA-Z0-9\-]+ { return text(); }

_ "whitespace"
  = [ \t\n\r]*


