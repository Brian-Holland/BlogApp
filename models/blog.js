const mongoose = require("mongoose");

// blog model schema creation
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
