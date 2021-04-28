const sgMail = require('@sendgrid/mail')

const sendGridApiKey= process.env.SENDGRID_API_KEY

sgMail.setApiKey(sendGridApiKey)

const sendWelcomeMail = (email, name) => {
    return new Promise((resolve, reject) => {
    sgMail.send({
        to: email, 
        from: 'talent.hub.iiitb@gmail.com', 
        subject: 'Welcome to TalentHub',
        text: 'Hello '+name+', \n \nWelcome to TalentHub \n \nLooking forward to building a network of talents with you.'
        
    }).then(() => {
        resolve("Email sent")
    }).catch((error)=> {
        reject("Email not sent ",error)
    })
})
}

const forgotPassword = (email, name, password) => {
    return new Promise((resolve, reject) => {
    sgMail.send({
        to: email, 
        from: 'talent.hub.iiitb@gmail.com', 
        subject: 'TalentHub - Forgot Password Temporary Code', 
        text: 'Hi '+name+', \n \nUse the following code to temporarily login. \n \n'+password+'\n \nSet new password after successful login.'
    }).then(()=>{
        resolve("Email sent")  
    }).catch((error) => {
        reject("Email not sent")
    })
})
}


module.exports = { sendWelcomeMail, forgotPassword}