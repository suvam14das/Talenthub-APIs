const express = require('express')
const auth = require('../middleware/auth')
const Domain = require('../models/domain')
const Post = require('../models/post')
const Like = require('../models/like')
const Follow = require('../models/follow')
const Activity = require('../models/activity')
const User = require('../models/user')
const logger = require('../logger/logger')


const router = new express.Router() 


// create a post
router.post('/post', auth, async (req,res) => {
    try{
        const newPost = new Post(req.body)
        if(newPost.description.length == 0 && newPost.filenames.length == 0)
            throw new Error("Nothing to post")

        newPost.owner = req.user._id 
        newPost.name = req.user.name
        newPost.profilePicUrl = req.user.profilePicUrl
        //console.log(newPost)
        await newPost.save() 

        newPost.domain_ids.forEach(async (domainid) => {
            domain = await Domain.findById(domainid)
            domain.post_ids.push(newPost._id)
            await domain.save()
        })
        res.send(newPost)
        const newActivity = new Activity({user_id: req.user._id, post_id: newPost._id, parent_type:"Post", parent_id:newPost._id})
        await newActivity.save()
        logger.info(`method=POST path=/post status=200 - create post for ${req.user.email}`)

    }catch(error){
        res.status(400).send({error: error.message})
        logger.error(`method=POST path=/post status=400 -${error.message} for ${req.user.email}`)
    }

})



// get all user posts
router.get('/user/posts', auth, async (req,res) => {
    try{
        const user  = req.user
        await user.populate({
            path: 'posts', 
            populate: {
                path: 'domains'
            }  
        }).execPopulate()
        // user.posts.forEach((post) => {
        //     console.log(post.description)
        //     console.log(post.domains)
        // })
        if(user.posts.length === 0)
            return res.send({error: "No Posts"})

        for(const index in user.posts){
            //console.log(user.posts[index])
            if(user.posts[index].profilePicUrl !== req.user.profilePicUrl){
                user.posts[index].profilePicUrl = req.user.profilePicUrl
                await user.posts[index].save()
            }
            const userlike = await Like.findOne({owner: req.user._id, parent_id: user.posts[index]._id})            
            if(userlike)
                user.posts[index].user_like = true
            else 
                user.posts[index].user_like = false
            

        }
        user.posts.sort((x,y) => y.timestamp-x.timestamp)
        //console.log({posts: user.posts})        
        res.send({posts: user.posts}) 
        logger.info(`method=GET path=/user/posts status=200 - get user posts for ${req.user.email}`)

    }catch(error){
        res.status(500).send({error})
        logger.error(`method=GET path=/user/posts status=500 - ${error.message} for ${req.user.email}`)
    }

})


// get a post by id
router.get('/post/:postid', auth, async (req,res)=> {
    try{
        const post = await Post.findById(req.params.postid)
        if(post.parent_post){
            const parentpost = await Post.findById(post.parent_post)
            await parentpost.populate({
                path: 'domains'
            }).execPopulate()
            post.domains = parentpost.domains 
        } 
        else{
        await post.populate({
            path: 'domains'
        }).execPopulate()
        }

        const userlike = await Like.findOne({owner: req.user._id, parent_id: post._id})
        // console.log(userlike)
        if(userlike)
            post.user_like = true
        else 
            post.user_like = false

        res.send(post)
        logger.info(`method=GET path=/post/${req.params.postid} status=200 - get post by postid for ${req.user.email}`)

    }catch(error){
        res.status(400).send({error})
        logger.error(`method=GET path=/post/${req.params.postid} status=400 - ${error.message} for ${req.user.email}`)
    }
})


//delete post by id
router.delete('/post/:postid', auth, async (req,res) => {
    try{
        const post = await Post.findById(req.params.postid) 

        post.domain_ids.forEach(async (domainid)=>{
            domain = await Domain.findById(domainid) 
            domain.post_ids.splice(domain.post_ids.indexOf(post._id), 1)
            await domain.save()
        })  
        
        await post.remove() 
        res.send(post) 
        const activity = await Activity.findOne({parent_type: "Post", parent_id: post._id})
        await activity.remove()
        logger.info(`method=DELETE path=/post/${req.params.postid} status=200 - delete post by post id for ${req.user.email}`)

    }catch(error){
        res.status(400).send({error})
        logger.error(`method=DELETE path=/post/${req.params.postid} status=400 - ${error.message} for ${req.user.email}`)
    }
})



// Update a post by id
router.patch('/post/:postid', auth, async (req,res) => {
    
    updates = Object.keys(req.body) 
    const allowedUpdate = ['title','description', 'domain_ids', 'portfolio']
    isValidUpdate = updates.every((update) => allowedUpdate.includes(update))
    
    if(!isValidUpdate) 
        return res.status(400).send({error : 'Invalid Update !'})
    
    try{
        const post = await Post.findById(req.params.postid) 

        updates.forEach((update) => {
            if(update === 'domain_ids'){
       
                const dom1 = post[update] // double quote string
                const dom2 = req.body[update] // single quote string

                dom1.forEach(async (dom) => {
                    // double quote cannot match with single quote strings
                    if(! dom2.includes(String(dom))){           
                        domain = await Domain.findById(dom)
                        domain.post_ids.splice(domain.post_ids.indexOf(req.params.postid), 1) 
                        await domain.save()
                    }
                })
                dom2.forEach(async (dom) => {
                    // single quote can match with double quote strings
                    if(! dom1.includes(dom)){
                        domain = await Domain.findById(dom)
                        domain.post_ids.push(req.params.postid)
                        await domain.save()
                    }
                })
            }
            post[update] = req.body[update]             
        })
        await post.save() 
        await post.populate({
            path: 'domains'
        }).execPopulate()
             
        res.send(post) 
        logger.info(`method=PATCH path=/post/${req.params.postid} status=200 - update post by post id for ${req.user.email}`)

    } catch(error){     
        res.status(400).send(error) 
        logger.error(`method=PATCH path=/post/${req.params.postid} status=400 - ${error.message} for ${req.user.email}`)

    }
})



// share a post
router.post('/share/:postid', auth, async (req,res) => {
    try{
    const postToShare = await Post.findById(req.params.postid) 
    const newPost = new Post({
        title: postToShare.title,
        description: postToShare.description, 
        owner: req.user._id, 
        filenames: postToShare.filenames
    })
    if(postToShare.parent_post) 
        newPost.parent_post = postToShare.parent_post
    else 
        newPost.parent_post = postToShare._id

    //console.log(newPost)
    await newPost.save()

    postToShare.domain_ids.forEach(async (domainid) => {
        domain = await Domain.findById(domainid)
        domain.post_ids.push(newPost._id)
        await domain.save()
    })

    await newPost.populate({
        path: 'domains'
    }).execPopulate()    
    res.send(newPost) 

    const newActivity = new Activity({user_id: req.user._id, post_id: newPost._id, parent_type:"Post", parent_id:newPost._id})
    await newActivity.save()
    logger.info(`method=POST path=/share/${req.params.postid} status=200 - share post by post id for ${req.user.email}`)

    
}catch(error){
    res.status(400).send({error})
    logger.error(`method=POST path=/share/${req.params.postid} status=400 - ${error.message} for ${req.user.email}`)
}
})

// talentfeed based on activity
router.get('/talentfeed', auth, async (req, res) => {

    try{
    const followeeIds = await Follow.find({follower: req.user._id})
    const followees = [] 
    if(followeeIds.length>0)
    for(const index in followeeIds){       
        followees.push(followeeIds[index].followee)
    }       
    const feedSources = await Activity.find({user_id: {$in: followees}})
  
    const feedPosts = []
    if(feedSources.length>0)
    for(const index in feedSources){
        const post = await Post.findById(feedSources[index].post_id)

        const user = await User.findById(post.owner)
        if(user.profilePicUrl !== post.profilePicUrl){
            post.profilePicUrl = user.profilePicUrl
            await post.save()
        }

        const userlike = await Like.findOne({owner: req.user._id, parent_id: post._id})            
        if(userlike)
            post.user_like = true
        else 
            post.user_like = false

        feedPosts.push(post)
    }
    const uniqueFeedPosts = []
    const uniquePostIds=[]
    feedPosts.forEach((post) => {
        if(!uniquePostIds.includes(String(post._id))){
            uniquePostIds.push(String(post._id))
            uniqueFeedPosts.push(post)
        }           
    })
    uniqueFeedPosts.sort((x,y) => y.updatedAt-x.updatedAt)
    res.send(uniqueFeedPosts)
    logger.info(`method=GET path=/talentfeed status=200 - talentfeed for ${req.user.email}`)

    }catch(error){
        res.status(500).send({error:error.message})
        logger.error(`method=GET path=/talentfeed status=500 - ${error.message} for ${req.user.email}`)
    }
})




module.exports = router