const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')
var config = require('./config')
const rspMiddleWare = require('./middleware/response')
const koajwt = require('koa-jwt');
const cors = require('koa-cors')
const http = require('http')
const fs = require('fs')
const static = require('koa-static')
const path = require('path')


app.use(cors({credentials: true}))
app.use(bodyParser())

app.use(rspMiddleWare)

app.use(koajwt({
    secret: 'tutti_token'
}).unless({
    path: [/\/common/]
}))

//app.use(wxHeader().unless({path: [/\/common/, /\/management/]}))

app.use(static(path.join(__dirname, './files')))

const router = require('./routes')
app.use(router.routes())


http.createServer(app.callback()).listen(config.port);

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
//https.createServer(options, app.callback()).listen(config.httpsPort)