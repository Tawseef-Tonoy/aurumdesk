const Payment = require("../models/payment.model");


// Create Payment
const createPayment = async (req, res) => {
    try {

        const payment = await Payment.create(req.body);

        res.status(201).json({
            success: true,
            message: "Payment collected successfully",
            data: payment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};




// Get All Payments
const getPayments = async (req, res) => {

    try {

        const payments = await Payment.find()
            .populate("customerId")
            .sort({createdAt:-1});


        res.status(200).json({
            success:true,
            count:payments.length,
            data:payments
        });


    } catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

};





// Get Single Payment
const getPaymentById = async(req,res)=>{

    try{

        const payment =
        await Payment.findById(req.params.id)
        .populate("customerId");


        if(!payment){

            return res.status(404).json({
                success:false,
                message:"Payment not found"
            });

        }


        res.status(200).json({
            success:true,
            data:payment
        });



    }catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

};





// Update Payment

const updatePayment = async(req,res)=>{

    try{

        const payment =
        await Payment.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                returnDocument: "after",
                runValidators:true
            }
        );


        if(!payment){

            return res.status(404).json({
                success:false,
                message:"Payment not found"
            });

        }


        res.status(200).json({

            success:true,
            message:"Payment updated successfully",
            data:payment

        });



    }catch(error){

        res.status(400).json({

            success:false,
            message:error.message

        });

    }

};





// Cancel Payment

const cancelPayment = async(req,res)=>{

    try{

        const payment =
        await Payment.findByIdAndUpdate(
            req.params.id,
            {
                status:"CANCELLED"
            },
            {
                new:true
            }
        );


        res.status(200).json({

            success:true,
            message:"Payment cancelled",
            data:payment

        });



    }catch(error){

        res.status(500).json({

            success:false,
            message:error.message

        });

    }

};





module.exports = {

    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
    cancelPayment

};