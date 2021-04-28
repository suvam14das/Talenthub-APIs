const express = require('express')
const User = require('../models/user') 
const auth = require('../middleware/auth')
const Post = require('../models/post')
const Comment = require('../models/comment')
const Like = require('../models/like')
const Activity = require('../models/activity')
const logger = require('../logger/logger')

const router = new express.Router() 

// POST a comment
router.post('/comment', auth, async (req,res) => {
    try{
        const newComment = new Comment(req.body)
        newComment.owner = req.user._id
        const owner = await User.findById(newComment.owner)
        newComment.owner_name = owner.name
        newComment.owner_pic = owner.profilePicUrl       
        await newComment.save()
        newComment.user_like = false
        //console.log(newComment)
        res.send(newComment)

        const newActivity = new Activity({user_id: req.user._id, post_id: newComment.post_id, parent_type: "Comment", parent_id:newComment._id})
        await newActivity.save()  
        logger.info(`method=POST path=/comment status=200 - comment by ${req.user.email}`)
  

    }catch(error){
        res.status(400).send({error: error.message})
        logger.error(`method=POST path=/comment status=400 - ${error.message} for ${req.user.email}`)
    }


})

// POST a reply to comment 
router.post('/reply', auth, async (req, res) => {
    try{
        const newReply = new Comment(req.body)
        newReply.owner = req.user._id
        const owner = await User.findById(newReply.owner)
        newReply.owner_name = owner.name
        newReply.owner_pic = owner.profilePicUrl       
        await newReply.save()
        //console.log(newReply)
        res.send(newReply)            

        const newActivity = new Activity({user_id: req.user._id, post_id: (await Comment.findById(newReply.parent_id)).post_id, parent_type:"Comment", parent_id:newReply._id  })
        await newActivity.save()
        logger.info(`method=POST path=/reply status=200 - reply by ${req.user.email}`)

    }catch(error){
        res.status(400).send({error: error.message})
        logger.error(`method=POST path=/reply status=400 - ${error.message} for ${req.user.email}`)
    }


})

// DELETE a comment by comment id 
router.delete('/deletecomment/:commentid', auth, async (req,res)=> {
    try{
    const comment = await Comment.findById(req.params.commentid)
    //console.log(comment)
    await comment.populate({
        path: 'replies'
    }).execPopulate() 
    //console.log(comment.replies)
    comment.replies.forEach(async (reply) => {
        await reply.remove()
        const activity = await Activity.findOne({parent_type: "Comment", parent_id:reply._id})
        await activity.remove()
    })
    await comment.remove()
    res.send(comment)

    const activity = await Activity.findOne({parent_type: "Comment", parent_id:comment._id})
    await activity.remove()
    logger.info(`method=DELETE path=/deletecomment/${req.params.commentid} status=200 - delete comment by id by ${req.user.email}`)

    }catch(error){
        res.status(400).send({error: error.message})
        logger.error(`method=DELETE path=/deletecomment/${req.params.commentid} status=400 - ${error.message} for ${req.user.email}`)
    }
})


// GET all comments by post id
router.get('/comments/:postid', auth, async (req,res) => {
    try{
    const comments = await Comment.find({post_id:req.params.postid}) 

    for(const index in comments){

        const user = await User.findById(comments[index].owner)
        if(user.profilePicUrl !== comments[index].owner_pic){
            comments[index].owner_pic = user.profilePicUrl
            await comments[index].save()
        } 
        
        const userlike = await Like.findOne({owner: req.user._id, parent_id: comments[index]._id})            
        if(userlike)
            comments[index].user_like = true
        else 
            comments[index].user_like = false
    }
    comments.sort((x,y) => y.createdAt-x.createdAt)
    res.send(comments) 
    logger.info(`method=GET path=/comments/${req.params.postid} status=200 - get all comments by post id for ${req.user.email}`)
    
    }catch(error){
        res.status(400).send({error: error.message})
        logger.error(`method=GET path=/comments/${req.params.postid} status=400 - ${error.message} for ${req.user.email}`)
    }
})

// GET all replies by parent_id
router.get('/replies/:parentid', auth, async (req,res) => {
    try{
    const replies = await Comment.find({parent_id:req.params.parentid}) 
    res.send(replies) 
    logger.info(`method=GET path=/replies/${req.params.parentid} status=200 - get all replies by comment id for ${req.user.email}`)

    }catch(error){
        res.status(400).send({error: error.message})
        logger.error(`method=GET path=/replies/${req.params.parentid} status=400 - ${error.message} for ${req.user.email}`)

    }
})


module.exports = router