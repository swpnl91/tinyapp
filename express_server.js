const { findUser } = require('./helpers');

const express = require("express");
const app = express();

const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

const cookieSession = require("cookie-session");
app.use(cookieSession ({
  name: 'session',
  keys: ['key1', 'key2']
}));

const bodyParser = require("body-parser");
const { request } = require("express");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const PORT = 8080; // default port 8080


// const cookieParser = require("cookie-parser");
// app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": {
      longURL: "http://www.lighthouselabs.ca",
      userID: "user1ID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2ID"
  },
  "1sm2xK": {
    longURL: "http://www.facebook.com",
    userID: "user1ID"
  },
  "123vxK": {
    longURL: "http://www.instagram.com",
    userID: "user1ID"
  }
};

const users = { 
  "user1ID": {
    id: "user1ID", 
    email: "1@a.com", 
    password: bcrypt.hashSync('123', salt)
  },
 "user2ID": {
    id: "user2ID", 
    email: "2@a.com", 
    password: bcrypt.hashSync('123', salt)
  }
}


const generateRandomString = function() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26 + 97);
    const randomChar = String.fromCharCode(randomCharCode);
    randomString += randomChar;
  }
  return randomString;
};


const urlsForUser = (id) => {
  const obj = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key]["userID"] === id) {
      obj[key] = urlDatabase[key];
    }
  }
  return obj;
};


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Home
app.get("/", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  } else {
    return res.redirect("/urls");
  }
});


// Example
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });


app.get("/urls", (req, res) => {

  const obj = urlsForUser(req.session.user_id); 
  const templateVars = {urls: obj, user: users[req.session.user_id]};     // assigns existing object (urlDatabase) as a value to key urls in a new object
  
  if (!req.session.user_id) {      // Checks for a cookie session to know whether user logged in or not
    return res.status(403).render("urls_index", templateVars);
  }

  res.render("urls_index", templateVars);      // renders "urls_index" ejs & templateVars can be accessed in that file (See for.. in loop)
});


app.get("/urls/new", (req, res) => {   // Takes it to "create url"
 
  if (!req.session.user_id) {
    return res.redirect("/login");
  }

  const templateVars = {urls: urlDatabase, user: users[req.session.user_id]};
  res.render("urls_new", templateVars );
});


app.get("/urls/:shortURL", (req, res) => {    // Takes it to "edit url"
  
  if (!req.session.user_id) {
    return res.status(403).send("You need to login/register to view the TinyURLs");
  }
  
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("id does not exist");
  }

  const urlId = req.params.shortURL;
  const cookieId = req.session.user_id;

  if (urlDatabase[urlId].userID !== String(req.session.user_id)) {
    return res.status(401).send("URL doesn't belong to user");
  }

  const templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id]};
  res.render("urls_show", templateVars);  // renders "urls_show" ejs and templateVars can be accessed in the ejs file
});


app.get("/u/:shortURL", (req, res) => {   // anything after : is a wild card & can be accessed by req.params
  
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("URL does not exist");
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);    // for redirecting to the actual webpage using the shortURL
});


app.get("/register", (req, res) => {
  
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = {urls: urlDatabase, user: users[req.session.user_id]};
  res.render("register", templateVars);
});


app.get("/login", (req, res) => { 

  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = {urls: urlDatabase, user: users[req.session.user_id]};
  res.render("login", templateVars);
});


app.post("/urls", (req, res) => {
  
  if (!req.session.user_id) {
    return res.status(403).send("You need to login to create/modify a TinyURL");
  }

  const shortURL = generateRandomString();  // generating a random string using above function for shortURL
  const longURL = req.body.longURL;       // body is what's being submitted via form/submit button
  
  urlDatabase[shortURL] = {longURL: longURL, userID: req.session.user_id};  // assigning a new key-value pair in object (database)
  res.redirect(`/urls/${shortURL}`);
});


app.post("/urls/:shortURL/delete", (req, res) => {  // for deleting   // Minor part left ***

  if (!req.session.user_id) {
    return res.status(403).send("You need to login to create/modify a TinyURL");
  }

  const url = req.params.shortURL;
  const cookieId = req.session.user_id;

  if (urlDatabase[url].userID !== String(req.session.user_id)) {
    return res.status(401).send("URL doesn't belong to user");
  }

  const urlId = req.params.shortURL;
  delete urlDatabase[urlId];
  res.redirect("/urls");
});


app.post("/urls/:id", (req, res) => {      // for editing/updating
  
  if (!req.session.user_id) {
    return res.status(403).send("You need to login to create/modify a TinyURL");
  }

  const url = req.params.id;
  const cookieId = req.session.user_id;
  
  if (urlDatabase[url].userID !== req.session.user_id) {
    return res.status(401).send("URL doesn't belong to user");
  }

  const urlId = req.params.id;           // extracting id
  const newLongUrl = req.body.newURL;    // extracting new/edited url submitted from the body (using .newURL because that's what it's named in url_show)

  urlDatabase[urlId].longURL = newLongUrl;      // assigning it as a value directly to the key in object/urlDatabase

  res.redirect("/urls");
});


app.post("/login", (req, res) => {
  
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  if (!email || !password) {                  // Checks for blank credentials
    return res.status(400).send("Email/Password cannot be blank!");
  }

  const isUser = findUser(email, users);

  if (!isUser) {         // Checks for email id
    return res.status(400).send("Email address not found");
  } 
  
  const result = bcrypt.compareSync(password, isUser.password);

  if (result) {                             // Checks whether hashed passwords are matching or not
    req.session.user_id = isUser.id;
    res.redirect("/urls"); 
  } else {
    return res.status(400).send("Password doesn't match");
  }
});

app.post("/logout", (req, res) => {
  const id = req.body.user_id;
  req.session = null;
  res.redirect("/urls");
});


app.post("/register", (req, res) => {
  
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);   // hashing the password. hashSync is not normally used. Asynchronous is the way to go.

  if (!email || !password) {
    return res.status(400).send("Email/Password cannot be blank!");
  }

  const isUser = findUser(email, users);

  if (isUser) {
    return res.status(400).send("Email address already registered");
  }

  const id = generateRandomString();

  users[id] = {id, email, "password": hashedPassword}; 

  req.session.user_id = id;
  
  res.redirect("urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});