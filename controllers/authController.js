const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisfy = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
    failureRedirect:'/login',
    failureFlash: "Failed Login",
    successRedirect: '/',
    successFlash: "Welcome Back!!"
});

exports.logout = (req,res) =>{
    req.logout();
    req.flash('success', "You are now Logged Out!!");
    res.redirect('/');
}

exports.isLoggedIn = (req,res,next) => {
    if(req.isAuthenticated()){
        next();
        return;
    }
    req.flash('error', "You Must be Logged in to Do that");
    res.redirect('/login');
}

exports.forgot = async (req,res) => {
    //1.User Exists if not
    const user = await User.findOne({email: req.body.email});
    if(!user) {
        req.flash('error', 'No Account with email Exists');
        return res.redirect('/login');
    }
    //2.set Reset Token & Expiry 
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000 //1 hour
    await user.save();
    //3.Send Email
    const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    await mail.send({
        user: user,
        filename: 'password-reset',
        subject: 'Password Reset',
        resetUrl: resetUrl
    });
    req.flash('success', `You have been mailed link - ${resetUrl}`);
    //4. REdirect to login
    res.redirect('/login')
}

exports.reset = async (req,res)=> {
    // res.json(req.params)
    const user= await User.findOne({
        resetPasswordToken : req.params.token,
        resetPasswordExpires :{$gt: Date.now()}
    });
    if(!user) {
        req.flash('error', 'Passowrd Reset Token is Invalid or Expired');
        return res.redirect('/login');
    }
    //Now if there is user when want a new form to get the new password from the user
    res.render('reset', {title: 'Reset Password'})
}

exports.confirmPasswords = (req,res,next)=>{
    if(req.body.password=== req.body['password-confirm']) {
        next();
        return;
    }
    req.flash('error','Password DOnt match');
    res.redirect('back');
}

exports.update = async (req,res) =>{
    const user= await User.findOne({
        resetPasswordToken : req.params.token,
        resetPasswordExpires :{$gt: Date.now()}
    });
    if(!user) {
        req.flash('error', 'Passowrd Reset Token is Invalid or Expired');
        return res.redirect('/login');
    }

    const setPassword = promisfy(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success','Password Updated Successfully');
    res.redirect('/');
}