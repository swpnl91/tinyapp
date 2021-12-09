const express = require("express");
const app = express();

const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const generateRandomString = function() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26 + 97);
    const randomChar = String.fromCharCode(randomCharCode);
    randomString += randomChar;
  }
  return randomString;
};


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
    password: "123"
  },
 "user2ID": {
    id: "user2ID", 
    email: "2@a.com", 
    password: "123"
  }
}

const findUser = (newEmail) => {
  for (const id in users) {
    const user = users[id];
    if (user["email"] === newEmail) {
      return user;
    }
  }
  return false;
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



const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require("body-parser");
const { request } = require("express");
app.use(bodyParser.urlencoded({extended: true}));




app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {

  if (!req.cookies.user_id) {
    return res.status(403).send("You need to login/register to view the TinyURLs");
  }

  const obj = urlsForUser(req.cookies.user_id)
  //const templateVars = {urls: urlDatabase, username: req.cookies["username"]};     // assigns existing object (urlDatabase) as a value to key urls in a new object
  const templateVars = {urls: obj, user: users[req.cookies.user_id]};
  res.render("urls_index", templateVars);   // renders "urls_index" ejs & templateVars can be accessed in that file (See for.. in loop)
});

app.get("/urls/new", (req, res) => {

  if (!req.cookies.user_id) {
    res.redirect("/login");
  }
  //const templateVars = {urls: urlDatabase, username: req.cookies["username"]};
  const templateVars = {urls: urlDatabase, user: users[req.cookies.user_id]};
  res.render("urls_new", templateVars );
});

app.get("/urls/:shortURL", (req, res) => {    /// ????? what does it do?
  //const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"]};   // params is parameters
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("id does not exist");
  }

  const urlId = req.params.shortURL;
  const cookieId = req.cookies.user_id;
  
  if (urlDatabase[urlId].userID !== String(req.cookies.user_id)) {
    return res.status(401).send("URL doesn't belong to user");
  }

  const templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies.user_id]};
  res.render("urls_show", templateVars);  // renders "urls_show" ejs and templateVars can be accessed in the ejs file
});

app.get("/u/:shortURL", (req, res) => {   // anything after : is a wild card & can be accessed by req.params
  
  //const templateVars = {urls: urlDatabase, username: req.cookies["username"]}; <= doesn't go here because it redirects outside of tinyapp

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);    // for redirecting to the actual webpage using the shortURL
});

app.get("/register", (req, res) => {
  //const templateVars = {urls: urlDatabase, username: req.cookies["username"]}; 
  const templateVars = {urls: urlDatabase, user: users[req.cookies.user_id]};
  res.render("register", templateVars);
});

app.get("/login", (req, res) => { 
  const templateVars = {urls: urlDatabase, user: users[req.cookies.user_id]};
  res.render("login", templateVars);
});






app.post("/urls", (req, res) => {
  
  if (!req.cookies.user_id) {
    return res.status(403).send("You need to login to create/modify a TinyURL");
  }

  const shortURL = generateRandomString();  // generating a random string using above function for shortURL
  const longURL = req.body.longURL;       // body is what's being submitted via form/submit button
  urlDatabase[shortURL] = {longURL: longURL, userID: req.cookies.user_id};        // assigning a new key-value pair in object (database)
  res.redirect(`/urls/${shortURL}`);
   
  
});

app.post("/urls/:shortURL/delete", (req, res) => {  // for deleting
  
  if (!req.cookies.user_id) {
    return res.status(403).send("You need to login to create/modify a TinyURL");
  }

  const url = req.params.shortURL;
  const cookieId = req.cookies.user_id;
  
  if (urlDatabase[url].userID !== String(req.cookies.user_id)) {
    return res.status(401).send("URL doesn't belong to user");
  }



  const urlId = req.params.shortURL;    //
  delete urlDatabase[urlId];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {  // for editing/updating
  
  if (!req.cookies.user_id) {
    return res.status(403).send("You need to login to create/modify a TinyURL");
  }

  const url = req.params.id;
  const cookieId = req.cookies.user_id;
  
  if (urlDatabase[url].userID !== String(req.cookies.user_id)) {
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
  
  //const userName = req.body.username;

  const isUser = findUser(email);

  if (!isUser) {
    return res.status(400).send("Email address not found");
  } 

  if (isUser.password !== password) {
    return res.status(400).send("Password doesn't match");
  }

  res.cookie("user_id", isUser.id);
  // res.cookie("username", userName);
  res.redirect("/urls");

});

app.post("/logout", (req, res) => {
  const id = req.body.user_id;
  res.clearCookie("user_id", id);
  res.redirect("/urls");
});


app.post("/register", (req, res) => {
  
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Email/Password cannot be blank!");
  }

  const isUser = findUser(email);

  if (isUser) {
    return res.status(400).send("Email address already registered");
  }

  const id = generateRandomString();

  users[id] = {id, email, password}; 

  res.cookie("user_id", id);
  
  res.redirect("urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});