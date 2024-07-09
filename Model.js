import { model, Schema } from "mongoose";


const pollsSchema=new Schema({
    pollsData: Array
})

const Pollsmodel = model("PollsData",pollsSchema);
export default Pollsmodel;