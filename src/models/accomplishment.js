const mongoose = require('mongoose') 

const accomplishmentSchema = mongoose.Schema({

    owner: {
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    title: {
        type:String, 
        trim: true,
        require: true, 
        validate(value){
            if(value.length==0)
                throw new Error("No title given")
        }
    },
    date:{
        type: Date,
        default: null
    },
    description: {
        type: String, 
        default: null
    }
    
}, {
    timestamps: true
})

const Accomplishment = mongoose.model('Accomplishment', accomplishmentSchema)

module.exports = accomplishmentSchema