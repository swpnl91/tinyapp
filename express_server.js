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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require("body-parser");
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
  const templateVars = {urls: urlDatabase, username: req.cookies["username"]};     // assigns existing object (urlDatabase) as a value to key urls in a new object
  res.render("urls_index", templateVars);   // renders "urls_index" ejs & templateVars can be accessed in that file (See for.. in loop)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {    /// ????? what does it do?
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};   // params is parameters
  res.render("urls_show", templateVars);  // renders "urls_show" ejs and templateVars can be accessed in the ejs file
});

app.get("/u/:shortURL", (req, res) => {   // anything after : is a wild card & can be accessed by req.params
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);    // for redirecting to the actual webpage using the shortURL
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();  // generating a random string using above function for shortURL
  const longURL = req.body.longURL;       // body is what's being submitted via form/submit button
  urlDatabase[shortURL] = longURL;        // assigning a new key-value pair in object (database)
  res.redirect(`/urls/${shortURL}`);
  console.log(req.body);  // Log the POST request body to the console  
  
});

app.post("/urls/:shortURL/delete", (req, res) => {  // for deleting
  const urlId = req.params.shortURL;    //
  delete urlDatabase[urlId];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {  // for editing/updating
  const urlId = req.params.id;           // extracting id
  const newLongUrl = req.body.newURL;    // extracting new/edited url submitted from the body (using .newURL because that's what it's named in url_show)

  urlDatabase[urlId] = newLongUrl;      // assigning it as a value directly to the key in object/urlDatabase

  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  
  const userName = req.body.username;
  res.cookie("username", userName);
  res.redirect("/urls");

});

app.post('/logout', (req, res) => {
  const username = req.body.username
  res.clearCookie('username', username);
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});