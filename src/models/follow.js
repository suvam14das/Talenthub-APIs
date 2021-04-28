const mongoose = require('mongoose') 

const followSchema = mongoose.Schema({


    follower: {
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    followee: { 
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }
    
    
}, {
    timestamps: true
})

const Follow = mongoose.model('Follow', followSchema)

module.exports = Follow