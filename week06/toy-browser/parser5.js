// 第五步：处理属性
// 加了四个状态
// 属性值分为单引号、双引号、无引号三种写法，因此需要较多状态处理
// 处理属性的方式跟标签类似
// 属性结束时，我们把属性加到标签Token上
// 在emit之后，要return data;

let currentToken = null;
let currentAttribute = null;

function emit(token) {
  if (token.type != "text") {
    console.log(token)
  }
}

const EOF = Symbol('EOF') // End Of File 用于标识文件结尾

// 标签：开始标签、结束标签、自封闭标签 (不考虑注释，实现简易实现)

function data(c) {
  if(c == "<") {
    return tagOpen
  } else if (c === EOF) {
    emit({
      type: 'EOF'
    })
    return ;
  } else {
    emit({
      type: 'text',
      content: c
    });
    return data
  }
}

function tagOpen(c) {
  if(c == "/") {
    return endTagOpen;
  } else if(c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'startTag',
      tagName: ''
    }
    return tagName(c)
  } else {
    return ;
  }
}

function tagName(c) {
  if(c.match(/^[\t\n\f ]$/)) { // 匹配空格
    return beforeAttributeName;
  } else if(c == '/') {
    return selfClosingStartTag;
  } else if(c.match(/^[a-zA-Z]$/)) {
    currentToken.tagName += c;
    return tagName;
  } else if(c == ">") {
    emit(currentToken)
    return data;
  } else {
    currentToken.tagName += c
    return tagName;
  }
}

function beforeAttributeName(c) {
  if(c.match(/^[\t\n\f ]$/)) { // 匹配空格
    return beforeAttributeName;
  } else if(c == "/" || c == ">" || c == EOF) {
    return afterAttributeName(c);
  } else if(c == "=") {

  } else {
    currentAttribute = {
      name: '',
      value: ''
    }
    return attributeName(c)
  }
}

function attributeName(c) {
  if(c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF) {
    return afterAttributeName(c)
  } else if(c == "=") {
    return beforeAttributeValue;
  } else if(c == "\u0000") {

  } else if(c == "\"" || c == "'" || c == "<") {

  } else {
    currentAttribute.name += c
    return attributeName
  }
}

function beforeAttributeValue(c) {
  if(c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF) {
    return beforeAttributeValue
  } else if(c == "\"") {
    return doubleQuotedAttributeValue
  } else if(c == "\'") {
    return singleQuoteAttributeValue
  } else if(c == ">") {

  } else {
    return UnquotedAttributeValue(c)
  }
}

function doubleQuotedAttributeValue(c) {
  if(c == "\"") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if(c == "\u0000") {

  } else if(c == EOF) {

  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue
  }
}

function singleQuoteAttributeValue(c) {
  if(c == "\'") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if(c == "\u0000") {

  } else if(c == EOF) {

  } else {
    currentAttribute.value += c;
    return singleQuoteAttributeValue
  }
}

function afterQuotedAttributeValue(c) {
  if(c.match(/^[\t\n\f ]$/) ) {
    return beforeAttributeName
  } else if(c == "/") {
    return selfClosingStartTag
  } else if(c == ">'") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken)
    return data
  } else if(c == EOF) {

  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue
  }
}

function UnquotedAttributeValue(c) {
  if(c.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value
    return beforeAttributeName
  } else if(c == "/") {
    currentToken[currentAttribute.name] = currentAttribute.value
    return selfClosingStartTag
  } else if(c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data;
  } else if(c == "\u0000") {

  } else if(c == "\"" || c == "'" || c == "<" || c == "=" || c == "`"){

  } else if(c == EOF) {

  } else {
    currentAttribute.value += c;
    return UnquotedAttributeValue
  }
}

function selfClosingStartTag(c) {
  if(c == ">") {
    currentToken.isSelfClosing = true;
    emit(currentToken)
    return data
  } else if(c == "EOF") {

  } else {

  }
}

function endTagOpen(c) {
  if(c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'endTag',
      tagName: ''
    }
    return tagName(c)
  } else if(c == ">") {

  } else if(c == EOF) {

  } else {

  }
}

function afterAttributeName(c) {
  if(c.match(/^[\t\n\f ]$/)) {
    return afterAttributeName
  } else if(c == "/") {
    return selfClosingStartTag
  } else if(c == "=") {
    return beforeAttributeValue;
  } else if(c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken)
    return data;
  } else if(c == EOF) {

  } else {
    currentToken[currentAttribute.name] = currentAttribute.value;
    currentAttribute = {
      name: "",
      value: ""
    }
    return attributeName(c);
  }
}

// 在这步，运行时报错了，"state is not a function"

module.exports.parseHTML = function parseHTML(html) {
  let state = data;
  for(let c of html) {
    // state(c)
    state = state(c);
  }
  state = state(EOF)
}
