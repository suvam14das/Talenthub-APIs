const mongoose = require('mongoose') 

const domainSchema = mongoose.Schema({
    name : {
        type : String, 
        unique : true,
        required : true,         
        trim : true
    }, 
    description : {
        type : String
    },
    user_ids: [{
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }],
    post_ids: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post'
    }]
    
}, {
    timestamps: true
})

domainSchema.virtual('users', {
    ref: 'User', 
    localField: '_id', 
    foreignField: 'domain_ids'
})

domainSchema.virtual('posts', {
    ref: 'Post', 
    localField: '_id', 
    foreignField: 'domain_ids'
})


const Domain = mongoose.model('Domain', domainSchema)

module.exports = Domain