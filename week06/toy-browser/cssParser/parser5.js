// css 解析 计算选择器与元素匹配关系 timer: 67min
const css = require('css')
const EOF = Symbol('EOF') // End Of File 用于标识文件结尾

let currentToken = null;
let currentAttribute = null;
let stack = [{type: 'document', children: []}];
let currentTextNode = null;

// 加入一个新的函数，addCSSRules，这里我们把CSS规则暂存到一个数组中
// 只收集style里的内容，link就不考虑了
// 建议将addCSSRules单独放在一个文件中
// toy-browser，这里只处理60%
let rules = [];
function addCSSRules(text) {
  var ast = css.parse(text)
  rules.push(...ast.stylesheet.rules);
}

function match(element, selector) {
  // 这里只判断简单选择器 # . tag 仅判断这三种
  if(!selector || !element.attributes)
    return false;

  if(selector.charAt(0) == "#") {
    var attr = element.attributes.filter(attr => attr.name === 'id')[0]
    if(attr && attr.value === selector.replace("#", ''))
      return true;
  } else if(selector.charAt[0] == '.'){
    var attr = element.attributes.filter(attr => attr.name === 'class')[0]
    if(attr && attr.value === selector.replace('.', ''))
      return true;
  } else {
    if(element.tagName === selector) {
      return true
    }
  }
  return false
}

function computeCSS(element) {
  var elements = stack.slice().reverse();
  if(!element.computedStyle) {
    element.computedStyle = {};
  }

  for(let rule of rules) {
    var selectorParts = rule.selectors[0].split(" ").reverse();

    if(!match(element, selectorParts[0]))
      continue;

    let matched = false;

    var j = 1;
    for(var i = 0; i < elements.length; i++) {
      if(match(elements[i], selectorParts[j])) {
        j ++
      }
    }
    if(j >= selectorParts.length)
      matched = true;

    if(matched) {
      // 如果匹配到，我们要把rule里面的属性声明加到元素的computedStyle上
      console.log('element', element, 'matched rule', rule);
    }
  }
}

function emit(token) {
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
    // 每个元素出来就对它就行css计算
    computeCSS(element);

    top.children.push(element);
    element.parent = top;

    if(!token.isSelfClosing)
      stack.push(element)

    currentTextNode = null;

  } else if(token.type === 'endTag') {
    if(top.tagName != token.tagName) {
      throw new Error("Tag start end doesn't match! ")
    } else {
      //—————————————当遇到style标签时，执行添加CSS规则的操作————————
      if(top.tagName === "style") {
        addCSSRules(top.children[0].content)
      }
      stack.pop()
    }
    currentTextNode = null;
  } else if(token.type == 'text') {
    if(currentTextNode == null) {
      currentTextNode = {
        type: 'text',
        content: ''
      }
      top.children.push(currentTextNode)
    }
    currentTextNode.content += token.content;
  }
}

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
    emit({
      type: 'text',
      content: c
    })
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

module.exports.parseHTML = function parseHTML(html) {
  let state = data;
  for(let c of html) {
    // state(c)
    state = state(c);
  }
  state = state(EOF)
  return stack[0]
}
