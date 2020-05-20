// parser接收html,返回DOM树
// 实现过程，大步骤如下：
// 4: 创建元素、我们在结束标签提交标签token(emitToken)
// 在状态机中，除了状态迁移，我们还会要加入业务逻辑
// 我们在标签结束状态提交标签token(文本节点直接当做token 就提交了)

let currentToken = null;

function emit(token) {
  // if(token.type != "text")
  console.log(token)
}

const EOF = Symbol('EOF') // End Of File 用于标识文件结尾

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
    return tagName;
  }
}

function beforeAttributeName(c) {
  if(c.match(/^[\t\n\f ]$/)) { // 匹配空格
    return beforeAttributeName;
  } else if(c == ">") {
    return data;
  } else if(c == "=") {
    return beforeAttributeName
  } else {
    return beforeAttributeName
  }
}

function selfClosingStartTag(c) {
  if(c == ">") {
    currentToken.isSelfClosing = true;
    return data
  } else if(c == "EOF") {

  } else {

  }
}

module.exports.parseHTML = function parseHTML(html) {
  let state = data;
  for(let c of html) {
    state = state(c);
  }
  state = state(EOF)
}
