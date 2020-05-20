// time: 56min
// 栈
// 构建DOM树
// 从标签构建DOM树的基本技巧是使用栈
// 遇到开始标签时创建元素并入栈，遇到结束标签时出栈
// 自封闭节点可视为入栈后立刻出栈
// 任何元素的父元素是它入栈前的栈顶


let currentToken = null;
let currentAttribute = null;

let stack = [{type: 'document', children: []}]

function emit(token) {
  if (token.type === "text") return;

  // 栈顶：新入栈的元素一定是栈顶的子元素。
  let top = stack[stack.length - 1];

  if(token.type === 'startTag') {
    let element = {
      type: 'element',
      children: [],
      attributes: []
    };

    element.tagName = token.tagName;

    for(let p in token) {
      if(p != 'type' && p != "tagName") {
        element.attributes.push({
          name: p,
          value: token[p]
        })
      }
    }
    top.children.push(element);
    element.parent = top;

    if(!token.isSelfClosing)
      stack.push(element)

    // currentTextNode = null;

  } else if(token.type === 'endTag') {
    if(top.tagName != token.tagName) {
      throw new Error("Tag start end doesn't match! ")
    } else {
      stack.pop()
    }
    // currentTextNode = null;
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
