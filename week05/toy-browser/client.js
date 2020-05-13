const net = require('net');
class Request{
    // 必要信息如下：
    // method, url = host + port + path
    // body: k/v
    // headers
    constructor(options) {
        this.method = options.method || 'GET';
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || '/';
        this.body = options.body || {};
        this.headers = options.headers || {};
        // 关键点如下
        if(!this.headers['Content-Type']) {
            this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        if(this.headers['Content-Type'] === 'application/json') {
            this.bodyText = JSON.stringify(this.body);
        } else if(this.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&');
        }

        this.headers['Content-Length'] = this.bodyText.length;
    }
    toString() {
        return `${this.method} / HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}
\r
${this.bodyText}`
    }
    open(method, url) {}

    // 封装的向服务端发送请求的方法，需要net模块
    send(connection) {
        return new Promise((resolve, reject) => {
            const parser = new ResponseParser();
            if(connection) {
                connection.write(this.toString())   
            } else {
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {
                    connection.write(this.toString())
                })
            }
            connection.on('data', (data) => {
                parser.receive(data.toString()) // 解析器开始工作
                // resolve(data.toString());
                if(parser.isFinished) {
                    resolve(parser.response)
                }
                connection.end();
            });
            connection.on('end', (err) => {
                reject(err);
                connection.end()
            });
        })
    }
}

class Response{

}

// 第一个parser
class ResponseParser{
    constructor() {
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1; // 处理/r/n
        
        this.WAITING_HEADER_NAME = 2;
        this.WAITING_HEADER_SPACE = 3; // name冒号后面有空格
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5; // 处理/r/n

        this.WAITING_HEADER_BLOCK_END = 6; // 处理header和body之间的空行
        this.WAITING_BODY = 7;

        this.current = this.WAITING_STATUS_LINE; // 定义当前状态
        this.statusLine = '';
        this.headers = {};
        this.headerName = '';
        this.headerValue = '';
        this.bodyParser = null;

    }
    get isFinished() {
        return this.bodyParser && this.bodyParser.isFinished
    }
    get response() {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join('')
        }
    }
    // 处理字符流
    receive(string) {
        for(let i = 0; i< string.length; i++) {
            this.receiveChar(string.charAt(i));
        }
    }
    //
    receiveChar(char) {
        if(this.current === this.WAITING_STATUS_LINE) {
            // 接受status_line的过程
            if(char === '\r') { // 当char为 '\r'，表示status_line部分已经结束了，状态改变；
                this.current =this.WAITING_STATUS_LINE_END
            } else if(char === '\n'){
                this.current = this.WAITING_HEADER_NAME
            } else {
                this.statusLine += char;
            }
        } else if(this.current === this.WAITING_STATUS_LINE_END) {
            // 等待line_end的过程，只接受一个字符 /n
            if(char === '\n'){
                this.current =this.WAITING_HEADER_NAME
            }
        } else if(this.current === this.WAITING_HEADER_NAME) {
            // 处理header_name,header_name是以':'结束的
            if(char === ':') {
                this.current = this.WAITING_HEADER_SPACE;
            } else if(char === '\r'){ // 转向body
                this.current = this.WAITING_HEADER_BLOCK_END;
                if(this.headers['Transfer-Encoding'] === 'chunked') { // 根据Transfer-Encoding这个属性来判断使用哪个body的parser。
                    this.bodyParser = new TrunkedBodyParser();
                }
            } else {
                this.headerName += char;
            }
        } else if(this.current === this.WAITING_HEADER_SPACE) {
            // 处理header_name冒号后面的空格
            if(char === ' ') {
                this.current = this.WAITING_HEADER_VALUE;
            }
        } else if(this.current === this.WAITING_HEADER_VALUE) {
            // 处理value的部分
            if(char === '\r') {
                this.current = this.WAITING_HEADER_LINE_END;
                this.headers[this.headerName] = this.headerValue;
                // 当value结束的时候，value和name一起清空
                this.headerValue = ''
                this.headerName = ''
            } else {
                this.headerValue += char;
            }
        } else if(this.current === this.WAITING_HEADER_LINE_END) {
             // 处理header_line_end的部分
            if(char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if(this.current === this.WAITING_HEADER_BLOCK_END) {
            if(char === '\n') {
                this.current = this.WAITING_BODY;
            }

        } else if(this.current === this.WAITING_BODY) {
            // 处理body的部分
           this.bodyParser.receiveChar(char)
       }
    }
}

// 第二个parser
class TrunkedBodyParser{
    constructor() {
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END = 1;
        this.READING_TRUNK = 2;
        this.WAITING_NEW_LINE = 3;
        this.WAITING_NEW_LINE_END = 4;
        this.length = 0; // 计数器
        this.content = [];
        this.isFinished = false;

        this.current = this.WAITING_LENGTH;
    }
    // 处理字符流
    receiveChar(char) {
        // console.log(JSON.stringify(char))
        if(this.current === this.WAITING_LENGTH) {
            // xx
            if(char === '\r') { // 当char为 '\r'，表示xx部分已经结束了，状态改变；
                if(this.length === 0) {
                    console.log(this.content)
                    this.isFinished = true;
                }
                this.current = this.WAITING_LENGTH_LINE_END
            } else {
                this.length *= 10;
                this.length += char.charCodeAt(0) - '0'.charCodeAt(0);
            }
        } else if(this.current === this.WAITING_LENGTH_LINE_END) {
            // xx
            if(char === '\r') { // 当char为 '\r'，表示xx部分已经结束了，状态改变；
                this.current = this.READING_TRUNK
            }
        } else if(this.current === this.READING_TRUNK) {
            this.content.push(char);
            this.length --;
            if(this.length === 0) {
                this.current = this.WAITING_NEW_LINE;
            }
        } else if(this.current === this.WAITING_NEW_LINE) {
            if(char === '\r') {
                this.current = this.WAITING_NEW_LINE_END;
            }
        } else if(this.current === this.WAITING_NEW_LINE_END) {
            if(char === '\n') {
                this.current = this.WAITING_LENGTH;
            }
        } 
    }
}



// 立即执行的函数表达式，向服务端发起请求
void async function(){
    let request = new Request({
        method: 'POST',
        host: '127.0.0.1',
        port: '8088',
        path: '/',
        headers: {
            ["X-Foo2"]: 'custom'
        },
        body: {
            name:'winter'
        }
    })
    let response = await request.send();
    console.log(response)
}();

/**
 * 下面代码之前一直没有成功是因为：
 * 字符串模板换行不能有缩进，必须要顶行。
 */

// const client = net.createConnection({ 
//     host: '127.0.0.1',
//     port: 8088
// }, () => {
//   console.log('connected to server!');

//   let request = new Request({
//       method: 'POST',
//       host: '127.0.0.1',
//       port: '8088',
//       path: '/',
//       headers: {
//           ["X-Foo2"]: 'custom'
//       },
//       body: {
//           name:'winter'
//       }
//   })

//   console.log(request.toString());
//   client.write(request.toString());
// //   client.write(`
// // POST / HTTP/1.1\r
// // Content-Type: application/x-www-form-urlencoded\r
// // Content-Length: 11\r
// // \r
// // name=winter`);
// });
// client.on('data', (data) => {
//   console.log(data.toString());
//   client.end();
// });
// client.on('end', () => {
//   console.log('disconnected from server');
// });