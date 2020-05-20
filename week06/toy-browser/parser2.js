// parser接收html, 构建DOM树
const EOF = Symbol('EOF') // End Of File 用于标识文件结尾

function data(c) {
    // data 没有return任何东西，代码跑不起来
}

module.exports.parseHTML = function parseHTML(html) {
    let state = data;
    for(let c of html) {
        state = state(c);
    }
    state = state(EOF)
}