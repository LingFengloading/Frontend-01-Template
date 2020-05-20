// 使用mealy型状态机，查找字符串中的‘abcdef’
function match(str) {
    let state = start
    for(let c of str) {
        console.log(c)
        state = state(c) // 当start中c是‘a’时，这里的state是返回的状态机 foundA,后面以此类推
    }
    return state === end
}

function start(c) {
    if(c === 'a') {
        return foundA
    } else {
        return start
    }
}

function end(c) { // end状态用来表示最终的结果
    return end
}

function foundA(c) {
    if(c === 'b') {
        return foundB
    } else {
        return start
    }
}

function foundB(c) {
    if(c === 'c') {
        return end
    } else {
        return start
    }
}

function foundC(c) {
    if(c === 'd') {
        return foundD
    } else {
        return start
    }
}

function foundD(c) {
    if(c === 'e') {
        return end
    } else {
        return start
    }
}

console.log(match('aaabc'))