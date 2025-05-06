const express = require('express')
const router = express.Router()

const commentCreate = async (req,res,next) =>{
    try {
        const {data, message} = await Services.comment.commentCreate(req.user,req.body)
        return res.success(message,data)
        }
     catch (error) {
        console.log("error ha bhai commentCreate",error)
        next ( error)
    }
}


const commentListing = async (req,res,next) =>{
    try {
        const {data,message} = await Services.comment.commentListing(req.user,req.params)
        return res.success(message,data)
    } catch (error) {
        console.log("error ha bhau comment listing function ma",error)
        next(error)
    }
}

const commentUpdate = async (req,res,next) =>{
    try {
        const {data,message} = await Services.comment.commentUpdate(req.user,req.body)
        return res.success(message,data)
    } catch (error) {
        console.log("Comment Update function throw error",error)
        next(error)
    }
}

const commentDelete = async (req,res,next) => {
try {
    console.log("commentDeleted")
    const {data,message} = await Services.comment.commentDeleted(req.user,req.params)
    return res.success(message,data)
} catch (error) {
    console.log("error in commentDelete function ",error)
    next(error)
}
}


router.post("/",Auth.verify("user"),Validator(Validations.Comment.commentCreate),commentCreate)

router.get('/:id',Auth.verify("user"),commentListing)

router.put("/",Auth.verify('user'),Validator(Validations.Comment.commentUpdate),commentUpdate)

router.delete("/:id",Auth.verify('user'),commentDelete)

module.exports = router