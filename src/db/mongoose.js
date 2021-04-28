const mongoose = require('mongoose') 


mongoose.connect(process.env.DB_PATH, {
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useCreateIndex : true,
    useFindAndModify : false
}) 


// const me = new User({
//     name : '   John Snow     ',  
//     email : 'john@gmail.com    ',
//     password : 'john123 ',

// })

// me.save().then(() => {
//     console.log(me)
// }).catch((error) => {
//     console.log("Error ! ", error)
// })


// const task = new Task({
//     description : '   Do assignments  ' 
  
// })

// task.save().then(() => {
//     console.log(task)
// }).catch((error) => {
//     console.log("Error !", error)
// })
