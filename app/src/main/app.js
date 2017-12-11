import { IPCServer, IPCRouter } from 'electron-mvc-ipc'
import FileRouter from './routers/file'
const app = new IPCServer()
const router = new IPCRouter({prefix: ''})

router.get('/login/:id', async (ctx, next) => {
  console.log(ctx.query)
 // ctx.throw(204, 'aaa')
  ctx.body = {
    name: 'name'
  }
  next()
})

app
  .use(router.routes())
  .use(FileRouter.routes())

export default app
