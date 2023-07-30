const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

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

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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
  const templateVars = {
    user: user,
  };
  res.render("user_register", templateVars); // Replace 'register' with the name of your registration template
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = {
    urls: urlDatabase,
    user: user,
    // ... any other vars
  };
  // render username of each page
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = {
    user: user,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/show", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = {
    url: urlDatabase,
    user: user,
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const id = req.params.id;
  const longURLParam = urlDatabase[id];
  const templateVars = {
    id: id,
    longURL: longURLParam,
    user: user, // pass username from cookies to the view
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURLParam = urlDatabase[id];
  const templateVars = { id: id, longURL: longURLParam };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("The URL does not exits");
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);

  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;

  // Check if the URL resource exists
  if (urlDatabase[id]) {
    delete urlDatabase[id];
  }

  // Redirect the client back to the urls_index page
  res.redirect("/urls");
});

app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  const updatedLongURL = req.body.longURL;

  // Update the value of the stored long URL
  urlDatabase[id] = updatedLongURL;

  // Redirect the client back to /urls
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  // Access submitted username from the request body
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

function generateRandomId() {
  return crypto.randomBytes(16).toString("hex");
}

// POST /register endpoint
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

  // Create a new user and add to the users object
  const newUser = { id, email, password };
  users[id] = newUser;

  // Set user_id cookie and redirect
  res.cookie("user_id", id);
  res.redirect("/urls");

  console.log(users); // Log the users object
});

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId]; // Look up the user data using the user ID from the cookie
  const templateVars = {
    user: user, // Pass the entire user object
    // ... other variables
  };

  res.render("user_login", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
