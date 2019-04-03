const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')
const config = require('./config')
const rspMiddleWare = require('./middleware/response')
const cors = require('koa-cors')
const https = require('https')
const fs = require('fs')
const wxHeader = require('./middleware/wxHeader')
const static = require('koa-static')
const path = require('path')


var options = {
    key: fs.readFileSync(__dirname + '/certificate/server.key'),
    cert: fs.readFileSync(__dirname + '/certificate/server.crt')
}

app.use(cors({credentials: true}))
app.use(bodyParser())

app.use(rspMiddleWare)

app.use(wxHeader().unless({path: [/\/common/]}))

app.use(static(path.join(__dirname, './files')))

const router = require('./routes')
app.use(router.routes())


https.createServer(options, app.callback()).listen(config.httpsPort)

fs.watch(require.resolve('./config.js'), function () {
    try {
        cleanCache(require.resolve('./config.js'));
    } catch (ex) {
        throw Error('hot update failed');
    }
});

function cleanCache(modulePath) {
    var module = require.cache[modulePath];
    if (module && module.parent) {
        module.parent.children.splice(module.parent.children.indexOf(module), 1);
    }
    require.cache[modulePath] = null;
}