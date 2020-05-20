// parser接收html,返回DOM树
// 实现过程，大步骤如下：
// 1: 先写状态机

const EOF = Symbol('EOF') // End Of File 用于标识文件结尾

//此步骤用于解析标签  标签（tag）包括：开始标签、结束标签、自封闭标签 (不考虑注释，实现简易实现)

function data(c) {
    if(c == "<") {
        return tagOpen
    } else if (c === EOF) {
        return ;
    } else {
        return data
    }
}

function tagOpen(c) {
    if(c == "/") {
        return endTagOpen;
    } else if(c.match(/^[a-zA-Z]$/)) {
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

    }
}

function tagName(c) {
    if(c.match(/^[\t\n\f ]$/)) { // 匹配空格
        return beforeAttributeName;
    } else if(c == '/') {
        return selfClosingStartTag;
    } else if(c.match(/^[a-zA-Z]$/)) {
        return tagName;
    } else if(c == ">") {
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
        return ;
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