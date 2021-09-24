const mongoose = require('mongoose')
const express = require("express")
const https = require("https")
const bodyParser=require("body-parser")
const validator = require("validator")
const session = require('express-session')
const passport = require('passport')
const path = require('path')
const stripe = require('stripe')('sk_test_51Jd6kzAHulU9sUTHVx2WWktKaGt4wOW5o77oeug6cS60vPFeTHH40GsoRxuk79mF40Eku3fEE02xsTWKA1qqxR4F00i6H2gytg')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const { createBrotliCompress } = require('zlib')
//const bcrypt = require('bcrypt')
//mongoose.connect("mongodb://localhost:27017/taskDB", { useNewUrlParser: true })
mongoose.connect("mongodb+srv://adminyuxuan:64l06x22L@cluster0.5u1s3.mongodb.net/taskDB?retryWrites=true&w=majority", { useNewUrlParser: true })
const PORT = process.env.PORT || 8000
const ip = "127.0.0.1";
const db = []

const userSchema = new mongoose.Schema({
    Country: {
        type: String,
        require: true,
    },
    FirstName: {
        type: String,
        require: true,
    },
    LastName: {
        type: String,
        require: true,
    },
    Email: {
        type: String,
        require: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("The format of the Email is incorrect")
            }
        }
    },
    Password: {
        type: String,
        require: true,
        minlength:8
    },
    RePassword: {
        type: String,
        require: true,
        minlength: 8,
        validate(value){
            if(!validator.equals(value, this.Password)){
                throw new Error("Passwords are not match")
            }
        }
    },
    AddressOne: {
        type: String,
        require: true,
    },
    AddressTwo: {
        type: String,
        require: true,
    },
    City: {
        type: String,
        require: true,
    },
    State: {
        type: String,
        require: true,
    },
    Zip: {
        type: String,
        require: false
    },
    MobileNum: {
        type: Number,
        require: false
    }
})

const data = mongoose.model('data', userSchema)

const app = express()
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))

app.get("/",(req,res)=>{
    res.sendFile(__dirname + "/registration.html")
})

app.post('/',(req,res)=>{
        const Country= req.body.country
        const FirstName= req.body.firstName
        const LastName= req.body.lastName
        const Email= req.body.email
        const Password= req.body.password
        const RePassword= req.body.rePassword
        const AddressOne= req.body.addressOne
        const AddressTwo= req.body.addressTwo
        const City= req.body.city
        const State= req.body.state
        const Zip= req.body.zip
        const MobileNum= req.body.phone

        const accountdata = new data({
            Country: Country,
            FirstName: FirstName,
            LastName: LastName,
            Email: Email,
            Password: hash,
            RePassword: hash,
            AddressOne: AddressOne,
            AddressTwo: AddressTwo,
            City: City,
            State: State,
            Zip: Zip,
            MobileNum: MobileNum
        })

        accountdata.save((err) =>{
            if(err){
               console.log(err)
            }
            else{
                console.log("add")
            }
        })
        const ApiData = {
            members:[{
                email_address: Email,
                status: "subscribed",
                merge_fields:{
                    FNAME:FirstName,
                    LNAME:LastName
                }
            }]
        }

        jsonData = JSON.stringify(ApiData)

        const url = "https://us5.api.mailchimp.com/3.0/lists/4c18d9549a"
        const options={
            method:"POST",
            auth:"azi:7d245a7c3c3e869cda03c035a4d19ce1"
        }

        const request = https.request(url,options,(response) =>{
            response.on("apidata",(ApiData)=>{
                Console.log(JSON.parse(ApiData))
            })
        })

        request.write(jsonData)
        request.end()
        console.log(Email)
})

app.listen(process.env.PORT);
let port = process.env.PORT;

 app.listen(8000, (req,res)=>{
     console.log(`server is running at http://${ip}:${PORT}`);
     
})


app.get('/login.html', (req,res)=>{
    res.sendFile(__dirname + "/login.html")
})

app.post('/login.html', (req,res)=>{
    const email = req.body.email
    const Password = req.body.password

    data.findOne({Email: email}, function(error, foundUser){
        if(!error){
            if(foundUser){
                if(bcrypt.compareSync(Password, db[Password])){
                    res.sendFile(__dirname + "/views/payment.html")
                }
                else{
                    res.sendFile(__dirname + "/404.html")
                }
            }
        }
    })
})


// google login express server

app.set('view engine','ejs')

app.use(session({
    resave:false,
    saveUninitialized: true,
    secret:'SECRET'
}));

app.get('/',function(req,res){
    res.render('pages/auth');
});

// google login passport setup


var userProfile

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine','ejs');

app.get('/success',function(req,res){
    res.redirect("https://aqueous-garden-63450.herokuapp.com/payment.html")
});

app.get('/error',function(req,res){
    res.send('error loggin in');
});

passport.serializeUser(function(user,cb){
    cb(null, user);
});

passport.deserializeUser(function(obj,cb){
    cb(null, obj)
});

// google login authentication

const GOOGLE_CLIENT_ID = '898637008850-lk4untndfva7sq0ibu4tp4546utul8q7.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'K2vo2TSGZoBDbHYgdJHo8hvH';

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL:"https://aqueous-garden-63450.herokuapp.com/auth/google/callback"
    },
    function(accessToken,refreshToken,profile,done){
        userProfile = profile;
        return done(null,userProfile);
    }
));

app.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));

app.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/error'}),
    function(req,res){
        res.redirect('/success');
    }
);


// payment page



app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname, './views')));

app.post('/charge', (req, res) => {
    try {
        stripe.customers.create({
            name: req.body.name,
            email: req.body.email,
            source: req.body.stripeToken
        }).then(customer => stripe.charges.create({
            amount: req.body.amount * 100,
            currency: 'usd',
            customer: customer.id,
            description: 'Thank you for your generous donation.'
        })).then(() => res.render('complete.html'))
            .catch(err => console.log(err))
    } catch (err) { res.send(err) }
})
