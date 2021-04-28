const mongoose = require('mongoose') 

const postSchema = mongoose.Schema({

    title:{
        type:String, 
        required: true, 
        trim: true
    },
    description : {
        type : String
    },
    owner: {
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    name:{
        type: String
    }, 
    profilePicUrl:{
        type:String
    }, 
    likes: {
        type: Number, 
        default: 0 
    },
    user_like: {
        type: Boolean, 
        default: null
    },
    portfolio: {
        type: Boolean, 
        default: false
    },
    filenames:[{
        type : String
    }],
    contentType:{
        type: String
    }, 
    domain_ids: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Domain'
    }], 
    parent_post: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post', 
        default: null
    }
    
}, {
    timestamps: true
})

postSchema.virtual('domains', {
    ref: 'Domain', 
    localField: '_id', 
    foreignField: 'post_ids'
})

postSchema.virtual('comments', {
    ref: 'Comment', 
    localField: '_id', 
    foreignField: 'post_id'
})

const Post = mongoose.model('Post', postSchema)

module.exports = Post