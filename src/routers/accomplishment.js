const express = require('express')
const Accomplishment = require('../models/accomplishment')
const auth = require('../middleware/auth')

const router = new express.Router() 

// Add an accomplishment
router.post('/accomplishment', auth, async (req, res) => {
    try{
    const accomplishment = new Accomplishment(req.body)
    accomplishment.owner = req.user._id 
    await accomplishment.save() 
    res.send(accomplishment)
    }catch(error){
        res.status(400).send({error: error.message})
    }
})

// delete accomplishment by id
router.delete('/accomplishment/:accomplishmentId', auth, async (req,res) => {
    try{
        const accomplishment = await Accomplishment.findById(req.params.accomplishmentId)
        await accomplishment.remove() 
        res.send(accomplishment)

    }catch(error){
        res.status(400).send({error: error.message})
    }
})

//get all accomplishments
router.get('/accomplishments', auth, async (req,res) => {
try{
    await req.user.populate({
        path: "accomplishments"
    }).execPopulate()

    res.send({accomplishments: req.user.accomplishments})

}catch(error){
    res.status(500).send({error: error.message})
}
})

//update accomplishment by id
router.patch('/accomplishment/:accomplishmentId', auth, async (req,res) => {

    try{
    updates = Object.keys(req.body) 
    const allowedUpdate = ['title', 'description', 'date']
    isValidUpdate = updates.every((update) => allowedUpdate.includes(update))
    
    if(!isValidUpdate) 
        throw new Error("Invalid update")
    
    const accomplishment = await Accomplishment.findById(req.params.accomplishmentId)
    updates.forEach((update) => {
        accomplishment[update] = req.body[update] 
    })

    await accomplishment.save()
    res.send(accomplishment)

    }catch(error){
        res.status(400).send({error: error.message})
    }

})

module.exports = router
