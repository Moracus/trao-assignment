import mongoose from "mongoose";

const KitSchema = new mongoose.Schema({
  title: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Kit = mongoose.model("Kit",KitSchema);
export default Kit;
