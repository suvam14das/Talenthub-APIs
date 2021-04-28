const app = require('../src/app')
const request = require('supertest')
const User = require('../src/models/user')


beforeAll(async () => {
    await User.deleteMany()
})
afterAll(() => setTimeout(() => process.exit(), 1000))

test('Create user unique email', async () => {

    await request(app).post('/user').send({
        name: "Suvam Das", 
        email: "godslayer123@gmail.com", 
        password: "suvam123" 
    }).expect(201)
})

// test('Create user duplicate email', async () => {

//     await request(app).post('/user').send({
//         name: "Suvam das", 
//         email: "godslayer123@gmail.com", 
//         password: "suvam123" 
//     }).expect(400)

// })


// test('This should fail', () => {
//     throw new Error("Fail!!")
// })