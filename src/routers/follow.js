const express = require('express')
const auth = require('../middleware/auth')
const Follow = require('../models/follow')
const User = require('../models/user')
const logger = require('../logger/logger')

const router = new express.Router() 

// follow by userid
router.post('/follow/:userId', auth, async (req, res)=> {
    try{
        const follow = new Follow(); 
        follow.follower = req.user._id 
        follow.followee = req.params.userId 
        await follow.save()
        res.send(follow)
        logger.info(`method=POST path=/follow/${req.params.userId} status=200 - follow for ${req.user.email}`)
    }catch(error){
        res.status(500).send({error: error.message})
        logger.error(`method=POST path=/follow/${req.params.userId} status=500 - ${error.message} for ${req.user.email}`)
    }
})

// unfollow by userId
router.post('/unfollow/:userId', auth, async (req, res) => {
    try{
        const follow = await Follow.findOne({follower:req.user._id, followee: req.params.userId})
        await follow.remove()
        res.send(follow)
        logger.info(`method=POST path=/unfollow/${req.params.userId} status=200 - unfollow for ${req.user.email}`)
    }catch(Error)
    {
        res.status(500).send({error: error.message})
        logger.error(`method=POST path=/unfollow/${req.params.userId} status=500 - ${error.message} for ${req.user.email}`)
    }
})

// get all followers
router.get('/followers', auth, async (req, res) => {
    try{
        const followerIds = await Follow.find({followee: req.user._id})
        const followeeIds = await Follow.find({follower: req.user._id})
        const followers = [], followeeUserIds = []

        for(const index in followeeIds){
            followeeUserIds.push(String(followeeIds[index].followee))
        }

        if(followerIds.length>0)
        for(const index in followerIds){
            const user = await User.findById(followerIds[index].follower)            
            
            if(followeeUserIds.includes(String(user._id)))
                following = true
            else 
                following = false
                            
            followers.push({name: user.name, _id:user._id, email:user.email, profilePicUrl: user.profilePicUrl, following})
        }       
        res.send({followers, count: followerIds.length})
        logger.info(`method=GET path=/followers status=200 - all followers for ${req.user.email}`)

    }catch(Error){  
        res.status(500).send({error: error.message})
        logger.error(`method=GET path=/followers status=500 - ${error.message} for ${req.user.email}`)
    }
})

// get all followees 
router.get('/followees', auth, async (req, res) => {
    try{
        const followeeIds = await Follow.find({follower: req.user._id})
        const followees = [] 
        if(followeeIds.length>0)
        for(const index in followeeIds){
            const user = await User.findById(followeeIds[index].followee)
            followees.push({name: user.name, _id:user._id, email:user.email, profilePicUrl: user.profilePicUrl, following: true})
        }       
        res.send({followees, count: followeeIds.length})
        logger.info(`method=GET path=/followees status=200 - all followees for ${req.user.email}`)

    }catch(error){  
        res.status(500).send({error: error.message})
        logger.error(`method=GET path=/followees status=500 - ${error.message} for ${req.user.email}`)
    }
})


// search by search string
router.get('/search/:searchString', auth, async (req, res) => {
    try{
        const findusers = await User.find({$or:[{name:{'$regex': req.params.searchString,$options:'i'}},{email:{'$regex': req.params.searchString,$options:'i'}}]})
        const users = findusers.filter((user) => String(user._id) !== String(req.user._id))
        const search = [] 
        for(const index in users){        
            const isFollowingUser = await Follow.findOne({follower: req.user._id, followee: users[index]})
            if(isFollowingUser)
                following = true
            else 
                following = false
            search.push({name: users[index].name, email:users[index].email, profilePicUrl: users[index].profilePicUrl, _id: users[index]._id,following})
        }
        res.send({userSearchResult: search})
        logger.info(`method=GET path=/search/${req.params.searchString} status=200 - search connections for ${req.user.email}`)

    }catch(error){
        res.status(500).send({error: error.message})
        logger.error(`method=GET path=/search/${req.params.searchString} status=500 - ${error.message} for ${req.user.email}`)
    }
})



module.exports = router