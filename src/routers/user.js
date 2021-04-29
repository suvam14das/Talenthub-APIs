const express = require('express')
const User = require('../models/user') 
const auth = require('../middleware/auth')
const Domain = require('../models/domain')
const {sendWelcomeMail, forgotPassword} = require('../emails/account')
const crypto = require('crypto')
const logger = require('../logger/logger')

const router = new express.Router() 




//create new user
router.post('/user', (req, res) => { 

    const newuser = new User(req.body)    
    newuser.save().then(async () => {
        
        newuser.domain_ids.forEach(async (domainid)=>{
            domain = await Domain.findById(domainid) 
            domain.user_ids.push(newuser._id)
            await domain.save()
        })   
        await sendWelcomeMail(newuser.email, newuser.name).then(() => {
            //console.log("Email sent") 
        }).catch((error)=> {
            //console.error("Email not sent ",error)
        })
        res.status(201).send({user:{name: newuser.name, email:newuser.email, _id:newuser._id}})
        logger.info(`method=POST path=/user status=201 - New user ${newuser.email} created`)
    }).catch((error) => {
        res.status(400).send({error: error.message})
        logger.error(`method=POST path=/user status=400 - ${error.message}`)

    })
})




// login user by email and password
router.post('/user/login', async (req, res) => {
    
    try{

        const user = await User.findByCredentials(req.body.email, req.body.password) 
        const token = await user.generateAuthToken() 
        res.send({user:{email: user.email, _id:user._id}, token}) 
        logger.info(`method=POST path=/user/login status=200 - Login for ${user.email}`)
    }catch(error){
        
        res.status(400).send({error: error.message}) 
        logger.error(`method=POST path=/user/login status=400 - ${error.message}`)
    }   
    
})




// logout user session 
router.post('/user/logout',auth, async (req, res) => {

try{        
    req.user.tokens = req.user.tokens.filter((token) => {
        return token.token !== req.token
    })
    await req.user.save()
    res.send({"message":"Logged out"})
    logger.info("method=POST path=/user/logout status=200 - Logout for user ",req.user.email)
    }catch(error){
        res.status(500).send({error:error.message})
        logger.error(`method=POST path=/user/logout status=500 - ${error.message} for ${req.user.email}`)
    } 
})



//logout user of all sessions
router.post('/user/logoutall',auth, async (req, res) => {

    try{        
        req.user.tokens = []
        await req.user.save()
        res.send({"message":"Logged out of all sessions"})
        logger.info(`method=POST path=/user/logoutall status=200 - Logout all sessions for user ${req.user.email}`)
        }catch(error){
            res.status(500).send({error:error.message})
            logger.error(`method=POST path=/user/logoutall status=500 - ${error.message} for ${req.user.email}`)
        } 
    })



// get current user profile 
router.get('/user/me', auth, async (req,res) => {
    
    try{
    //console.log(req.user.accomplishments)
    res.send(req.user)
    logger.info(`method=GET path=/user/me status=200 - current user profile for ${req.user.email}`)
    }catch(error){
        res.status(500).send({error: error.message})
        logger.error(`method=GET path=/user/me status=500 - ${error.message} for ${req.user.email}`)
    }
})



// Update user details
router.patch('/user/me',auth, async (req, res) => {
    
    updates = Object.keys(req.body) 
    const allowedUpdate = ['name', 'password','dob','email', 'gender','addressLine1','state','country','mobileNumber','profilePicUrl', 'domain_ids','accomplishments']
    isValidUpdate = updates.every((update) => allowedUpdate.includes(update))
    
    if(!isValidUpdate) 
        return res.status(400).send({error : 'Invalid Update !'})
    
    try{
        //const user = await User.findById(req.params.id) 

        updates.forEach((update) => {
            if(update === 'domain_ids'){
       
                const dom1 = req.user[update] // double quote string
                const dom2 = req.body[update] // single quote string

                dom1.forEach(async (dom) => {
                    // double quote cannot match with single quote strings
                    if(! dom2.includes(String(dom))){           
                        domain = await Domain.findById(dom)
                        domain.user_ids.splice(domain.user_ids.indexOf(req.user._id), 1) 
                        await domain.save()
                    }
                })
                dom2.forEach(async (dom) => {
                    // single quote can match with double quote strings
                    if(! dom1.includes(dom)){
                        domain = await Domain.findById(dom)
                        domain.user_ids.push(req.user._id)
                        await domain.save()
                    }
                })
            }
            else if(update === 'accomplishments'){
                req.body[update].sort((x,y) => new Date(x.date)-new Date(y.date))
            }
            req.user[update] = req.body[update]             
        })
        await req.user.save() 

        //const user = await User.findByIdAndUpdate(req.params.id, req.body, {new : true, runValidators:true}) 
        // if(!user)
        //     return res.status(404).send()   
             
        res.send(req.user) 
        logger.info(`method=PATCH path=/user/me status=200 - profile updated for ${req.user.email}`)
    } catch(error){     
        res.status(400).send({error: error.message}) 
        logger.error(`method=PATCH path=/user/me status=400 - ${error.message} for ${req.user.email}`)
    }
})




// delete user details
router.delete('/user/me',auth, async (req, res) => {

    try{
        req.user.domain_ids.forEach(async (domainid)=>{
            domain = await Domain.findById(domainid) 
            domain.user_ids.splice(domain.user_ids.indexOf(req.user._id), 1)
            await domain.save()
        })   

        await req.user.remove()
        res.send(req.user) 
        logger.info(`method=DELETE path=/user/me status=200 - profile deleted for ${req.user.email}`)
    }catch(e){
        res.status(500).send() 
        logger.error(`method=DEL path=/user/me status=500 - ${error.message} for ${req.user.email}`)
    }
})



// forgot account password
router.post('/user/forgotpassword', async (req, res) => {
    
    try{
        const user = await User.findOne({email: req.body.email})
        if(!user) 
            return res.status(400).send({error: 'This email is not registered !'})

        crypto.randomBytes(5,(err,buf) => {
    
                if(err)
                    throw new Error("Could not create password !")
                const newpassword = buf.toString('hex')                
                forgotPassword(user.email, user.name, newpassword).then(async ()=>{
                    //console.log("Email sent")  
                    user.password = newpassword
                    await user.save()
                    //console.log(newpassword)
                    res.send({message: "New password has been sent to your registered mail."}) 
                    logger.info(`method=POST path=/user/forgotpassword status=200 - forget password for ${user.email}`)   

                }).catch((error) => {
                    //console.error("Email not sent ",error)
                    res.status(500).send({error: error.message})
                    logger.error(`method=POST path=/user/forgotpassword status=500 - ${error.message}`)
                })           
        })          
        
    }catch(error){
        res.status(400).send({error: error.message})
        logger.error(`method=POST path=/user/forgotpassword status=400 - ${error.message}`)
    }

})

//get all countries
router.get('/countries', auth, (req, res) => {
    res.send({ countries : [
    "India", 
    "Nepal", 
    "Indonesia", 
    "SriLanka", 
    "Maldives", 
    "France", 
    "Germany",
    "Italy", 
    "Spain"
].sort(function(a,b){return a.name.localeCompare(b.name); })
})
})

module.exports = router 