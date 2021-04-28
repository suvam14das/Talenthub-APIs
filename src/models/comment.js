const mongoose = require('mongoose') 

const commentSchema = mongoose.Schema({

    comment : {
        require: true, 
        type : String, 
        validate(value) {
            if(value.length == 0) 
                throw new Error("No comment written")
        }
    },
    owner: {
        require: true, 
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    owner_name:{
        type: String
    },
    owner_pic:{
        type: String
    }, 
    post_id:{
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'Post'
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment'
    },
    likes: {
        type: Number, 
        default: 0 
    }, 
    user_like: {
        type: Boolean,
        default: null
    }
    
}, {
    timestamps: true
})

commentSchema.virtual('replies', {
    ref: 'Comment', 
    localField: '_id', 
    foreignField: 'parent_id'
})

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment