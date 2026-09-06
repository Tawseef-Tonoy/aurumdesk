const Expense = require("../models/expense.model");


// CREATE EXPENSE
async function createExpense(req,res){

    try{

        const expense = await Expense.create(req.body);


        res.status(201).json({
            success:true,
            message:"Expense created successfully",
            data:expense
        });


    }catch(error){

        res.status(400).json({
            success:false,
            message:error.message
        });

    }

}



// GET ALL EXPENSES

async function getExpenses(req,res){

    try{

        const expenses = await Expense.find()
        .sort({expenseDate:-1});


        res.status(200).json({
            success:true,
            count:expenses.length,
            data:expenses
        });


    }catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

}



// GET SINGLE EXPENSE

async function getExpenseById(req,res){

    try{

        const expense = await Expense.findById(req.params.id);


        if(!expense){

            return res.status(404).json({
                success:false,
                message:"Expense not found"
            });

        }


        res.status(200).json({
            success:true,
            data:expense
        });


    }catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

}



// UPDATE EXPENSE

async function updateExpense(req,res){

    try{

        const expense =
        await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new:true,
                runValidators:true
            }
        );


        if(!expense){

            return res.status(404).json({
                success:false,
                message:"Expense not found"
            });

        }


        res.status(200).json({
            success:true,
            message:"Expense updated successfully",
            data:expense
        });



    }catch(error){

        res.status(400).json({
            success:false,
            message:error.message
        });

    }

}




// CONFIRM EXPENSE

async function confirmExpense(req,res){

    try{


        const expense =
        await Expense.findByIdAndUpdate(
            req.params.id,
            {
                status:"CONFIRMED"
            },
            {
                new:true
            }
        );


        res.status(200).json({
            success:true,
            message:"Expense confirmed",
            data:expense
        });



    }catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

}



// CANCEL EXPENSE

async function cancelExpense(req,res){

    try{


        const expense =
        await Expense.findByIdAndUpdate(
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
            message:"Expense cancelled",
            data:expense
        });



    }catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

}



// EXPENSE SUMMARY

async function getExpenseSummary(req,res){

    try{


        const summary =
        await Expense.aggregate([

            {
                $match:{
                    status:"CONFIRMED"
                }
            },

            {
                $group:{
                    _id:null,
                    totalAmount:{
                        $sum:"$amount"
                    }
                }
            }

        ]);


        res.status(200).json({

            success:true,

            totalExpense:
            summary.length
            ? summary[0].totalAmount
            : 0

        });



    }catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

}



module.exports={

createExpense,
getExpenses,
getExpenseById,
updateExpense,
confirmExpense,
cancelExpense,
getExpenseSummary

};