const{
getMonthlyReport
}=require("../services/monthlyReport.service");



async function getMonthlyOwnerReport(req,res){

try{

const year=
Number(req.query.year);

const month=
Number(req.query.month);



if(
!year||
!month||
month<1||
month>12
){

return res.status(400).json({

success:false,

message:"Valid year and month are required"

});

}



const report=
await getMonthlyReport(
year,
month
);



return res.status(200).json({

success:true,

data:report

});


}catch(error){

console.error(
"Monthly report error:",
error
);


return res.status(500).json({

success:false,

message:error.message

});

}

}



module.exports={
getMonthlyOwnerReport
};