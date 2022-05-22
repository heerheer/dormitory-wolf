import KoaApp from "koa";
import KoaRouter from "koa-router"
import KoaBody from 'koa-body'
import {Room, RoomCreateConfig} from "./types";
import * as fs from "fs";
import os from 'os'
// @ts-ignore
import KoaStatic from "koa-static";
import {nanoid} from "nanoid";
import {WebSocket, WebSocketServer} from 'ws'

const app = new KoaApp();
const router = new KoaRouter();
let websocketServer: WebSocketServer | undefined = undefined;
app.use(KoaStatic('./'));
app.use(KoaBody({
    multipart: true,
}))
const rooms: { [key: string]: Room | undefined } = {}
//存放用户地址与用户信息
const user_address: { [key: string]: { ws: WebSocket, user: string, uid: string } } = {}

/*
//初始化一个房间。
function loadRoom(id: string, mode: 'wolf' | 'undercover') {
    if (mode == 'wolf') {
        rooms[id] = {id, players: [], pool: ["平民", "平民", "狼人", "狼人", "女巫", "预言家"], mode}
    }
    if (mode == 'undercover') {
        let lines = fs.readFileSync('./words.txt').toString().split(os.EOL).filter(x => x != '');
        let line = lines[Math.floor(Math.random() * lines.length)];
        let a = line.split(',')[0];
        let b = line.split(',')[1];
        rooms[id] = {
            id,
            players: [],
            pool: [],
            mode,
            undercover_data: {true_word: a, undercover_count: 2, blank_count: 0, normal_count: 4, undercover_word: b}
        }
        for (let i = 0; i < rooms[id]!.undercover_data!.normal_count; i++) {
            rooms[id]?.pool.push(a)
        }
        for (let i = 0; i < rooms[id]!.undercover_data!.undercover_count; i++) {
            rooms[id]?.pool.push(b)
        }
    }
}
*/

//返回视图
router.get("/view", async (ctx) => {
    ctx.type = "text/html"
    ctx.body = fs.readFileSync('mobile.html')
    return;
})
/**
 * post方法表示加入一个房间
 */
/*
router.post("/wolf/:id", async (ctx, next) => {
    console.log(ctx.request.body)
    let id = ctx.params.id;

    if (!rooms[id]) {
        loadRoom(id, 'wolf');
    }

    let room = rooms[id]!;
    let user = JSON.parse(ctx.request.body).user ?? "未命名";
    let uid = JSON.parse(ctx.request.body).uid;
    //获取一个随机角色
    let role = room.pool[Math.floor(Math.random() * room.pool.length)];
    //在pool角色池中移除角色
    room.pool.splice(room.pool.indexOf(role), 1)
    //将角色添加进room,这里等同于user:user role:role
    room.players.push({user, role, uid})
    //返回数据
    ctx.body = {code: 0, role, left: room.pool.length};
})


router.post("/undercover/:id", async (ctx, next) => {
    console.log(ctx.request.body)
    let id = ctx.params.id;

    if (!rooms[id]) {
        loadRoom(id, 'wolf');
    }

    let room = rooms[id]!;
    let user = JSON.parse(ctx.request.body).user ?? "未命名";
    let uid = JSON.parse(ctx.request.body).uid;
    //获取一个随机角色
    let role = room.pool[Math.floor(Math.random() * room.pool.length)];
    //在pool角色池中移除角色
    room.pool.splice(room.pool.indexOf(role), 1)
    //将角色添加进room,这里等同于user:user role:role
    room.players.push({user, role, uid})
    //返回数据
    ctx.body = {code: 0, role, left: room.pool.length};
})
*/


/**
 * delete方法删除一个房间
 */
router.delete("/rooms/:id", async (ctx) => {
    let id = ctx.params.id;
    rooms[id] = undefined
    delete rooms[id] //删除属性
    ctx.body = {code: 0};
})

//使用put方法创建一个房间
router.put("/rooms/:id", async (ctx) => {
    let id = (ctx.params.id == 'undefined' ? nanoid() : ctx.params.id).toString();
    if (rooms[id] != undefined) {
        ctx.body = {code: -1, message: '房间id存在'}
        return;
    }
    let config: RoomCreateConfig = JSON.parse(ctx.request.body)
    if (config.mode == "wolf") {
        let wolf = config.wolf!;
        let room: Room = {
            config,
            id,
            players: [],
            mode: config.mode,
            pool: wolf.pool,
            sockets: [],
            create_time: Date.now()
        };
        rooms[id] = room;
        ctx.body = {code: 0, message: 'success', data: {id}}
    }

    if (config.mode == 'undercover') {
        let cover = config.undercover!;
        let room: Room = {
            config, id, players: [], mode: config.mode, pool: [], sockets: [], create_time: Date.now()
        };
        //生成pool
        for (let i = 0; i < cover.human; i++) {

        }

        //let room: Room = {config, id, players: [], mode: config.mode, pool: wolf.pool};
    }
    if (config.broadcast) {
        broadcastRoom(id)
    }


})

//使用POST方法加入一个房间,不需要区分模式。
router.post('/rooms/:id', async (ctx) => {
    let id = ctx.params.id.toString();
    let {user, uid} = JSON.parse(ctx.request.body)
    let room = rooms[id];
    if (room == undefined) {
        ctx.body = {code: -1, message: '房间id不存在'}
        return;
    }
    if (room.mode == "wolf") {
        if (room.pool.length == 0) {
            ctx.body = {code: -1, message: '卡池空了...'};
            return;
        }
        //抽取角色
        let role = room.pool[Math.floor(Math.random() * room.pool.length)];
        //在pool角色池中移除角色
        room.pool.splice(room.pool.indexOf(role), 1)
        //将角色添加进room,这里等同于user:user role:role
        room.players.push({user, role, uid})
        //返回数据
        ctx.body = {code: 0, role, left: room.pool.length};
    }
    return {code: -1, message: 'mode?'}
})


//获取房间列表
router.get("/rooms", async (ctx) => {
    let array: Room[] = []
    Object.keys(rooms).forEach(x => {
        array.push(rooms[x]!)
    })
    ctx.body = {code: 0, rooms: array}
})

router.get('/rooms/:id', async (ctx) => {
    let id = ctx.params.id;
    let room = rooms[id];//当前room
    ctx.body = {code: 0, room};
})

app.use(router.routes())

app.listen(8899, () => {
    console.log("启动成功")

    websocketServer = new WebSocketServer({port: 8898})

    websocketServer.on('connection', (socket, request) => {
            socket.on('message', (data) => {
                let json = JSON.parse(data.toString())
                //连接上后请发信送 {action:'con',data:{user,uid}} 来建立连接
                if (json.action == 'con') {
                    //确认socket与user对应
                    let address = request.socket.remoteAddress + ":" + request.socket.remotePort?.toString() ?? ''

                    let {user, uid} = json.data;

                    for (let userAddressKey in user_address) {
                        if (user_address[userAddressKey].uid == uid) {
                            delete user_address[userAddressKey]
                        }
                    }
                    if (address) {
                        user_address[address] = {user, uid, ws: socket}
                    }
                    console.log(address + "已连接主服务器，用户信息:" + JSON.stringify({user, uid}))
                    console.log(`当前连接上服务器的人数:` + Object.keys(user_address).length)
                }
            })

            //断开连接后删除用户socket池
            socket.on('close', (data) => {
                let address = request.socket.remoteAddress
                if (address && user_address[address]) {
                    console.log(user_address[address].user + "连接终端.")
                    delete user_address[address];

                }
                console.log(`当前连接上服务器的人数:` + Object.keys(user_address).length)

            })
        }
    );
})


function broadcastRoom(id: string) {
    console.log("开始广播" + id)
    for (let address in user_address) {
        let user = user_address[address];
        user.ws.send(JSON.stringify({
            action: 'room_broadcast',
            data: {
                id,
                mode: rooms[id]?.mode
            }
        }))
    }

}