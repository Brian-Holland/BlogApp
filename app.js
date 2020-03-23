const express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    methodOverride = require("method-override"),
    expressSanitizer = require("express-sanitizer"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    Blog = require("./models/blog"),
    User = require("./models/user"),
    middleware = require("./middleware");

// app config (for deployment or local)
mongoose.connect(process.env.DATABASEURL || "mongodb://localhost/blog_app", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(expressSanitizer());

//passport config
app.use(
    require("express-session")({
        secret: "my blog secret",
        resave: false,
        saveUninitialized: false
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//check if user logged in on every route
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

//=====RESTFUL ROUTES=====//

//main page
app.get("/", (req, res) => {
    res.redirect("/blogs");
});

//register form
app.get("/register", (req, res) => {
    res.render("register");
});

//handle sign up logic
app.post("/register", (req, res) => {
    let newUser = new User({ username: req.body.username });
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("back");
        }
        passport.authenticate("local")(req, res, () => {
            res.redirect("/blogs");
        });
    });
});

//login page
app.get("/login", (req, res) => {
    res.render("login");
});

//handles login logic
app.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/blogs",
        failureRedirect: "/login"
    }),
    (req, res) => {}
);

//logout route
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/blogs");
});

//main page blog list
app.get("/blogs", (req, res) => {
    Blog.find({}, (err, blogs) => {
        if (err) {
            console.log(err);
        } else {
            res.render("index", { blogs: blogs });
        }
    }).sort({ created: "descending" });
});

//form to create new blog
app.get("/blogs/new", middleware.isAdmin, (req, res) => {
    res.render("new");
});

//handle logic for new blogs
app.post("/blogs", middleware.isAdmin, (req, res) => {
    //check for harmful scripting in blog body and sanitize
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.create(req.body.blog, (err, newBlog) => {
        if (err) {
            res.render("new");
        } else {
            res.redirect("/blogs");
        }
    });
});

//more info on specific blog
app.get("/blogs/:id", (req, res) => {
    Blog.findById(req.params.id, (err, foundBlog) => {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("show", { blog: foundBlog });
        }
    });
});

//ddit form
app.get("/blogs/:id/edit", middleware.isAdmin, (req, res) => {
    Blog.findById(req.params.id, (err, foundBlog) => {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("edit", { blog: foundBlog });
        }
    });
});

//handle blog edit logic
app.put("/blogs/:id", middleware.isAdmin, (req, res) => {
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, (err, updatedBlog) => {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

//Deletes blogs
app.delete("/blogs/:id", middleware.isAdmin, (req, res) => {
    Blog.findByIdAndRemove(req.params.id, err => {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs");
        }
    });
});

app.listen(process.env.PORT || 3000, process.env.IP, () => {
    console.log("Blog Server Started");
});
