const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const domainRouter = require('./routers/domain')
const uploadsRouter = require('./routers/upload')
const postRouter = require('./routers/post')
const commentRouter = require('./routers/comment')
const likeRouter = require('./routers/like')
const accomplishmentRouter = require('./routers/accomplishment')
const followrRouter = require('./routers/follow')
const portfolioRouter = require('./routers/portfolio')
const cors = require('cors')

const app = express()


app.use(express.json())
app.use(cors())
app.use(userRouter)
app.use(domainRouter)
app.use(uploadsRouter)
app.use(postRouter)
app.use(commentRouter)
app.use(likeRouter)
app.use(accomplishmentRouter)
app.use(followrRouter)
app.use(portfolioRouter)


app.get('', (req, res) => {
    res.send("<h1>Hi</h1>")
})


module.exports = app
