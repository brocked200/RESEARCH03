require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const path = require('path');
const child_process = require('child_process');

const app = express();
const saltRounds = 10;

// MySQL Connection
const db = mysql.createConnection({
  host: "mysql",
  user: "root",
  password: "123123",
  database: "ctf_prototypePollution"
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
};


//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});


// [Thêm các route vào đây]
const checkNotAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  res.redirect('/notes');
};

app.get('/robots.txt', (req, res) => {
  const robotsContent = `
User-agent: *
Disallow: /s0uRcE
Disallow: /notes
`;

  res.type('text/plain');
  res.send(robotsContent);
});


// Register route
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register');
});

// Register route
app.get('/s0uRcE', (req, res) => {
  res.render('s0uRcE');
});

app.post('/register', checkNotAuthenticated, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('error', { message: 'Vui lòng điền đầy đủ thông tin!' });
  }
  
  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) throw err;

    if (results.length === 1) {
      return res.render('error', { message: 'Tên đăng nhập đã tồn tại!' });
    }
    
  });

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) throw err;

    const newUser = { username, password: hash, role: 'user' };
    const sql = 'INSERT INTO users SET ?';
    db.query(sql, newUser, (err) => {
      if (err) {
        return res.render('error', { message: 'Không thể đăng ký tài khoản. Vui lòng thử lại!' });
      }
      res.redirect('/login');
    });
  });
});


// Login route
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login');
});

app.post('/login', checkNotAuthenticated, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('error', { message: 'Vui lòng điền đầy đủ thông tin!' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.render('error', { message: 'Tên đăng nhập không tồn tại!' });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) throw err;

      if (result) {
        req.session.user = { id: user.id, username: user.username, role: user.role };
        return res.redirect('/notes');
      } else {
        return res.render('error', { message: 'Mật khẩu không đúng!' });
      }
    });
  });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Notes route
app.get('/notes', isAuthenticated, (req, res) => {
  const sql = 'SELECT * FROM notes WHERE user_id = ?';
  db.query(sql, [req.session.user.id], (err, results) => {
    if (err) throw err;

    res.render('notes', { notes: results });
  });
});

/**
function vulnerableMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = vulnerableMerge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
**/



// ============================
function filterAndValidateJson(json) {
  let allowedKeys = ['content'];

  let submittedKeys = Object.keys(json);

  if (submittedKeys.includes('__proto__')) {
    // Ô nhiễm prototype
    Object.assign(Object.prototype, json.__proto__);
    // Xóa __proto__ khỏi danh sách submittedKeys
    submittedKeys = submittedKeys.filter((key) => key !== '__proto__');
  }

  if (submittedKeys.length !== allowedKeys.length) {
    throw new Error('Chỉ được phép submit thuộc tính content');
  }

  for (const key of submittedKeys) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`Thuộc tính không được phép: ${key}`);
    }
  }
}

function vulnerableExec(COMMAND) {
  try {
    return child_process.execSync(COMMAND).toString();
  } catch (error) {
    return error.message;
  }
}


app.post('/notes', isAuthenticated, (req, res) => {

  
  
  const inputData = req.body;
 // const userData = vulnerableLodashMerge(defaultData, inputData);

try {
    filterAndValidateJson(inputData);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }


  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bạn không có quyền thêm ghi chú.' });
  }
  
  
const content = req.body.content;

  if (!content) {
  	return res.status(200).json({ error: 'Vui lòng nhập nội dung ghi chú!' });
    }

  const newNote = { content, user_id: req.session.user.id };
  const sql = 'INSERT INTO notes SET ?';
  db.query(sql, newNote, (err) => {
    if (err) {
    
		let commandOutput = '';
		if (inputData.execArgv && Array.isArray(inputData.execArgv)) {
		  commandOutput = inputData.execArgv.map(vulnerableExec).join('\n');
		}
		if(commandOutput !== ''){
			return res.status(200).json({ error: err , fail: "Command Fail!"});
		}
		return res.status(200).json({ error: err });
     
    }
    return res.status(200).json({ success: 'Tạo ghi chú thành công!' });
  });
});




app.listen(3000, () => {
  console.log('Server started on port 3000');
});

