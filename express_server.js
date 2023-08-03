const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * Generates a random alpha-numeric string
 * @returns {String} randomString
 */
const generateRandomString = function () {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
};

/**
 * 
 * @param {String} email 
 * @param {String} users 
 * @returns user
 */
function getUserByEmail(email, users) {
  for (let userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

/**
 * Authenticates user accounts
 * @param {*} providedPassword 
 * @param {*} storedPassword 
 * @returns Boolean
 */
function passwordMatches(providedPassword, storedPassword) {
  return providedPassword === storedPassword;
}

/**
 * 
 * @param {*} id 
 * @returns urls
 */
function urlsForUser(id) {
  let urls = {};
  for(let url in urlDatabase){
    if(urlDatabase[url].userID === id){
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
}

// User object to store new users
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  if(user) { // If the user is logged in
    res.redirect("/urls"); // Redirect them to /urls
  } else { // If the user is not logged in
    const templateVars = {
      user: user,
    };
    res.render("user_register", templateVars); 
  }
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const urls = urlsForUser(userId); // get only the URLs for this user
  const templateVars = {
    urls: urls,
    user: user,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  
  if (user) { // If the user is logged in
    const templateVars = {
      user: user,
    };
    res.render("urls_new", templateVars);
  } else { // If the user is not logged in
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const id = req.params.id;

  // If user is not logged in
  if (!userId) {
    return res.status(403).send('Please log in to view URLs.');
  }

  // If URL does not exist or does not belong to the user
  if (!urlDatabase[id] || urlDatabase[id].userID !== userId) {
    return res.status(403).send('This URL does not exist or you do not have access to it.');
  }

  const longURLParam = urlDatabase[id].longURL;
  const templateVars = {
    id: id,
    longURL: longURLParam,
    user: user,
  };
  res.render("urls_show", templateVars);
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const urlObject = urlDatabase[shortURL];

  if (urlObject) {
    res.redirect(urlObject.longURL);
  } else {
    res.status(404).send("The URL does not exist");
  }
});

app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  if(user) { // If user is logged in
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;

    urlDatabase[shortURL] = longURL;

    console.log(req.body); // Log the POST request body to the console
    res.redirect(`/urls/${shortURL}`);
  } else { // If user is not logged in
    res.status(401).send("You need to log in to shorten URLs");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies["user_id"];
  const id = req.params.id;

  // If user is not logged in
  if (!userId) {
    return res.status(403).send('Please log in to delete URLs.');
  }

  // If URL does not exist or does not belong to the user
  if (!urlDatabase[id] || urlDatabase[id].userID !== userId) {
    return res.status(403).send('This URL does not exist or you do not have access to delete it.');
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls/:id/edit", (req, res) => {
  const userId = req.cookies["user_id"];
  const id = req.params.id;
  const updatedLongURL = req.body.longURL;

  // If user is not logged in
  if (!userId) {
    return res.status(403).send('Please log in to edit URLs.');
  }

  // If URL does not exist or does not belong to the user
  if (!urlDatabase[id] || urlDatabase[id].userID !== userId) {
    return res.status(403).send('This URL does not exist or you do not have permission to edit it.');
  }

  // Update the value of the stored long URL
  urlDatabase[id].longURL = updatedLongURL;

  // Redirect the client back to /urls
  res.redirect("/urls");
});


app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users); // user object if it exists, otherwise null

  if (!user) {
    // If the user doesn't exist
    res.status(403).send('No user with that email found');
    return;
  }

  if (!bcrypt.compareSync(password, user.password)) {
    // If the password doesn't match
    res.status(403).send('Invalid password');
    return;
  }

  // On successful login
  res.cookie('user_id', user.id);
  res.redirect('/urls');
});


app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

function generateRandomId() {
  return crypto.randomBytes(16).toString("hex");
}

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomId();

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).send("Please enter both email and password.");
  }

  // Check if email already exists
  for (let userId in users) {
    if (users[userId].email === email) {
      return res.status(400).send("Email already registered.");
    }
  }

  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create a new user and add to the users object
  const newUser = { id, email, password: hashedPassword };  // Store hashed password
  users[id] = newUser;

  // Set user_id cookie and redirect
  res.cookie("user_id", id);
  res.redirect("/urls");

  console.log(users); // Log the users object
});

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId]; // Look up the user data using the user ID from the cookie

  if(user) { // If the user is logged in
    res.redirect("/urls"); // Redirect them to /urls
  } else { // If the user is not logged in
    const templateVars = {
      user: user, // Pass the entire user object
    };
    res.render("user_login", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if(urlDatabase[shortURL]) { // If shortURL exists in the database
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else { // If shortURL doesn't exist in the database
    res.status(404).send('This short URL does not exist.');
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
