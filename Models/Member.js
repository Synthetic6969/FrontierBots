const mongoose = require('mongoose');
const MemberSchema = new mongoose.Schema({
    discord_id: String,
    roblox_id: String,
});

module.exports = mongoose.model("Member", MemberSchema);