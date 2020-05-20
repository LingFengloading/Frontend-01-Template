// 在字符串中找到字符'ab'

function eg1(str) {  // 局限性：当字符串中有多个a时，查找结果不对，就是使用for,不能用for of
    let result = null;
    for(let c of str) {
        if(c === 'a') {
            console.log(str.indexOf(c) + 1)
            if( str[str.indexOf(c) + 1] === 'b') {
                return result = true
            } else {
                result = false
            }
        }
    }
    return result
}

// console.log(eg1('cabd'))

function eg2(str) {
    let FoundA = false
    for(let c of str) {
        if(c === 'a') {
            FoundA = true
        } else if(FoundA && c === 'b') {
            return true
        } else {
            FoundA = false
        }
    }
    return false
}

console.log(eg2('adadfsdfad'))