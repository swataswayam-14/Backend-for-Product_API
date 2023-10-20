const mongoose = require('mongoose')
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
    createdAt :{
        type: String,
        required: true
    },
    company :{
        type: String,
        required: true
    }

})

exports.Product = mongoose.model('Product', productSchema)