const Blog = require("../models/blog");

const middlewareObj = {
    checkBlogOwnership: (req, res, next) => {
        //is user logged in?
        if (req.isAuthenticated()) {
            Blog.findById(req.params.blog_id, (err, foundBlog) => {
                if (err) {
                    res.redirect("back");
                } else {
                    //does user own blog? equals method to compare from Mongoose
                    if (foundBlog.author.id.equals(req.user._id)) {
                        next();
                    } else {
                        res.redirect("back");
                    }
                }
            });
        } else {
            res.redirect("back");
        }
    },
    isLoggedIn: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect("/login");
    },
    isAdmin: (req, res, next) => {
        if (req.isAuthenticated()) {
            if (req.user.isAdmin) {
                next();
            } else {
                res.redirect("back");
            }
        } else {
            res.redirect("/login");
        }
    }
};

module.exports = middlewareObj;
