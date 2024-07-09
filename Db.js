

import mongoose from "mongoose";

const Url='mongodb+srv://Mkhan:Ashad123@cluster0.uydprj9.mongodb.net/'
const ConnectDb=async()=>{

   try
   {
    await mongoose.connect(Url,{});
    console.log("Db is connected");
   }
   catch(e){
    console.log(e?.message);
   }
}
export default ConnectDb;