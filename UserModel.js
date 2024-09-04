import {Schema, model} from "mongoose";
const UserSchema=new Schema({
   "UserName":String,
    "Email":String,
    "password":String,
    "type":String,
    "isallowed":Boolean,
    "BorrowedList":[{type:String}]
},{strict:false});
const LibraryUser=model("libraryUser",UserSchema);
export default LibraryUser;
// {
//     UserName: 'asjad',
//     Email: 'mo.ana@gmail.com',
//     Password: '1231',
//     type: 'librarian'
//   }