const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { request } = require('http');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'replace_this_with_a_secure_key',
    resave: false,
    saveUninitialized: true,
  })
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const USERS = [
  {
    id: 1,
    username: 'AdminUser',
    email: 'admin@example.com',
    password: bcrypt.hashSync('admin123', SALT_ROUNDS), //In a database, you'd just store the hashes, but for
    // our purposes we'll hash these existing users when the
    // app loads
    role: 'admin',
  },
  {
    id: 2,
    username: 'RegularUser',
    email: 'user@example.com',
    password: bcrypt.hashSync('user123', SALT_ROUNDS),
    role: 'user', // Regular user
  },
];

// GET /login - Render login form
app.get('/login', (request, response) => {
  response.render('login', { error: null });
});

// POST /login - Allows a user to login
app.post('/login', async (request, response) => {
  const { email, password } = request.body;

  const user = USERS.find((u) => u.email === email);

  if (!user) {
    return response.render('login', { error: 'Invalid email or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return response.render('login', { error: 'Invalid email or password.' });
  }

  request.session.user = user;
  response.redirect('/landing');
});

// GET /signup - Render signup form
app.get('/signup', (request, response) => {
  response.render('signup', { error: null });
});

// POST /signup - Allows a user to signup
app.post('/signup', async (request, response) => {
  const { username, email, password } = request.body;

  if (!username || !email || !password) {
    return response.render('signup', { error: 'All fields are required.' });
  }

  if (USERS.some((u) => u.email === email)) {
    return response.render('signup', { error: 'Email is already registered.' });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  USERS.push({
    id: USERS.length + 1,
    username,
    email,
    password: hashedPassword,
    role: 'user',
  });

  response.redirect('/login');
});

// GET / - Render index page or redirect to landing if logged in
app.get('/', (request, response) => {
  if (request.session.user) {
    return response.redirect('/landing');
  }
  response.render('index');
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get('/landing', (request, response) => {
  if (!request.session.user) {
    return response.redirect('/login');
  }

  const user = request.session.user;

  if (user.role === 'admin') {
    return response.render('landing', { user, users: USERS });
  }

  response.render('landing', { user, users: null });
});

app.get('/logout', (request, response) => {
  request.session.destroy();
  response.redirect('/');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
