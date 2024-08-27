import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import {Server} from "socket.io";
import http from "http";
import ConnectDb from "./Db.js";
import Pollsmodel from "./Model.js";
import randomstring  from "randomstring";
import querystring from "query-string";
import bcrypts from "bcrypt";
import jsonwebtoken from "jsonwebtoken";

// import fetch from 'node-fetch'
import fs  from 'fs'
import { getArtists, SpotifyCall } from "./SpotifyApiCalls.js";
import json from "body-parser/lib/types/json.js";
import axios from "axios";
import {Book} from "./BooksModel.js";
import LibraryUser from "./UserModel.js";
const app = express();
app.use(cors());

const jwtsecret="123ashad";



// async function convertintoData(){

//     try{
//         // const url = 'https://www.googleapis.com/books/v1/volumes?q=newarrivals+terms&startIndex=0&maxResults=100';
//         const resp= await fetch(`https://www.googleapis.com/books/v1/volumes?q=trendins+books+terms`);
//         var data=(await resp.json());
//         data=data.items.map(item => {
//             var d=(item?.volumeInfo?.imageLinks?.thumbnail);
//             console.log(item?.volumeInfo?.industryIdentifiers);
//             var c=item?.volumeInfo?.industryIdentifiers?.map(e=>{
//                 console.log(e);
//                 return (e?.identifier);
//              })
//              console.log("c=>",c);
//             return {
//                 ...item,volumeInfo:{
//                     ...item.volumeInfo,imageLinks:[d],industryIdentifiers:c?[...c]:[]
//                 },
//                 type: 'trendings'
//               }
         
//         });
//         const jsonString = JSON.stringify(data, null, 2);
//         fs.writeFile('books_data.json', jsonString, err => {
//               if (err) {
//                 console.error('Error writing file', err);
//               } else {
//                 console.log('File successfully written');
//               }
//             });
//     }
//     catch(e){
//         console.log(e?.message);
//     }
   
//     }
// convertintoData();






function generateRandomString(){
    return randomstring.generate({
        length: 12,
        charset: 'alphabetic'
      });
}
app.use(bodyParser.json({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));


const httpServer = http.createServer(app);
ConnectDb();

const io=new Server(httpServer,{
    cors:{
        // origin:["http://localhost:3000","https://polling-systems.vercel.app/"],
        methods:['GET','POST']
    }
})
app.get('/',(req,res)=>{
    
    res.send("<h1>hello</h1>");

})
var pollsData=[];
async function FirstTimeCall(){
     pollsData=await Pollsmodel.find();
     pollsData=(pollsData[0]?.pollsData);
     console.log(pollsData);
}
// FirstTimeCall();
var c=0;
async function datacount(){
    const count= await Book.find();
    var borrowedCount=count.filter(e=>{
        if(e?.borrowed){
            return e;
        }
    })
    const totalUser=await LibraryUser.find();
    console.log("count all =>",count.length,borrowedCount.length);
    c=count.length;
    return [count.length,borrowedCount.length , totalUser.length];
}
// datacount();
console.log("c=>",c);
io.on('connection',async(socket)=>{
    console.log(socket.id);
    // var room_id='';
    FirstTimeCall();
    socket.on("join_room",data=>{
        console.log(data);
        socket.join(data);
        // room_id=data;
    })
    socket.on("polling_room",room=>{
        socket.join(room);
    })
    socket.on("libraryemits",room=>{
        console.log(room);
        socket.join(room);
    })
    socket.on("loginemits",room=>{
        console.log("login emits listen by server");
        socket.join(room);
    })
    socket.on("favourites",room=>{
        console.log(room);
        socket.join(room);
    })
    socket.on("sendupdatedcountofbooks",async(data)=>{
        console.log("sendupdatedcountofbooks",data);
        var count=0;
        for(var i=0;i<2;i++){
            count=await datacount();
        }
        console.log("count 2 3 =>",count);
        io.in(data[0]).emit('updatedcountofBooks',count);
    })
   
    socket.on('client',data=>{
        console.log(data?.room_id,data.inputvalue);
        // socket.broadcast.emit('recieved',data);
        
        socket.to(data?.room_id).emit('received',(data.inputvalue));
    })
    

    socket.emit("polling",pollsData?.length?pollsData:[1,1,1]);

    socket.on("first",data=>{
         // socket.broadcast.emit('send_back',data);
        // socket.to(data[0]).emit('send_back',(data[1]));
        console.log("socket room =>",data[0],"socket data",data[1]);
        io.in(data[0]).emit('send_back',{name:"first", val:data[1]});
    })
    socket.on("second",data=>{
        console.log("socket room =>",data[0],"socket data",data[1]);
        io.in(data[0]).emit('send_back',{name:"second",val: data[1]});
    })
    socket.on("third",data=>{
        console.log("socket room =>",data[0],"socket data",data[1]);
        io.in(data[0]).emit('send_back',{name:'third',val: data[1]});
    })


    socket.on("update_data",data=>{
        console.log(data);
        io.in(data[0]).emit('send_back_of_udpated_data',{pollsData});
    })

    socket.on("clear_data",async(data)=>{
        console.log(data);
        const resp=await Pollsmodel.deleteMany();
        console.log("clearing resp=>",resp);
        const clear_resp= await Pollsmodel.find();
        console.log(clear_resp);
        io.in(data[0]).emit('send_back_of_clearing_data',{"pollsData":[1,1,1]});
    })
})


app.post("/addbook",async(req,res)=>{
    console.log(req.body);
   try{
    const book= new Book(req.body);
    await book.save();
    console.log(book);
    return res.json({mess:"Successfully Saved"});
   }
   catch(e){
    return res.json({mess:e.message});
   }
})
app.get("/getbook",async(req,res)=>{
    console.log(req.body);
   try{
    const data=await Book.find();
    return res.json({mess:"data recieved",data});
   }
   catch(e){
    return res.json({mess:e.message});
   }
})
app.post("/deletebyid",async(req,res)=>{
    
    var {id}=req.body;
    console.log(id);

   try{
   //const data=await Book.deleteOne({_id:new ObjectId(id)});
   const data = await Book.deleteOne({ _id: id });
    console.log(data);
     return res.json({mess:"data recieved",data})
    console.log(id);
    
    return res.json({mess:"deleted successfully"});
   }
   catch(e){
    return res.json({mess:e.message});
   }
})
// deletebyid









app.get("/bookCount",async(req,res)=>{
    console.log(req.body);
   try{
    // const data=await Book.find();
    const countarr=await datacount();
    return res.json({mess:"data recieved",data:countarr});
   }
   catch(e){
    return res  .json({mess:e.message});
   }
})
app.get("/deletebooks",async(req,res)=>{
    console.log(req.body);
   try{
    const data=await Book.deleteMany();
    return res.json({mess:"data recieved",data});
   }
   catch(e){
    return res.json({mess:e.message});
   }
})

app.post('/save',async(req,res)=>{
    console.log(req.body);
    try{
        if(pollsData?.length){
            //update
            const resp = await Pollsmodel.updateOne({ pollsData}, { pollsData:req.body });
            console.log("updated",resp);


            // after update
            FirstTimeCall();

            res.json({mess:"udpated"});

            
        }
        else{
            //create
            const validate=new Pollsmodel({pollsData:req.body});
            await validate.save();
            console.log(validate);

            // after creating
            FirstTimeCall();


            res.json({mess:"getted"});
        }
        
    }
    catch(e){
        console.log(res.json({"msg":e?.message}));
        
    }
})



function closeServer() {
    httpServer.close(() => {
      console.log('Server stopped listening');
    });
  }
  
  const Port=3001 | process.env.PORT;
function call(){
    httpServer.listen(Port,()=>{
        console.log("server is listening");
    })
}
// updatebook
app.post('/updatebook',async(req,res)=>{
    try{
        console.log(req.body);
    const {id,data}=req.body;
    const resp=await Book.updateOne({_id:id},{
        $set:data
    });
    console.log("resp",resp);
    res.json({msg:"updated"})
    }
    catch(e){
        console.log(e?.message);
    }
})

app.post("/borrow",async(req,res)=>{
    var {startDate,endDate,id}=req.body;
    console.log(startDate,endDate,id);

   try{
    const resp = await Book.findOne({ _id: id});
    console.log(resp);
    const filter = { _id: id };
    console.log(filter);
    const updatedresult = await Book.updateOne(filter, {$set:{
         startDate: new Date(startDate), // Ensure date fields are in Date format
        endDate: new Date(endDate),     // Ensure date fields are in Date format
        "borrowed": true,
        "overdue": false}});
    console.log(updatedresult);
   }
   catch(e){
    console.log(e);
   }
    res.json({mess:"data has been send"});

})




var client_id = '558f508525964bb5ae308695a37358a5';
// var redirect_uri = 'http://localhost:3000';
var redirect_uri = 'http://localhost:3000/login';


app.get('/login', function(req, res) {

    var state = generateRandomString(16);
    var scope = 'user-read-private user-read-email';
  
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));
  });

  app.post('/getartists',async(req,res)=>{
   const { authorization}=(req.body.Headers);
//    console.log("=>",JSON.parse(authorization));
//    const respback=await getArtists(JSON.parse(authorization))
//    console.log(respback);
   return res.json({mess:"all is well"});
  } );


app.post('/login',SpotifyCall)
app.get("/deleteusers",async (req,res)=>{
    await LibraryUser.deleteMany();
    res.json({mess:"users deleted successfully "})
})
app.post("/signin",async(req,res)=>{
    console.log(req.body);
    const { Email , Password}=req.body;
    //  if we have email in our login we try to give token
    try{
        const resp=await LibraryUser.find({Email:Email});
        console.log(resp);
        if(resp.length){
            // means user is there just to need to verify password;
            // and give to token it ;
            const cryptedPassword= await bcrypts.compare(Password,resp[0].Password);
            console.log(cryptedPassword);
            if(cryptedPassword){
                // that means password is correct
               const token=await jsonwebtoken.sign({Email:Email,Password:Password},jwtsecret);
               console.log(token);
                res.json({mess:"user Successfully Login",token,userprofile:resp[0]});
                // res.json({mess:"successfully recieved"});
            }
            else{
                // password is wrong
                res.json({mess:"Invalid login Credentials"});
            }
            // bcrypts.compare()
            
        }
        else{
            res.json({mess:"User doesn't exists"});
        }
    }
    catch(e){
        res.json({mess:e?.message});
    }
    //  else we said user doesn't have an account
    
})
app.post('/register',async(req,res)=>{
    console.log(req.body);
    // user IS there
    const User=await LibraryUser.find({
        $or: [
          { UserName: { $regex: new RegExp('^' + `${req.body?.UserName}` + '$', 'i') } },
          { Email: { $regex: new RegExp('^' +`${req.body?.Email}` + '$', 'i') } }
        ]
      });
    console.log(User);
    if(User.length){
        res.json({'error':"user is already there"});
    }
    // user is not there 
    else{
        const CryptedPassword=await bcrypts.hash(`${req.body?.Password}`,10);
        console.log(CryptedPassword);
        const {body}=req;
       const obj= {...body,"Password":CryptedPassword};
       console.log(obj);
    //    const check= "$2b$10$H8kSqjb2B.040kQNtYYvLeiLZTwOuvc3/D/ZjQz0teSFCQRvjQ1jG";
    //   const checking= await bcrypts.compare(`${req.body?.Password}`,check); 
    //   console.log(req.body);
    // jwtsecret
        const jsontoken= await jsonwebtoken.sign(obj,jwtsecret);
        console.log(jsontoken);
        const newUser= new LibraryUser(obj);
        await newUser.save();
        res.json({mess:"user is saved",token:jsontoken,userprofile:obj});
    }
//   res.json({mess:"Getting an response"});
});



// app.post('/clear',async(req,res)=>{
//     console.log(req.body);
//     console.log("cleared api hit !");
//     try{
//         const resp=await Pollsmodel.deleteMany();
//          // after deleting
//         FirstTimeCall();
//         res.json({mess:"cleared"});
//         closeServer();
//         call();
//     }
//     catch(e){
//         console.log(res.json({"msg":e?.message}));
        
//     }
// })


call();

