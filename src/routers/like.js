const express = require('express')
const auth = require('../middleware/auth')
const Post = require('../models/post')
const Comment =  require('../models/comment')
const Like = require('../models/like')
const Activity = require('../models/activity')
const logger = require('../logger/logger')

const router = new express.Router() 


// like
router.post('/like', auth, async (req, res) => {

    try{
    const like = new Like(req.body)
    like.owner = req.user._id
    const isliked = await Like.findOne({owner: like.owner, parent_id: like.parent_id})
    if(isliked)
    {
        // throw new Error("Cannot like again")
        await isliked.remove()
        const activity = await Activity.findOne({parent_type:"Like", parent_id:isliked._id})
        await activity.remove()

        if(req.body.parent_type == 'Post'){
            const post = await Post.findById(req.body.parent_id)
            post.likes -- 
            //console.log(post.likes)
            await post.save() 
            logger.info(`method=POST path=/like status=200 - post ${req.body.parent_id} unliked by ${req.user.email}`)
            return res.send({like:isliked, likes: post.likes, user_like:false})

        }else if(req.body.parent_type == 'Comment'){
            const comment = await Comment.findById(req.body.parent_id)
            comment.likes -- 
            //console.log(comment.likes)
            await comment.save() 
            logger.info(`method=POST path=/like status=200 - comment ${req.body.parent_id} unliked by ${req.user.email}`)
            return res.send({like:isliked, likes: comment.likes, user_like:false})
        }
    
    }    
    await like.save()
    if(req.body.parent_type == 'Post'){

        const post = await Post.findById(req.body.parent_id)
        post.likes ++ 
        //console.log(post.likes)
        await post.save() 
        const newActivity = new Activity({user_id: req.user._id, post_id: post._id, parent_type:"Like", parent_id:like._id})
        await newActivity.save() 
        logger.info(`method=POST path=/like status=200 - post ${req.body.parent_id} liked by ${req.user.email}`)       
        return res.send({like, likes: post.likes, user_like:true})

    }else if(req.body.parent_type == 'Comment'){

        const comment = await Comment.findById(req.body.parent_id)
        comment.likes ++ 
        //console.log(comment.likes)
        await comment.save() 
        if(comment.parent_id)
        newActivity = new Activity({user_id: req.user._id, post_id: (await Comment.findById(comment.parent_id)).post_id, parent_type:"Like", parent_id:like._id  })
        else
        newActivity = new Activity({user_id: req.user._id, post_id: comment.post_id, parent_type:"Like", parent_id:like._id})
        await newActivity.save()
        logger.info(`method=POST path=/like status=200 - comment ${req.body.parent_id} liked by ${req.user.email}`)
        return res.send({like, likes: comment.likes, user_like:true})
    }
    
    }catch(error){
        res.status(400).send({error: error.message})
        logger.error(`method=POST path=/like status=400 - ${error.message} for ${req.user.email}`)
    }   
})

// unlike 

// router.post('/unlike', auth, async (req, res) => {
//     try{
//     const like = await Like.findOne({owner: req.user._id, parent_id: req.body.parent_id, parent_type: req.body.parent_type })
//     await like.remove()

//     if(req.body.parent_type == 'Post'){
//         const post = await Post.findById(req.body.parent_id)
//         post.likes -- 
//         console.log(post.likes)
//         await post.save() 
//     }else if(req.body.parent_type == 'Comment'){
//         const comment = await Comment.findById(req.body.parent_id)
//         comment.likes -- 
//         console.log(comment.likes)
//         await comment.save() 
//     }
//     res.send(like)
//     }catch(error){
//         res.status(400).send({error: error.message})
//     }
// })


module.exports = router