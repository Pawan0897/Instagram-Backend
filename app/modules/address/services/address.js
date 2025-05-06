
module.exports.addressSave = async (body)=>{
    try {
        console.log("body2",body)
    const data = await Model.Address.create(body)
    return {
        data:data,
        message:"data save successfully"
    }
    } catch (error) {
        console.log("error in address services ",error)
        throw new error
    }
    
}