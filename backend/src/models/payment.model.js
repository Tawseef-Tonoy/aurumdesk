const mongoose = require("mongoose");


const paymentSchema = new mongoose.Schema(
{
    customerId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    amount:
    {
        type: Number,
        required: true,
        min: 1
    },

    paymentMethod:
    {
        type: String,
        enum:
        [
            "CASH",
            "CARD",
            "BANK_TRANSFER",
            "MOBILE_BANKING"
        ],
        default: "CASH"
    },

    paymentDate:
    {
        type: Date,
        default: Date.now
    },

    referenceNumber:
    {
        type:String,
        trim:true
    },

    note:
    {
        type:String,
        trim:true
    },

    collectedBy:
    {
        type:String,
        default:"Admin"
    },

    status:
    {
        type:String,
        enum:
        [
            "COMPLETED",
            "CANCELLED"
        ],
        default:"COMPLETED"
    }

},
{
    timestamps:true
});


module.exports =
mongoose.model(
    "Payment",
    paymentSchema
);