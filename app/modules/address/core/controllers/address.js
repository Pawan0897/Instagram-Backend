const express = require('express')
const router = express.Router()

const addressSave = async (req,res,next) => {
    console.log('body',req.body)
    try {
        const {data,message} = await Services.address.addressSave(req.body);
    return res.success(message,data)
    } catch (error) {
        console.log('error in addrss',error)
        next( error);
    }
}

router.post("/addresses",addressSave)



module.exports = router