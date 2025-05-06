const addressSchema = new Mongoose.Schema({
    pinCode:{
type:String
    },
    number:{
type:Number
    },
    userId:{
        type :Mongoose.Schema.Types.ObjectId,
        ref:"users"
    },
}, { timestamps:true},)
const address = Mongoose.model("address",addressSchema)


module.exports = address