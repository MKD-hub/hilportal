const mongoose = require("mongoose");

const newSchema = new mongoose.Schema({
  id: String,
  paymentId: String,
  name: String,
  paymentReceipt: String,
  verified: {
    default: false,
    type: Boolean,
  },
}, { timestamps: true });

module.exports = mongoose.model("payment", newSchema);
