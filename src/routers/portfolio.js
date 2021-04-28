const express = require('express')
const auth = require('../middleware/auth')
const Domain = require('../models/domain')
const Post = require('../models/post')
const Like = require('../models/like')
const Follow = require('../models/follow')
const User = require('../models/user')
const logger = require('../logger/logger')

const router = new express.Router() 


router.get('/portfolio/:userId', auth, async (req, res) => {
    let totalLikes = 0, totalFollowers = 0, totalFollowing = 0, isFollowing = null, isSameUser =null,  user = null
    try{
        
        if(req.params.userId === String(req.user._id)){
            user = req.user
            isSameUser = true, 
            isFollowing = null
        }
        else {
            user = await User.findById(req.params.userId)
            isSameUser = false
            if(await Follow.findOne({follower: req.user._id, followee: req.params.userId}))
                isFollowing = true 
            else
                isFollowing = false
        }

        await user.populate({
            path: 'domains'
        }).execPopulate()

        const domains = []
        user.domains.forEach((domain) => {
            domains.push({name:domain.name, _id:domain._id})
        })

        await user.populate({
            path: 'posts', 
            populate: {
                path: 'domains'
            }
        }).execPopulate() 

   
        const filteredPosts = user.posts.filter((post) => {
            return post.portfolio
        })

        const portfolioPosts = []
        filteredPosts.forEach(async (post)=>{
            if(post.profilePicUrl !== user.profilePicUrl){
                post.profilePicUrl = user.profilePicUrl
                await post.save()
            }             
            const postDomains = []
            post.domains.forEach((domain) => {
                postDomains.push({name:domain.name, _id:domain._id})
            })
            
            portfolioPosts.push({...post.toObject(), domains: postDomains})
        })

        portfolioPosts.sort((x,y) => y.createdAt-x.createdAt)

        
        for( const index in user.posts){
            totalLikes += user.posts[index].likes
        }
        const followeeIds = await Follow.find({follower: user._id})
        const followerIds = await Follow.find({followee: user._id})
        totalFollowers = followerIds.length 
        totalFollowing = followeeIds.length       
        
        res.send({user, domains, portfolioPosts, isSameUser, isFollowing, totalLikes, totalFollowers, totalFollowing})
        logger.info(`method=GET path=/portfolio/${req.params.userId} status=200 - portfolio for ${req.user.email}`)

    }catch(error){
        res.status(500).send({error: error.message})
        logger.error(`method=GET path=/portfolio/${req.params.userId} status=500 - ${error.message} for ${req.user.email}`)
    }
})



module.exports = router