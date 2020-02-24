const mongoose = require("mongoose");

// MONGOOSE/MODEL CONFIG
const blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = mongoose.model("Blog", blogSchema);
