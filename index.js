import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import {Server} from "socket.io";
import http from "http";
import ConnectDb from "./Db.js";
import Pollsmodel from "./Model.js";

const app = express();
app.use(cors());

app.use(bodyParser.json({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));


const httpServer = http.createServer(app);
ConnectDb();

const io=new Server(httpServer,{
    cors:{
        origin:"http://localhost:3000",
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
FirstTimeCall();

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
  
function call(){
    httpServer.listen(3001,()=>{
        console.log("server is listening");
    })
}
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

