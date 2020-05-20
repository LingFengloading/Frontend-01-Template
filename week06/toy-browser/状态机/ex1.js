function ex1(str) {
    if(str.indexof('a') !== -1) {
        return true
    } else {
        return false
    }
}

// 老师版本：使用 for of
function ex2(str) {
    for(let c of str) {
        if(c  === 'a') {
            return true
        } else {
            return false
        }
    }
}