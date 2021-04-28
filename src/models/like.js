const mongoose = require('mongoose') 

const likeSchema = mongoose.Schema({

    owner: {
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId  
    }, 
    parent_type: {
        type: String
    }
    
}, {
    timestamps: true
})

const Like = mongoose.model('Like', likeSchema)

module.exports = Like