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

// APP CONFIG
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

//Passport Config
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

//Check if user logged in on every route
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

//=====RESTFUL ROUTES=====//

//Main page
app.get("/", (req, res) => {
    res.redirect("/blogs");
});

//show register form
app.get("/register", (req, res) => {
    res.render("register");
});

//handle sign up logic
app.post("/register", (req, res) => {
    var newUser = new User({ username: req.body.username });
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

//Main page blog list
app.get("/blogs", (req, res) => {
    Blog.find({}, (err, blogs) => {
        if (err) {
            console.log(err);
        } else {
            res.render("index", { blogs: blogs });
        }
    }).sort({ created: "descending" });
});

//Form to create new blog
app.get("/blogs/new", middleware.isAdmin, (req, res) => {
    res.render("new");
});

//Post route for new blogs
app.post("/blogs", middleware.isAdmin, (req, res) => {
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.create(req.body.blog, (err, newBlog) => {
        if (err) {
            res.render("new");
        } else {
            res.redirect("/blogs");
        }
    });
});

//More info on specific blog
app.get("/blogs/:id", (req, res) => {
    Blog.findById(req.params.id, (err, foundBlog) => {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("show", { blog: foundBlog });
        }
    });
});

//Edit form
app.get("/blogs/:id/edit", middleware.isAdmin, (req, res) => {
    Blog.findById(req.params.id, (err, foundBlog) => {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("edit", { blog: foundBlog });
        }
    });
});

//Posts edit to blog
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
