import KoaApp from "koa";
import KoaRouter from "koa-router"
import KoaBody from 'koa-body'
import {Room} from "./types";
import * as fs from "fs";
// @ts-ignore
import KoaStatic from "koa-static";

const app = new KoaApp();
const router = new KoaRouter();
app.use(KoaStatic('./'));
app.use(KoaBody({
    multipart: true,
}))
const rooms: { [key: string]: Room | undefined } = {}

//初始化一个房间。
function loadRoom(id: string) {
    rooms[id] = {players: [], pool: ["平民", "平民", "狼人", "狼人", "女巫", "预言家"]}
}

//返回视图
router.get("/view", async (ctx) => {
    ctx.type = "text/html"
    ctx.body = fs.readFileSync('mobile.html')
    return;
})


/**
 * post方法表示加入一个房间
 */
router.post("/wolf/:id", async (ctx, next) => {
    console.log(ctx.request.body)
    let id = ctx.params.id;

    if (!rooms[id]) {
        loadRoom(id);
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

/**
 * get方法表示获取一个房间的信息
 * 若房间不存在会自动创建
 */
router.get("/wolf/:id", async (ctx) => {
    let id = ctx.params.id;
    if (!rooms[id]) {
        //若房间不存在，自动创建
        loadRoom(id);
    }
    let room = rooms[id];//当前room
    ctx.body = {code: 0, room};
})

/**
 * delete方法删除一个房间
 */
router.delete("/wolf/:id", async (ctx) => {
    let id = ctx.params.id;
    rooms[id] = undefined
    delete rooms[id] //删除属性
    ctx.body = {code: 0};
})

router.get("/wolf", async (ctx) => {
    ctx.body = {code: 0, rooms}
})


app.use(router.routes())

app.listen(8899, () => {
    console.log("启动成功")
})
