const mongoose = require("mongoose");

// Generic atomic counter collection used to generate collision-safe
// sequential codes (e.g. issue codes) even under concurrent writes.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

// Atomically increments and returns the next value for the given key.
// findOneAndUpdate with $inc is a single atomic operation in MongoDB,
// so two concurrent requests can never receive the same sequence number.
async function getNextSequence(key) {
  const result = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result.seq;
}

module.exports = { Counter, getNextSequence };
