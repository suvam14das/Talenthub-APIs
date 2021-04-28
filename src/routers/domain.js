const express = require('express')
const auth = require('../middleware/auth')
const Domain = require('../models/domain')
const Like = require('../models/like')
const User = require('../models/user')
const logger = require('../logger/logger')


const router = new express.Router() 

//create domain
router.post('/domain', async (req, res) => {  

    const newdomain = new Domain({
        ...req.body
    })

    newdomain.save().then(() => {
        res.status(201).send(newdomain)
        logger.info(`method=POST path=/domain status=201 - domain created`)
    }).catch((error) => {
        res.status(400).send(error)
        logger.error(`method=POST path=/domain status=400 - ${error.message}`)
    })
})

// Get all users in a domain by domainid
router.get('/users/:domainid',auth, async (req, res) => {
    try{
        domain = await Domain.findById(req.params.domainid)        
        await domain.populate({
            path: "users"
        }).execPopulate()
    
    //console.log(domain.users)    
    res.send(domain.users)
    logger.info(`method=GET path=/users/${req.params.domainid} status=200 - get domain users for ${req.user.email}`)
    }catch(error){
        res.status(400).send(error)
        logger.error(`method=GET path=/users/${req.params.domainid} status=400 - ${error.message} for ${req.user.email}`)
    }


})

//get domains of user
router.get('/user/domains',auth, async (req,res) => {
            
    try{        
        const user = req.user

        await user.populate({
            path: "domains"
        }).execPopulate()

        res.send(user.domains)     
        logger.info(`method=GET path=/user/domains status=200 - get domains of user for ${req.user.email}`)

    }catch(error) {
        res.status(500).send(error)
        logger.error(`method=GET path=/user/domains status=500 - ${error.message} for ${req.user.email}`)
    }
})


// Get all posts in a domain by domainid
router.get('/posts/:domainid',auth, async (req, res) => {
    try{
        const domain = await Domain.findById(req.params.domainid)        
        await domain.populate({
            path: "posts"
        }).execPopulate()
        
        for(const index in domain.posts){
            // console.log(domain.posts[index])
            const user = await User.findById(domain.posts[index].owner)
            if(user.profilePicUrl !== domain.posts[index].profilePicUrl){
                domain.posts[index].profilePicUrl = user.profilePicUrl
                await domain.posts[index].save()
            } 
            
        const userlike = await Like.findOne({owner: req.user._id, parent_id: domain.posts[index]._id})            
        if(userlike)
            domain.posts[index].user_like = true
        else 
            domain.posts[index].user_like = false


        }
    
        domain.posts.sort((x,y) => y.updatedAt-x.updatedAt)
        //console.log(domain.posts)    
        res.send(domain.posts)
        logger.info(`method=GET path=/posts/${req.params.domainid} status=200 - get domain posts for ${req.user.email}`)
    
    }catch(error){
        res.status(400).send({error: error.message})
        logger.error(`method=GET path=/posts/${req.params.domainid} status=400 - ${error.message} for ${req.user.email}`)
    }


})

// Get all domains
router.get('/alldomains', auth, async (req,res) => {
    try{
    const domains = await Domain.find({})
    if(domains.length == 0)
        return new Error("No domains exist")
    //console.log(domains)
    res.send(domains)
    logger.info(`method=GET path=/alldomains status=200 - get all domains for ${req.user.email}`)
    }catch(error){
        res.status(500).send({error: error.message})
        logger.error(`method=GET path=/alldomains status=500 - ${error.message} for ${req.user.email}`)
    }
})
module.exports = router 
