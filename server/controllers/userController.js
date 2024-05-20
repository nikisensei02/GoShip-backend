const User = require("../model/userModel");
const brcypt = require("bcrypt");

module.exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user)
            return res.json({ msg: "Incorrect Username or Password", status: false });
        const isPasswordValid = await brcypt.compare(password, user.password);
        if (!isPasswordValid)
            return res.json({ msg: "Incorrect Username or Password", status: false });
        delete user.password;
        return res.json({ status: true, user });
    } catch (ex) {
        next(ex);
    }
};




module.exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const checkUsername = await User.findOne({ username });
        if (checkUsername) {
            return res.json({ msg: "username already taken", status: false })
        }
        const checkEmail = await User.findOne({ email });
        if (checkEmail) {
            return res.json({ msg: "Email already used", status: false })
        }
        const hashPassword = await brcypt.hash(password, 10);
        const user = await User.create({
            email,
            username,
            password: hashPassword,
        });
        delete user.password;
        return res.json({ status: true, user });
    } catch (ex) {
        next(ex);
    }

}



module.exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({_id:{$ne: req.params.id}}).select([
            "email",
            "username",
            "_id",
        ]);
        return res.json(users);

    } catch (ex) {
        next(ex);
    }
 };

 module.exports.logOut = (req, res, next) => {
    try {
      if (!req.params.id) return res.json({ msg: "User id is required " });
      onlineUsers.delete(req.params.id);
      return res.status(200).send();
    } catch (ex) {
      next(ex);
    }
  };