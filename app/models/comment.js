const commentSchema = new Mongoose.Schema({
    text:{
        type:String
    },
    postId:{
        type:Mongoose.Schema.Types.ObjectId,
        ref:"posts"
    },
    userId:{
        type:Mongoose.Schema.Types.ObjectId,
        ref:"users"
    },
    isDeleted:{
        type:Boolean,
        default:false
    }
},{timestamps:true},
)

module.exports = Mongoose.model('comment',commentSchema)