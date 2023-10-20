const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
//const Product = require('./models/product')
//middleware
app.use(bodyParser.json())
app.use(morgan('tiny'))

require('dotenv/config')
const api = process.env.API_URL


//userschema

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    passwordHash:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    isAdmin:{
        type:Boolean,
        default:false
    }

})
userSchema.virtual('id').get(function(){
    return this._id.toHexString()
})
userSchema.set('toJSON',{
    virtuals: true,
})

const User = mongoose.model('User', userSchema)

//end of user schema


const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    productID: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    rating: {
        type: Number
    },
    dateCreated :{
        type: Date,
        default: Date.now
    },
    company :{
        type: String,
        required: true
    },
    isFeatured:{
        type: Boolean,
        default: true
    }

})

const Product = mongoose.model('Product', productSchema)


app.get(`/`,(req,res)=>{
    res.send('Welcome! ')
})
app.get(`${api}/products`, async (req,res)=>{
    const productList = await Product.find()
    if(!productList){
        res.status(500).json({success: false})
    }
    res.send(productList)
})

app.post(`${api}/products`,(req,res) =>{
    const product = new Product({
        name: req.body.name,
        productID: req.body.productID,
        company: req.body.company,
        rating: req.body.rating,
        createdAt: req.body.createdAt,
        price: req.body.price,
        isFeatured: req.body.isFeatured
        
    })
    product.save().then((createdProduct => {
        res.status(201).json(createdProduct)
    })).catch((err)=>{
            res.status(500).json({
                error: err,
                success: false
            })
         })
})

app.delete(`${api}/products/:id`,(req,res)=>{
    Product.findByIdAndRemove(req.params.id).then((category)=>{
        if(category){
            res.status(200).json({
                success: true,
                message: `the product with id ${req.params.id} is deleted successfully`
            })
        }else{
            res.status(404).json({
                success: false,
                message:'No product with this id is found'
            })
        }
    }).catch((err)=>{
        return res.status(400).json({
            success:false,
            error: err
        })
    })
})

app.get(`${api}/products/:id`,async (req,res)=>{
    try{
        const product = await Product.findById(req.params.id)
        if(!product){
            res.status(404).json(`the product with the id ${req.params.id} is not present`)
        }
        res.status(200).json(product)
    }catch(error){
        res.status(500).json('there is some problem , please try again later')
    }
})

app.put(`${api}/products/:id`, async (req,res)=>{
    try{
        const product = await Product.findByIdAndUpdate(req.params.id,
            {
                name: req.body.name,
                productID: req.body.productID,
                company: req.body.company,
                rating: req.body.rating,
                createdAt: req.body.createdAt,
                price: req.body.price

            }
        )
    if(!product){
        res.status(404).json(`the product with the id ${req.params.id} is not present`)
    }
    res.status(200).send(product)
    } catch(error){
        res.status(500).json('There is some problem , please try again later')
    }
})

//filtering
//filter based on featured and number of products shown

app.get(`${api}/products/featured/:count`, async (req,res)=>{
    try{
        const count = req.params.count ? req.params.count : 0
        const product = await Product.find({isFeatured: true}).limit(+count)
    
        if(!product){
            res.status(500).json({success:false, msg:'unable to find featured product'})
        }
        res.send(product)
    }catch(error){
        res.status(500).json({msg:'There is some problem please try again later'})
    }
})

//setting up routes for user authentication
app.post(`/users`,async (req,res) =>{
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password,15),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin
    })
    user = await user.save()
    if(!user){
        return res.status(400).send('the user cannot be created!')
    }
    res.status(200).send(user)
})

app.get('/users/:id',async(req,res)=>{
    try{
        const user = await User.findById(req.params.id).select('-password').select('-passwordHash')
        if(!user){
            res.status(404).json('There is no user with the given id')
        }
        res.status(200).send(user)
    }catch(error){
        res.status(500).json({msg:'there is some problem please try again later'})    
    }
})
app.get('/users',async(req,res)=>{
    try{
        const user = await User.find().select('-password').select('-passwordHash')//not sending the passwordHash of every user
        if(!user){
            res.status(404).json('There is no user registered')
        }
        res.status(200).send(user)
    }catch(error){
        res.status(500).json({msg:'there is some problem please try again later'})    
    }
})

app.post('/login',async(req,res)=>{
    try {
        const user = await User.findOne({email: req.body.email,
        password: req.body.password
    })
        if(!user){
            return res.status(400).send('The user does not exists')
        }
        if(user && bcrypt.compareSync(req.body.password, user.passwordHash)){
            res.status(200).send('User Authenticated')
        }else{
            res.status(400).send('password is wrong')
        }
    } catch (error) {
        res.status(500).json({msg: 'Try again later'})
    }
})



mongoose.connect(process.env.CONNECTION_STRING).then(()=>{
    console.log('connection to database established , status: success')
}).catch((err)=>{
    console.log(err)
})

app.listen(3000,()=>{
    console.log('Server listening on port 3000....')
})