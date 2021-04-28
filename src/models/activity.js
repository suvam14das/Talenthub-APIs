const mongoose = require('mongoose') 

const activitySchema = mongoose.Schema({

    
    user_id: {
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    post_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post'
    }, 
    parent_type: {
        type: String
    }, 
    parent_id: {
        type: mongoose.Schema.Types.ObjectId 
    }

}, {
    timestamps: true
})

const Activity = mongoose.model('Activity', activitySchema)

module.exports = Activity