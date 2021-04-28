const mongoose = require('mongoose') 
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Post = require('../models/post')
const Comment = require('../models/comment')
const Like = require('../models/like')
const Follow = require('../models/follow')
const Activity = require('../models/activity')
const accomplishmentSchema = require('../models/accomplishment')

const userSchema = mongoose.Schema({
    name : {
        type : String, 
        required : true, 
        trim : true  
    }, 
    email : {
        type : String,
        unique : true, 
        required : true, 
        trim : true, 
        lowercase : true,  
        validate(value) {
            if(!validator.isEmail(value)) 
                throw new Error("Email id is not valid !")
        }
    },
    password: {
        type : String, 
        required : true, 
        minLength : [7, "Password too small !"],  
        trim : true, 
        validate(value) {
            if(value.toLowerCase().search('password')>=0) 
                throw new Error("Cannot set password that contains \'password\' !")
        }
    }, 
    dob: {
        type : Date,         
        // validate(value) {
        //     if(value<0) 
        //         throw new Error("Age is not valid")
        // }
    }, 
    gender: {
        type: String
    },
    addressLine1: {
        type: String, 
        trim: true
    }, 
    state: {
        type: String, 
        trim: true
    }, 
    country:{
        type: String, 
        trim: true
    },
    mobileNumber: {
        type: String, 
        trim: true
    },
    tokens: [{
        token : {
            type : String, 
            required : true 
        }
    }], 

    domain_ids: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Domain' 
    }], 

    profilePicUrl: {
        type: String
    }, 
    accomplishments: [{
        type: accomplishmentSchema
    }]
},
    {
    timestamps: true
})

userSchema.virtual('domains', {
    ref: 'Domain', 
    localField: '_id', 
    foreignField: 'user_ids'
})

userSchema.virtual('posts', {
    ref: 'Post', 
    localField: '_id', 
    foreignField: 'owner'
})

// userSchema.virtual('accomplishments', {
//     ref: 'Accomplishment', 
//     localField: '_id', 
//     foreignField: 'owner'
// })

// verify email and password before login 
userSchema.statics.findByCredentials = async (email, password) => {
    const user =  await User.findOne({ email }) 
    if(!user) 
        throw new Error('Unable to login') 
    
    const ismatch = await bcrypt.compare(password, user.password) 
    if(!ismatch) 
        throw new Error('Unable to login')
    return user

}

//generating authentication token
userSchema.methods.generateAuthToken = async function() {
    const user = this 
    const token = jwt.sign({_id : user._id}, process.env.JWT_SECRET, {expiresIn : '1 day'} ) 

    user.tokens = user.tokens.concat({token})
    await user.save() 

    return token 
}

// hiding sensitive data fields 
userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject() 
    delete userObject.tokens 
    delete userObject.password 
    
    return userObject 
}

// hash password before saving 
userSchema.pre('save', async function(next) {    
    const user = this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8) 
    }
    next()
})

// delete user cascade delete tasks
userSchema.pre('remove', async function(next) {

    const user = this 
    await Post.deleteMany({owner : user._id}) 
    await Comment.deleteMany({owner: user._id})
    next()
})



const User = mongoose.model('User', userSchema)
 
module.exports = User