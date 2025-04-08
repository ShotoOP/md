// backend/server.js

const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');
const Razorpay = require('razorpay');
const util = require('util');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors({
    origin: 'https://md-url.onrender.com', // Your frontend URL
    credentials: true
}));

// Add security headers that allow popups
app.use((req, res, next) => {
    // Adjust security headers to avoid blocking window.close
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

app.use(express.json());

app.use(session({ 
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

const db = mysql.createConnection({
    host: 'sql12.freesqldatabase.com',
    user: 'sql12771956',
    password: 'tlh9u1jPlK',
    database: 'sql12771956'
});

// Promisify the query method
db.query = util.promisify(db.query).bind(db);

// Add promise-based transaction methods
db.beginTransaction = util.promisify(db.beginTransaction).bind(db);
db.commit = util.promisify(db.commit).bind(db);
db.rollback = util.promisify(db.rollback).bind(db);

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
    
    // Create tables if they don't exist
    const createTablesQueries = [
        `CREATE TABLE IF NOT EXISTS algo_software_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            plan_name VARCHAR(255) NOT NULL,
            plan_price DECIMAL(10, 2) NOT NULL,
            real_price DECIMAL(10, 2) NOT NULL,
            duration VARCHAR(50),
            purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS indicator_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            plan_name VARCHAR(255) NOT NULL,
            plan_price DECIMAL(10, 2) NOT NULL,
            real_price DECIMAL(10, 2) NOT NULL,
            duration VARCHAR(50),
            purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS algo_smart_investment_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            plan_name VARCHAR(255) NOT NULL,
            plan_price DECIMAL(10, 2) NOT NULL,
            real_price DECIMAL(10, 2) NOT NULL,
            duration VARCHAR(50),
            purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`
    ];
    
const alterPlanConfigTable = `
ALTER TABLE plan_configurations 
ADD COLUMN IF NOT EXISTS real_price DECIMAL(10, 2) DEFAULT NULL`;

db.query(alterPlanConfigTable, (err) => {
  if (err) {
    console.error('Error adding real_price column to plan_configurations table:', err);
  } else {
    console.log('Added real_price column to plan_configurations table');
    
    // Update existing plans to set real_price equal to base_price if it's NULL
    db.query('UPDATE plan_configurations SET real_price = base_price WHERE real_price IS NULL', (err) => {
      if (err) {
        console.error('Error updating real_price values:', err);
      } else {
        console.log('Updated real_price values for existing plans');
      }
    });
  }
});


    // Modify users table to add Firebase fields
    const alterUsersTable = `
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128),
    ADD COLUMN IF NOT EXISTS provider VARCHAR(50)`;
    
    db.query(alterUsersTable, (err) => {
        if (err) {
            console.error('Error altering users table:', err);
        } else {
            console.log('Users table updated with Firebase fields');
        }
    });

    createTablesQueries.forEach(query => {
        db.query(query, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            }
        });
    });
});

db.query(`SHOW COLUMNS FROM users LIKE 'generated_password'`, (err, results) => {
  if (err) {
    console.error('Error checking for generated_password column:', err);
    return;
  }
  
  if (results.length === 0) {
    db.query('ALTER TABLE users ADD COLUMN generated_password VARCHAR(8)', (err) => {
      if (err) {
        console.error('Error adding generated_password column:', err);
      } else {
        console.log('Added generated_password column to users table');
      }
    });
  }
});

function generateRandomPassword() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

// Add subcategory column to algo_smart_investment_plans table
const alterSmartInvestmentTable = `
ALTER TABLE algo_smart_investment_plans 
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255) DEFAULT NULL
ADD COLUMN IF NOT EXISTS first_collection_made BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS final_collection_made BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_collection_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS final_collection_date TIMESTAMP NULL`;

db.query(alterSmartInvestmentTable, (err) => {
    if (err) {
        console.error('Error adding subcategory column to algo_smart_investment_plans table:', err);
    } else {
        console.log('Added subcategory column to algo_smart_investment_plans table');
    }
});

// Ensure subcategory column exists in plan_configurations table
const alterPlanConfigTableSubcategory = `
ALTER TABLE plan_configurations 
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255) DEFAULT NULL`;

db.query(alterPlanConfigTableSubcategory, (err) => {
    if (err) {
        console.error('Error adding subcategory column to plan_configurations table:', err);
    } else {
        console.log('Verified or added subcategory column to plan_configurations table');
    }
});

// Add duration column to plan_configurations table if it doesn't exist
db.query(`SHOW COLUMNS FROM plan_configurations LIKE 'duration'`, (err, results) => {
  if (err) {
    console.error('Error checking for duration column:', err);
    return;
  }
  
  if (results.length === 0) {
    db.query(
      'ALTER TABLE plan_configurations ADD COLUMN duration VARCHAR(20) DEFAULT "18 Months"',
      (err) => {
        if (err) {
          console.error('Error adding duration column:', err);
        } else {
          console.log('Added duration column to plan_configurations table');
        }
      }
    );
  } 
}); 

// Update duration column default to accommodate shorter durations
db.query(`SHOW COLUMNS FROM plan_configurations LIKE 'duration'`, (err, results) => {
  if (err) {
    console.error('Error checking for duration column:', err);
    return;
  }
  
  if (results.length === 0) {
    db.query(
      'ALTER TABLE plan_configurations ADD COLUMN duration VARCHAR(20) DEFAULT "1 Month"',
      (err) => {
        if (err) {
          console.error('Error adding duration column:', err);
        } else {
          console.log('Added duration column to plan_configurations');
        }
      }
    );
  }
});
 
// Middleware to check if user is authenticated 
const isAuthenticated = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
  
      const token = authHeader.split(' ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
  
        // Get user from database 
        const userQuery = new Promise((resolve, reject) => {
          db.query('SELECT * FROM users WHERE firebase_uid = ?', [decodedToken.uid], (err, results) => {
            if (err) {
              reject(err);
            } else if (results.length === 0) {
              reject(new Error('User not found in database'));
            } else {
              resolve(results[0]);
            }
          });
        });
   
        try {
          const dbUser = await userQuery;
          req.user = { ...decodedToken, dbId: dbUser.id };
          req.dbUser = dbUser;
          
          // Set session user for compatibility with existing routes
          if (!req.session) {
            req.session = {};
          }
          req.session.user = {
            id: dbUser.id,
            firebase_uid: dbUser.firebase_uid,
            email: dbUser.email,
            username: dbUser.username
          };
          
          next();
        } catch (dbError) {
          console.error('Database error:', dbError);
          return res.status(404).json({ error: 'User not found in database' });
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        if (error.code === 'auth/id-token-expired') {
          return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        throw error;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ 
        error: 'Authentication failed',
        code: error.message.includes('expired') ? 'TOKEN_EXPIRED' : 'AUTH_ERROR'
      });
    }
  };
  
// Firebase authentication endpoint
app.post('/firebase-auth', async (req, res) => {
  const { uid, email, displayName, emailVerified, provider } = req.body;
  
  try { 
    // First verify the Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user exists in database
    try {
      const results = await db.query('SELECT * FROM users WHERE firebase_uid = ? OR email = ?', [uid, email]);
      
      if (results.length === 0) {
        // For new users, generate random password and create user
        const randomPassword = generateRandomPassword();
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(randomPassword, salt, 1000, 64, 'sha512').toString('hex');
        const passwordHash = `${salt}:${hash}`;

        // Insert new user
        await db.query(
          'INSERT INTO users (username, email, firebase_uid, email_verified, provider, password_hash, generated_password) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [displayName || email.split('@')[0], email, uid, emailVerified, provider || 'firebase', passwordHash, randomPassword]
        );

        return res.json({
          id: uid,
          email,
          displayName: displayName || email.split('@')[0],
          provider: provider || 'firebase',
          generated_password: randomPassword,
          email_verified: emailVerified
        });
      }

      // Return existing user data
      const user = results[0];
      res.json({
        id: uid,
        email: user.email,
        displayName: user.username,
        provider: user.provider,
        generated_password: user.generated_password,
        email_verified: user.email_verified
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Database operation failed: ' + dbError.message);
    }

  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ 
      error: err.message || 'Authentication failed',
      details: err.stack
    });
  }
}); 

// Get user plans
app.get('/user-plans/:userId', isAuthenticated, (req, res) => {
    const userId = req.params.userId;
    
    // Query all three plan tables
    const queries = [
        `SELECT *, 'Algo Software' as plan_type FROM algo_software_plans WHERE user_id = ?`,
        `SELECT *, 'Indicator Plan' as plan_type FROM indicator_plans WHERE user_id = ?`,
        `SELECT *, 'Algo Smart Investment' as plan_type FROM algo_smart_investment_plans WHERE user_id = ?`
    ];
    
    const allPlans = [];
    let completedQueries = 0;
    
    queries.forEach(query => {
        db.query(query, [userId], (err, results) => {
            completedQueries++;
            
            if (err) {
                console.error('Error fetching plans:', err);
            } else {
                allPlans.push(...results);
            }
            
            // When all queries are complete, send the response
            if (completedQueries === queries.length) {
                res.json(allPlans);
            }
        });
    });
});


// *****Admin****
const createAdminTable = `
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createAdminTable, (err) => {
    if (err) {
        console.error('Error creating admin table:', err);
    } else {
        console.log('Admin table created or already exists');
        
        // Check if there are any admins, if not create a default one
        db.query('SELECT COUNT(*) as count FROM admins', (err, results) => {
            if (err) {
                console.error('Error checking admin count:', err);
                return;
            }
            
            if (results[0].count === 0) {
                // Create a default admin (change these credentials in production!)
                const defaultUsername = 'admin';
                const defaultPassword = 'admin123'; // Change this!
                const defaultEmail = 'admin@example.com'; // Change this!
                
                // Hash the password
                const salt = crypto.randomBytes(16).toString('hex');
                const hash = crypto.pbkdf2Sync(defaultPassword, salt, 1000, 64, 'sha512').toString('hex');
                const passwordHash = `${salt}:${hash}`;
                
                db.query(
                    'INSERT INTO admins (username, password_hash, email) VALUES (?, ?, ?)',
                    [defaultUsername, passwordHash, defaultEmail],
                    (err) => {
                        if (err) {
                            console.error('Error creating default admin:', err);
                        } else {
                            console.log('Default admin account created');
                        }
                    }
                );
            }
        });
    }
});

// Admin authentication middleware
const isAdmin = (req, res, next) => {
  if (req.session?.admin) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Admin access required' });
  }
};

// Admin login endpoint
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.query('SELECT * FROM admins WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('Error during admin login:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = results[0];
    
    // Add validation for password_hash
    if (!admin.password_hash || !admin.password_hash.includes(':')) {
      console.error('Invalid password hash format for admin:', admin.username);
      return res.status(500).json({ error: 'Invalid account configuration' });
    }

    const [salt, storedHash] = admin.password_hash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    if (hash === storedHash) {
      // Create admin session
      req.session.admin = {
        id: admin.id,
        username: admin.username, 
        email: admin.email
      };

      return res.json({
        status: 'Admin login successful',
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Admin logout endpoint
app.post('/admin/logout', (req, res) => {
  if (req.session?.admin) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Failed to log out' });
      }
      res.json({ status: 'Admin logout successful' });
    });
  } else {
    res.status(400).json({ error: 'Not logged in as admin' });
  }
});

// Admin password change endpoint
app.post('/admin/change-password', isAdmin, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.session.admin.id;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    db.query('SELECT * FROM admins WHERE id = ?', [adminId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        const admin = results[0];
        const [salt, storedHash] = admin.password_hash.split(':');
        const hash = crypto.pbkdf2Sync(currentPassword, salt, 1000, 64, 'sha512').toString('hex');
        
        if (hash !== storedHash) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Hash the new password
        const newSalt = crypto.randomBytes(16).toString('hex');
        const newHash = crypto.pbkdf2Sync(newPassword, newSalt, 1000, 64, 'sha512').toString('hex');
        const newPasswordHash = `${newSalt}:${newHash}`;
        
        db.query('UPDATE admins SET password_hash = ? WHERE id = ?', [newPasswordHash, adminId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update password' });
            }
            
            res.json({ status: 'Password updated successfully' });
        });
    });
});

// Add admin management endpoint (only accessible by existing admins)
app.post('/admin/add-admin', isAdmin, (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check total number of admins
    db.query('SELECT COUNT(*) as count FROM admins', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results[0].count >= 2) {
            return res.status(400).json({ error: 'Maximum number of admins (2) already reached' });
        }
        
        // Hash the password
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        const passwordHash = `${salt}:${hash}`;
        
        db.query(
            'INSERT INTO admins (username, password_hash, email) VALUES (?, ?, ?)',
            [username, passwordHash, email],
            (err) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: 'Failed to create admin account' });
                }
                
                res.status(201).json({ status: 'Admin account created successfully' });
            }
        );
    });
});

// Update the add plan endpoint
app.post('/admin/plans', isAdmin, (req, res) => {
    const { plan_type, plan_name, base_price, real_price, features, subcategory, duration } = req.body;

    if (!plan_type || !plan_name || base_price === undefined) {
        return res.status(400).json({ error: 'Plan type, name, and base price are required' });
    }

    // Ensure base_price is a non-negative number
    const normalizedBasePrice = Math.max(0, Number(base_price));
    const normalizedRealPrice = real_price ? Math.max(0, Number(real_price)) : normalizedBasePrice;

    const sql = 'INSERT INTO plan_configurations (plan_type, plan_name, base_price, real_price, features, subcategory, duration) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [
        plan_type,
        plan_name,
        normalizedBasePrice,
        normalizedRealPrice,
        JSON.stringify(features || {}),
        plan_type === 'enterprise' ? subcategory : null,
        duration || "18 Months"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error adding plan:', err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        res.status(201).json({
            status: 'Plan added successfully',
            id: result.insertId
        });
    });
});

// Get all users
app.get('/admin/users', isAdmin, (req, res) => {
    db.query('SELECT id, username, email, email_verified, firebase_uid, provider, created_at FROM users ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get user count statistics
app.get('/admin/stats', isAdmin, (req, res) => {
    const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        newUsers: 'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
        totalPlans: `
            SELECT 
                (SELECT COUNT(*) FROM algo_software_plans) +
                (SELECT COUNT(*) FROM indicator_plans) +
                (SELECT COUNT(*) FROM algo_smart_investment_plans) as count
        `,
        planTypes: `
            SELECT 
                'Algo Software' as plan_type, COUNT(*) as count FROM algo_software_plans
            UNION
            SELECT 
                'Indicator Plan' as plan_type, COUNT(*) as count FROM indicator_plans
            UNION
            SELECT 
                'Algo Smart Investment' as plan_type, COUNT(*) as count FROM algo_smart_investment_plans
        `
    };
    
    const stats = {};
    let completedQueries = 0;
    const totalQueries = Object.keys(queries).length;
    
    Object.entries(queries).forEach(([key, query]) => {
        db.query(query, (err, results) => {
            completedQueries++;
            
            if (err) {
                console.error(`Error fetching ${key}:`, err);
                stats[key] = 'Error';
            } else {
                if (key === 'planTypes') {
                    stats[key] = results;
                } else {
                    stats[key] = results[0].count;
                }
            }
            
            if (completedQueries === totalQueries) {
                res.json(stats);
            }
        });
    });
});


// Get recent plan purchases
app.get('/admin/recent-purchases', isAdmin, (req, res) => {
    const limit = req.query.limit || 10;
    
    const queries = [
        `SELECT p.*, u.username, u.email, 'Algo Software' as plan_type 
         FROM algo_software_plans p 
         JOIN users u ON p.user_id = u.id 
         ORDER BY p.purchase_date DESC 
         LIMIT ${limit}`,
        
        `SELECT p.*, u.username, u.email, 'Indicator Plan' as plan_type 
         FROM indicator_plans p 
         JOIN users u ON p.user_id = u.id 
         ORDER BY p.purchase_date DESC 
         LIMIT ${limit}`,
        
        `SELECT p.*, u.username, u.email, 'Algo Smart Investment' as plan_type 
         FROM algo_smart_investment_plans p 
         JOIN users u ON p.user_id = u.id 
         ORDER BY p.purchase_date DESC 
         LIMIT ${limit}`
    ];
    
    const allPurchases = [];
    let completedQueries = 0;
    
    queries.forEach(query => {
        db.query(query, (err, results) => {
            completedQueries++;
            
            if (err) {
                console.error('Error fetching recent purchases:', err);
            } else {
                allPurchases.push(...results);
            }
            
            if (completedQueries === queries.length) {
                // Sort all purchases by date
                allPurchases.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
                res.json(allPurchases.slice(0, limit));
            }
        });
    });
});

// Add a new plan configuration
app.post('/admin/plans', isAdmin, (req, res) => {
    const { plan_type, plan_name, base_price, real_price, features, subcategory } = req.body;
    
    if (!plan_type || !plan_name || !base_price) {
        return res.status(400).json({ error: 'Plan type, name, and base price are required' });
    }

    // Validate subcategory for enterprise plans
    if (plan_type === 'enterprise' && !subcategory) {
        return res.status(400).json({ error: 'Subcategory is required for Smart Investment plans' });
    }

    // Only include subcategory for enterprise plans
    const planSubcategory = plan_type === 'enterprise' ? subcategory : null;
    
    const sql = 'INSERT INTO plan_configurations (plan_type, plan_name, base_price, real_price, features, subcategory) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [
        plan_type,
        plan_name,
        base_price,
        real_price || base_price,
        JSON.stringify(features || {}),
        planSubcategory
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error adding plan:', err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        
        res.status(201).json({
            status: 'Plan added successfully',
            id: result.insertId
        });
    });
});

// Update the edit plan endpoint
app.put('/admin/plans/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const { plan_name, base_price, real_price, features, duration } = req.body;
    
    if (!plan_name || base_price === undefined) {
        return res.status(400).json({ error: 'Plan name and base price are required' });
    }
    
    // Ensure base_price is a non-negative number
    const normalizedBasePrice = Math.max(0, Number(base_price));
    const normalizedRealPrice = real_price ? Math.max(0, Number(real_price)) : normalizedBasePrice;
    
    const sql = 'UPDATE plan_configurations SET plan_name = ?, base_price = ?, real_price = ?, features = ?, duration = ? WHERE id = ?';
    const values = [
        plan_name,
        normalizedBasePrice,
        normalizedRealPrice,
        JSON.stringify(features || {}),
        duration || "18 Months",
        id
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating plan:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        
        res.json({ status: 'Plan updated successfully' });
    });
});

// Delete a plan configuration
app.delete('/admin/plans/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM plan_configurations WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting plan:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        
        res.json({ status: 'Plan deleted successfully' });
    });
});

// Create plan_configurations table if it doesn't exist
const createPlanConfigTable = `
CREATE TABLE IF NOT EXISTS plan_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_type VARCHAR(50) NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    real_price DECIMAL(10, 2),
    features JSON,
    subcategory VARCHAR(255),
    duration VARCHAR(20) DEFAULT '3 Months',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

db.query(createPlanConfigTable, (err) => {
    if (err) {
        console.error('Error creating plan configuration table:', err);
    } else {
        console.log('Plan configuration table created or already exists');
    }
});

// Add created_at column to users table if it doesn't exist
db.query(`SHOW COLUMNS FROM users LIKE 'created_at'`, (err, results) => {
    if (err) {
        console.error('Error checking for created_at column:', err);
        return;
    }
    
    if (results.length === 0) {
        db.query(`ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, (err) => {
            if (err) {
                console.error('Error adding created_at column to users table:', err);
            } else {
                console.log('Added created_at column to users table');
            }
        });
    }
});


// KEEP only this route (around line 430)
app.get('/api/plan-configurations', (req, res) => {
    db.query('SELECT * FROM plan_configurations ORDER BY last_updated DESC', (err, results) => {
      if (err) {
        console.error('Error fetching plan configurations:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Parse the features JSON for each plan
      const plans = results.map(plan => {
        try {
          plan.features = JSON.parse(plan.features);
        } catch (e) {
          plan.features = {};
        }
        return plan;
      });
      
      res.json(plans);
    });
});
  
  // Add this to your server.js after creating the plan_configurations table
  const checkAndAddInitialPlans = () => {
    db.query('SELECT COUNT(*) as count FROM plan_configurations', (err, results) => {
      if (err) {
        console.error('Error checking plan configurations:', err);
        return;
      }
      
      if (results[0].count === 0) {
        // Add some initial plans
        const initialPlans = [
          {
            plan_type: 'basic',
            plan_name: 'Basic Algo Software',
            base_price: 10.00,
            real_price: 8.50, // Actual cost to you
            duration: '3 Months',
            features: JSON.stringify({
              users: '1 user',
              storage: '10 GB',
              support: 'Email support',
              encryption: 'AES-256',
              backup: 'Daily',
              apiAccess: 'No',
              languageSupport: 'English',
              dedicatedManager: 'No'
            })
          },
          {
            plan_type: 'premium',
            plan_name: 'Premium Indicator Plan',
            base_price: 20.00,
            real_price: 15.00, // Actual cost to you
            duration: '3 Months',
            features: JSON.stringify({
              users: '5 users',
              storage: '50 GB',
              support: 'Priority email support',
              encryption: 'AES-256',
              backup: 'Hourly',
              apiAccess: 'Yes',
              languageSupport: 'Multiple',
              dedicatedManager: 'Yes'
            })
          },
          {
            plan_type: 'enterprise',
            plan_name: 'Enterprise Smart Investment',
            base_price: 50.00,
            real_price: 35.00, // Actual cost to you
            duration: '3 Months',
            features: JSON.stringify({
              users: 'Unlimited users',
              storage: '1 TB',
              support: '24/7 support',
              encryption: 'AES-256',
              backup: 'Real-time',
              apiAccess: 'Yes',
              languageSupport: 'Multiple',
              dedicatedManager: 'Yes'
            })
          }
        ];
        
        initialPlans.forEach(plan => {
          db.query(
            'INSERT INTO plan_configurations (plan_type, plan_name, base_price, real_price, features) VALUES (?, ?, ?, ?, ?)',
            [plan.plan_type, plan.plan_name, plan.base_price, plan.real_price, plan.features],
            (err) => {
              if (err) {
                console.error('Error adding initial plan:', err);
              }
            }
          );
        });
        
        console.log('Added initial plan configurations');
      }
    });
  };  
  
  // Call this function after creating the table
  checkAndAddInitialPlans();  

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: 'rzp_test_1wYATSAIoY3jNF',     // Replace with your actual test key ID
    key_secret: 'rgdgPIRYPildixnGeGHeEnjG'       // Replace with your actual test key secret
});

// Create order endpoint
app.post('/create-order', isAuthenticated, async (req, res) => {
  try {
    const { amount } = req.body; // Amount should already be in paise from frontend
    const userId = req.dbUser.id;

    // Amount validation
    if (!amount || amount < 100) { // Minimum amount should be 1 rupee (100 paise)
      throw new Error('Invalid amount');
    }

    const options = {
      amount: amount, // Amount is already in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount, // Amount in paise
      currency: order.currency
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment endpoint
app.post('/verify-payment', isAuthenticated, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planDetails, durationPromoCode } = req.body;
  const userId = req.dbUser.id;

  try {
    await db.beginTransaction();

    // Verify Razorpay signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', razorpay.key_secret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // Fetch the duration promo code details if provided
    let reducedDuration = planDetails.duration;
    if (durationPromoCode) {
      const [promo] = await db.query(
        'SELECT * FROM duration_promo_codes WHERE code = ?',
        [durationPromoCode]
      );

      if (!promo) {
        throw new Error('Invalid duration promo code');
      }

      // Validate promo code dates
      const now = new Date();
      const validFrom = new Date(promo.valid_from);
      const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

      if (now < validFrom || (validUntil && now > validUntil)) {
        throw new Error('Promo code is not valid at this time');
      }

      // Calculate the reduced duration
      const originalDays = convertDurationToDays(planDetails.duration);
      const reducedDays = Math.max(1, originalDays - promo.reduction_days); // Ensure at least 1 day
      reducedDuration = convertDaysToDuration(reducedDays);
    }

    // Determine the table to insert the plan
    let tableName;
    switch (planDetails.planType) {
      case 'Algo Software':
        tableName = 'algo_software_plans';
        break;
      case 'Indicator Plan':
        tableName = 'indicator_plans';
        break;
      case 'Algo Smart Investment':
        tableName = 'algo_smart_investment_plans';
        break;
      default:
        throw new Error('Invalid plan type');
    }

    // Insert the plan with the reduced duration
    const sql = `
      INSERT INTO ${tableName} 
      (user_id, plan_name, plan_price, real_price, duration, payment_id, order_id${planDetails.planType === 'Algo Smart Investment' ? ', subcategory' : ''}) 
      VALUES (?, ?, ?, ?, ?, ?, ?${planDetails.planType === 'Algo Smart Investment' ? ', ?' : ''})
    `;
    const values = [
      userId,
      planDetails.planName,
      planDetails.planPrice,
      planDetails.originalPrice || planDetails.planPrice,
      reducedDuration,
      razorpay_payment_id,
      razorpay_order_id,
      ...(planDetails.planType === 'Algo Smart Investment' ? [planDetails.subcategory] : [])
    ];

    await db.query(sql, values);
    await db.commit();

    res.json({
      status: 'success',
      message: 'Payment verified and plan activated',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      reducedDuration
    });
  } catch (error) {
    await db.rollback();
    console.error('Payment verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Helper functions for duration calculations
function convertDurationToDays(duration) {
  const match = duration.match(/(\d+)\s+(Day|Days|Month|Months|Year|Years)/i);
  if (!match) return 0;

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.includes('day')) return amount;
  if (unit.includes('month')) return amount * 30;
  if (unit.includes('year')) return amount * 365;
  return 0;
}

function convertDaysToDuration(days) {
  if (days >= 365 && days % 365 === 0) {
    const years = days / 365;
    return `${years} ${years === 1 ? 'Year' : 'Years'}`;
  }
  if (days >= 30 && days % 30 === 0) {
    const months = days / 30;
    return `${months} ${months === 1 ? 'Month' : 'Months'}`;
  }
  return `${days} ${days === 1 ? 'Day' : 'Days'}`;
}

// Add payment fields to plan tables
const alterPlanTablesForPayment = [
  `ALTER TABLE algo_software_plans 
   ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
   ADD COLUMN IF NOT EXISTS order_id VARCHAR(255)`,
   
  `ALTER TABLE indicator_plans 
   ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
   ADD COLUMN IF NOT EXISTS order_id VARCHAR(255)`,
   
  `ALTER TABLE algo_smart_investment_plans 
   ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
   ADD COLUMN IF NOT EXISTS order_id VARCHAR(255)`
]; 

alterPlanTablesForPayment.forEach(query => {
  db.query(query, (err) => {
    if (err) console.error('Error adding payment fields:', err);
  });
});

// Create order endpoint
app.post('/create-order', isAuthenticated, async (req, res) => {
  try {
    const { amount, planType, planName } = req.body;
    const userId = req.dbUser.id;

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment endpoint
app.post('/verify-payment', isAuthenticated, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planDetails } = req.body;
  const userId = req.dbUser.id;

  try {
    await db.beginTransaction();

    // Generate signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', razorpay.key_secret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('Signature mismatch:', {
        generated: generated_signature,
        received: razorpay_signature
      });
      throw new Error('Invalid payment signature');
    }

    // Verify payment with Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== 'captured') {
      throw new Error('Payment not captured');
    }

    // Determine which table to use
    let tableName;
    switch (planType) {
      case 'Algo Software':
        tableName = 'algo_software_plans';
        break;
      case 'Indicator Plan':
        tableName = 'indicator_plans';
        break;
      case 'Algo Smart Investment':
        tableName = 'algo_smart_investment_plans';
        break;
      default:
        throw new Error('Invalid plan type');
    }

    // Insert plan with payment details
    const sql = `INSERT INTO ${tableName} 
      (user_id, plan_name, plan_price, real_price, duration, payment_id, order_id${planType === 'Algo Smart Investment' ? ', subcategory' : ''}) 
      VALUES (?, ?, ?, ?, ?, ?, ?${planType === 'Algo Smart Investment' ? ', ?' : ''})`;

    const values = [
      userId,
      planDetails.planName,
      planDetails.planPrice,
      planDetails.realPrice || planDetails.planPrice,
      planDetails.duration,
      razorpay_payment_id,
      razorpay_order_id,
      ...(planType === 'Algo Smart Investment' ? [planDetails.subcategory] : [])
    ];

    await db.query(sql, values);
    await db.commit();

    res.json({ 
      status: 'success',
      message: 'Payment verified and plan activated',
      orderId: razorpay_order_id,
      razorpay_payment_id
    });

  } catch (error) {
    await db.rollback();
    console.error('Payment verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create promo code table
const createPromoCodeTable = `
CREATE TABLE IF NOT EXISTS promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    discount_percentage INT NOT NULL,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    applies_to_algo_software BOOLEAN DEFAULT FALSE,
    applies_to_indicators BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applicable_plan_ids JSON
)`;

db.query(createPromoCodeTable, (err) => {
    if (err) {
        console.error('Error creating promo code table:', err);
    } else {
        console.log('Promo code table created or already exists');
    }
});
const alterPromoCodesTable = `
ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS applies_to_algo_software BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS applies_to_indicators BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS applicable_plan_ids JSON`;

db.query(alterPromoCodesTable, (err) => {
  if (err) {
    console.error('Error adding columns to promo_codes table:', err);
  } else {
    console.log('Added missing columns to promo_codes table');
  }
});
// Create a new promo code
app.post('/admin/promo-codes', isAdmin, (req, res) => {
    const { 
        code, 
        discount_percentage, 
        valid_from, 
        valid_until, 
        applies_to_algo_software, 
        applies_to_indicators,
        applicable_plan_ids 
    } = req.body;
    
    if (!code || !discount_percentage || !valid_from) {
        return res.status(400).json({ error: 'Code, discount percentage, and valid from date are required' });
    }
    
    // Check if the table has the new columns
    db.query(`SHOW COLUMNS FROM promo_codes LIKE 'applies_to_algo_software'`, (err, results) => {
        if (err) {
            console.error('Error checking promo_codes table structure:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            // Old table structure without the new columns
            const sql = `INSERT INTO promo_codes 
                        (code, discount_percentage, valid_from, valid_until) 
                        VALUES (?, ?, ?, ?)`;
            
            const values = [
                code,
                discount_percentage,
                valid_from,
                valid_until || null
            ];
            
            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Error creating promo code:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Promo code already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                
                res.status(201).json({ 
                    status: 'Promo code created successfully',
                    id: result.insertId
                });
            });
        } else {
            // New table structure with the new columns
            const sql = `INSERT INTO promo_codes 
                        (code, discount_percentage, valid_from, valid_until, applies_to_algo_software, applies_to_indicators, applicable_plan_ids) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            const values = [
                code,
                discount_percentage,
                valid_from,
                valid_until || null,
                applies_to_algo_software ? 1 : 0,
                applies_to_indicators ? 1 : 0,
                JSON.stringify(applicable_plan_ids || [])
            ];
            
            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Error creating promo code:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Promo code already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                
                res.status(201).json({ 
                    status: 'Promo code created successfully',
                    id: result.insertId
                });
            });
        }
    });
});

// Get all promo codes
app.get('/admin/promo-codes', isAdmin, (req, res) => {
    db.query('SELECT * FROM promo_codes ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Error fetching promo codes:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Parse the applicable_plan_ids JSON for each promo code
        const promoCodes = results.map(code => {
            try {
                code.applicable_plan_ids = JSON.parse(code.applicable_plan_ids);
            } catch (e) {
                code.applicable_plan_ids = [];
            }
            return code;
        });
        
        res.json(promoCodes);
    });
});

// Update promo code endpoint
app.put('/admin/promo-codes/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const {
        code,
        discount_percentage,
        valid_from,
        valid_until,
        is_active,
        applies_to_algo_software,
        applies_to_indicators,
        applicable_plan_ids
    } = req.body;

    const sql = `UPDATE promo_codes 
                SET code = ?, 
                    discount_percentage = ?, 
                    valid_from = ?, 
                    valid_until = ?, 
                    is_active = ?,
                    applies_to_algo_software = ?,
                    applies_to_indicators = ?,
                    applicable_plan_ids = ?
                WHERE id = ?`;

    const values = [
        code,
        discount_percentage,
        valid_from,
        valid_until || null,
        is_active !== undefined ? is_active : 1,
        applies_to_algo_software ? 1 : 0,
        applies_to_indicators ? 1 : 0,
        JSON.stringify(applicable_plan_ids || []),
        id
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating promo code:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Promo code already exists' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promo code not found' });
        }
        
        res.json({ status: 'Promo code updated successfully' });
    });
});

// Delete a promo code
app.delete('/admin/promo-codes/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM promo_codes WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting promo code:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promo code not found' });
        }
        
        res.json({ status: 'Promo code deleted successfully' });
    });
});

// Validate a promo code
app.post('/validate-promo-code', (req, res) => {
    const { code, planType, planId } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'Promo code is required' });
    }
    
    // First, get the promo code from the database
    db.query('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1', [code], (err, results) => {
        if (err) {
            console.error('Error validating promo code:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired promo code' });
        }
        
        const promoCode = results[0];
        
        // Debug logging
        console.log('Promo code validation:', {
            code,
            valid_from: promoCode.valid_from,
            valid_until: promoCode.valid_until,
            current_date: new Date(),
            is_active: promoCode.is_active
        });
        
        // Fix date comparison by converting both to JavaScript Date objects
        const validFromDate = new Date(promoCode.valid_from);
        const currentDate = new Date();
        
        // Check if the promo code is valid based on dates
        if (validFromDate > currentDate) {
            return res.status(400).json({ error: 'Promo code is not yet active' });
        }
        
        if (promoCode.valid_until && new Date(promoCode.valid_until) < currentDate) {
            return res.status(400).json({ error: 'Promo code has expired' });
        }
        
        // Check if the promo code applies to the plan type
        let isApplicable = false;
        
        // Convert applicable_plan_ids from JSON string to array if it exists
        let applicablePlanIds = [];
        try {
            if (promoCode.applicable_plan_ids) {
                applicablePlanIds = JSON.parse(promoCode.applicable_plan_ids);
            }
        } catch (e) {
            console.error('Error parsing applicable_plan_ids:', e);
            applicablePlanIds = [];
        }
        
        // Check if the promo code applies to the plan type
        if (planType === 'Algo Software' && promoCode.applies_to_algo_software) {
            isApplicable = true;
        } else if (planType === 'Indicator Plan' && promoCode.applies_to_indicators) {
            isApplicable = true;
        } else if (planType === 'Algo Smart Investment') {
            // For enterprise plans, we'll allow any promo code
            isApplicable = true;
        }
        
        // If specific plan IDs are set, check if the current plan is included
        if (isApplicable && applicablePlanIds && applicablePlanIds.length > 0) {
            isApplicable = applicablePlanIds.includes(parseInt(planId));
        }
        
        if (!isApplicable) {
            return res.status(400).json({ error: 'Promo code not applicable to this plan' });
        }
        
        // Return the valid promo code with discount percentage
        res.json({
            status: 'Valid promo code',
            discount_percentage: promoCode.discount_percentage
        });
    });
});

// User dashboard endpoints

// Get user stats
app.get('/api/user/stats', isAuthenticated, (req, res) => {
  const userId = req.dbUser?.id;

  if (!userId) {
    return res.status(400).json({ error: 'User ID not found' });
  }

  const query = `
    SELECT 
      u.id, 
      u.username, 
      u.email,
      u.created_at,
      COUNT(DISTINCT asp.id) + COUNT(DISTINCT ip.id) + COUNT(DISTINCT asip.id) as total_plans
    FROM 
      users u
    LEFT JOIN 
      algo_software_plans asp ON u.id = asp.user_id
    LEFT JOIN 
      indicator_plans ip ON u.id = ip.user_id
    LEFT JOIN 
      algo_smart_investment_plans asip ON u.id = asip.user_id
    WHERE 
      u.id = ?
    GROUP BY 
      u.id
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch user stats' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(results[0]);
  });
});
  
// Get user plans
app.get('/api/user/plans', isAuthenticated, (req, res) => {
    // Use req.dbUser.id as the primary source of user ID
    const userId = req.dbUser.id;

    console.log(`Fetching plans for user ID: ${userId}`);
    const queries = [
        `SELECT p.*, 'Algo Software' as plan_type, pc.base_price as upgrade_base_price,
        CASE 
          WHEN p.is_upgraded = 1 THEN 'Upgraded'
          WHEN p.upgraded_to IS NOT NULL THEN 'Expired (Upgraded)'
          ELSE 'Active'
        END as status
        FROM algo_software_plans p
        LEFT JOIN plan_configurations pc ON p.upgraded_to = pc.id
        WHERE p.user_id = ?`,
      
        `SELECT p.*, 'Indicator Plan' as plan_type, pc.base_price as upgrade_base_price,
        CASE 
          WHEN p.is_upgraded = 1 THEN 'Upgraded'
          WHEN p.upgraded_to IS NOT NULL THEN 'Expired (Upgraded)'
          ELSE 'Active'
        END as status
        FROM indicator_plans p
        LEFT JOIN plan_configurations pc ON p.upgraded_to = pc.id
        WHERE p.user_id = ?`,
      
        `SELECT *, 'Algo Smart Investment' as plan_type, 'Active' as status 
        FROM algo_smart_investment_plans 
        WHERE user_id = ?`
    ];

    const allPlans = [];
    let completedQueries = 0;

    queries.forEach(query => {
        db.query(query, [userId], (err, results) => {
            completedQueries++;

            if (err) {
                console.error('Error fetching plans:', err);
            } else {
                console.log(`Fetched ${results.length} plans from query:`, query);
                allPlans.push(...results);
            }
 
            if (completedQueries === queries.length) {
                res.json(allPlans);
            }
        });
    });
});


// Get user invoices (billing history)
app.get('/api/user/invoices', isAuthenticated, (req, res) => {
    // Use req.dbUser.id as the primary source of user ID
    const userId = req.dbUser.id;
    
    // For now, we'll create mock invoices based on the user's plans
    // In a real application, you would have a separate invoices table
    const query = `
        SELECT 
            p.id,
            p.plan_name,
            p.plan_price as amount,
            p.purchase_date as date,
            'paid' as status,
            p.plan_type
        FROM (
            SELECT id, plan_name, plan_price, purchase_date, 'Algo Software' as plan_type FROM algo_software_plans WHERE user_id = ?
            UNION ALL
            SELECT id, plan_name, plan_price, purchase_date, 'Indicator Plan' as plan_type FROM indicator_plans WHERE user_id = ?
            UNION ALL
            SELECT id, plan_name, plan_price, purchase_date, 'Algo Smart Investment' as plan_type FROM algo_smart_investment_plans WHERE user_id = ?
        ) p
        ORDER BY p.purchase_date DESC
    `;
    
    db.query(query, [userId, userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching invoices:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json(results);
    });
});
 

// Get user support tickets
app.get('/api/user/support-tickets', isAuthenticated, (req, res) => {
    // Use req.dbUser.id as the primary source of user ID
    const userId = req.dbUser.id;
    
    // Since we don't have a support_tickets table yet, return an empty array
    // In a real application, you would query the support_tickets table
    res.json([]);
});


// Create support ticket
app.post('/api/user/support-tickets', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const { subject, message, priority } = req.body;
    
    // In a real application, you would insert into a support_tickets table
    // For now, just return success
    res.status(201).json({ status: 'Support ticket created successfully' });
});

// Upgrade plan
app.post('/api/user/upgrade-plan', isAuthenticated, (req, res) => {
    // Use req.dbUser.id as the primary source of user ID
    const userId = req.dbUser.id;
    const { planId } = req.body;
    
    // In a real application, you would update the user's plan
    // For now, just return success
    res.json({ status: 'Plan upgraded successfully' });
});


// Download invoice
app.get('/api/user/invoices/:invoiceId/download', isAuthenticated, (req, res) => {
    // Use req.dbUser.id as the primary source of user ID
    const userId = req.dbUser.id;
    const invoiceId = req.params.invoiceId;
    
    // In a real application, you would generate a PDF invoice
    // For now, just return a simple text response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.txt`);
    res.send(`Invoice #${invoiceId} for user ${userId}`);
});


// Add these endpoints to your server.js file

// Create referral_earnings table if it doesn't exist
const createReferralEarningsTable = `
CREATE TABLE IF NOT EXISTS referral_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_id INT NOT NULL,
    referred_id INT NOT NULL,
    plan_id INT NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    plan_price DECIMAL(10, 2) NOT NULL,
    earnings DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id),
    FOREIGN KEY (referred_id) REFERENCES users(id)
)`;

db.query(createReferralEarningsTable, (err) => {
    if (err) {
        console.error('Error creating referral_earnings table:', err);
    } else {
        console.log('Referral earnings table created or already exists');
    }
});

// Add referral_code column to users table if it doesn't exist
db.query(`SHOW COLUMNS FROM users LIKE 'referral_code'`, (err, results) => {
    if (err) {
        console.error('Error checking for referral_code column:', err);
        return;
    }
    
    if (results.length === 0) {
        db.query(`ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE`, (err) => {
            if (err) {
                console.error('Error adding referral_code column to users table:', err);
            } else {
                console.log('Added referral_code column to users table');
                
                // Generate referral codes for existing users
                db.query('SELECT id FROM users WHERE referral_code IS NULL', (err, users) => {
                    if (err) {
                        console.error('Error fetching users without referral codes:', err);
                        return;
                    }
                    
                    users.forEach(user => {
                        const referralCode = `REF${user.id}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                        db.query('UPDATE users SET referral_code = ? WHERE id = ?', [referralCode, user.id], (err) => {
                            if (err) {
                                console.error(`Error setting referral code for user ${user.id}:`, err);
                            }
                        });
                    });
                });
            }
        });
    }
});

// Add referrer_id column to users table if it doesn't exist
db.query(`SHOW COLUMNS FROM users LIKE 'referrer_id'`, (err, results) => {
    if (err) {
        console.error('Error checking for referrer_id column:', err);
        return;
    }
    
    if (results.length === 0) {
        db.query(`ALTER TABLE users ADD COLUMN referrer_id INT, ADD FOREIGN KEY (referrer_id) REFERENCES users(id)`, (err) => {
            if (err) {
                console.error('Error adding referrer_id column to users table:', err);
            } else {
                console.log('Added referrer_id column to users table');
            }
        });
    }
});

// Get user referral data
app.get('/api/user/referrals', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    
    // Get user's referral code
    db.query('SELECT referral_code FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error fetching referral code:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const referralCode = results[0].referral_code;
        
        // Get referral earnings history
        db.query(`
            SELECT 
                re.id,
                re.earnings,
                re.created_at as date,
                re.plan_name,
                u.username
            FROM 
                referral_earnings re
            JOIN 
                users u ON re.referred_id = u.id
            WHERE 
                re.referrer_id = ?
            ORDER BY 
                re.created_at DESC
        `, [userId], (err, history) => {
            if (err) {
                console.error('Error fetching referral history:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Calculate total earnings
            db.query('SELECT SUM(earnings) as total FROM referral_earnings WHERE referrer_id = ?', [userId], (err, totalResults) => {
                if (err) {
                    console.error('Error calculating total earnings:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                const totalEarnings = totalResults[0].total || 0;
                
                res.json({
                    referralCode,
                    totalEarnings,
                    history
                });
            });
        });
    });
});

// Modify the save-plan endpoint to handle referrals
app.post('/save-plan', isAuthenticated, async (req, res) => {
    console.log('Received plan purchase request:', req.body);
    const { planName, planPrice, realPrice, duration, planType, paymentId, orderId, referralCode, subcategory } = req.body;
    
    // Always use req.dbUser.id as the source of user ID
    const userIdToUse = req.dbUser.id;
    
    if (!userIdToUse) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Determine which table to insert into based on plan type
    let tableName;
    switch (planType) {
        case 'Algo Software':
            tableName = 'algo_software_plans';
            break;
        case 'Indicator Plan':
            tableName = 'indicator_plans';
            break;
        case 'Algo Smart Investment':
            tableName = 'algo_smart_investment_plans';
            break;
        default:
            return res.status(400).json({ error: 'Invalid plan type' });
    }

    try {
        // Start a transaction
        db.beginTransaction(async (err) => {
            if (err) {
                console.error('Error starting transaction:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Check if the table has all required columns
            db.query(`DESCRIBE ${tableName}`, (err, columns) => {
                if (err) {
                    db.rollback(() => {
                        console.error('Error checking table structure:', err);
                        return res.status(500).json({ error: 'Database error: ' + err.message });
                    });
                    return;
                }
                
                // Get column names
                const columnNames = columns.map(col => col.Field);
                
                // Build dynamic SQL query based on available columns
                let fields = ['user_id', 'plan_name', 'plan_price'];
                let placeholders = ['?', '?', '?'];
                let values = [userIdToUse, planName, planPrice];
                
                // Add optional fields if they exist in the table
                if (columnNames.includes('real_price')) {
                    fields.push('real_price');
                    placeholders.push('?');
                    values.push(realPrice || planPrice);
                }
                
                if (columnNames.includes('duration')) {
                    fields.push('duration');
                    placeholders.push('?');
                    values.push(duration);
                }
                
                if (columnNames.includes('payment_id') && paymentId) {
                    fields.push('payment_id');
                    placeholders.push('?');
                    values.push(paymentId);
                }
                
                if (columnNames.includes('order_id') && orderId) {
                    fields.push('order_id');
                    placeholders.push('?');
                    values.push(orderId);
                }
                
                if (columnNames.includes('subcategory') && planType === 'Algo Smart Investment' && subcategory) {
                    fields.push('subcategory');
                    placeholders.push('?');
                    values.push(subcategory);
                }
                
                const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
                
                db.query(sql, values, (err, planResult) => {
                    if (err) {
                        db.rollback(() => {
                            console.error('Database error:', err);
                            return res.status(500).json({ error: 'Database error: ' + err.message });
                        });
                        return;
                    }
                    
                    // Check if there's a referral code to process
                    if (referralCode) {
                        // Find the referrer
                        db.query('SELECT id FROM users WHERE referral_code = ?', [referralCode], (err, referrerResults) => {
                            if (err) {
                                db.rollback(() => {
                                    console.error('Error finding referrer:', err);
                                    return res.status(500).json({ error: 'Database error' });
                                });
                                return;
                            }
                            
                            // If referrer exists, add referral earnings
                            if (referrerResults.length > 0) {
                                const referrerId = referrerResults[0].id;
                                
                                // Calculate 5% of the plan price
                                const earnings = parseFloat(planPrice) * 0.05;
                                
                                // Insert referral earnings
                                db.query(
                                    'INSERT INTO referral_earnings (referrer_id, referred_id, plan_id, plan_type, plan_name, plan_price, earnings) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                    [referrerId, userIdToUse, planResult.insertId, planType, planName, planPrice, earnings],
                                    (err) => {
                                        if (err) {
                                            db.rollback(() => {
                                                console.error('Error adding referral earnings:', err);
                                                return res.status(500).json({ error: 'Database error' });
                                            });
                                            return;
                                        }
                                        
                                        // Update the user's referrer_id if not already set
                                        db.query('UPDATE users SET referrer_id = ? WHERE id = ? AND referrer_id IS NULL', [referrerId, userIdToUse], (err) => {
                                            if (err) {
                                                db.rollback(() => {
                                                    console.error('Error updating referrer_id:', err);
                                                    return res.status(500).json({ error: 'Database error' });
                                                });
                                                return;
                                            }
                                            
                                            // Commit the transaction
                                            db.commit((err) => {
                                                if (err) {
                                                    db.rollback(() => {
                                                        console.error('Error committing transaction:', err);
                                                        return res.status(500).json({ error: 'Database error' });
                                                    });
                                                    return;
                                                }
                                                
                                                res.status(201).json({ 
                                                    status: 'Plan saved successfully',
                                                    referralProcessed: true
                                                });
                                            });
                                        });
                                    }
                                );
                            } else {
                                // Invalid referral code, but still save the plan
                                db.commit((err) => {
                                    if (err) {
                                        db.rollback(() => {
                                            console.error('Error committing transaction:', err);
                                            return res.status(500).json({ error: 'Database error' });
                                        });
                                        return;
                                    }
                                    
                                    res.status(201).json({ 
                                        status: 'Plan saved successfully',
                                        referralProcessed: false,
                                        message: 'Invalid referral code'
                                    });
                                });
                            }
                        });
                    } else {
                        // No referral code, just save the plan
                        db.commit((err) => {
                            if (err) {
                                db.rollback(() => {
                                    console.error('Error committing transaction:', err);
                                    return res.status(500).json({ error: 'Database error' });
                                });
                                return;
                            }
                            
                            res.status(201).json({ status: 'Plan saved successfully' });
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error in save-plan endpoint:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Create tables for form data
const createFormTables = `
CREATE TABLE IF NOT EXISTS algosoft_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    whatsapp_number VARCHAR(20),
    mt5_account VARCHAR(100),
    trading_capital DECIMAL(10, 2),
    selected_plan VARCHAR(50),
    risk_reward_ratio VARCHAR(20),
    per_day_trades INT,
    capital_percentage_used INT,
    selected_segments VARCHAR(255),
    payment_id VARCHAR(100),
    order_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS algoindi_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    whatsapp_number VARCHAR(20),
    tradingview_user_id VARCHAR(100),
    selected_plan VARCHAR(50),
    payment_id VARCHAR(100),
    order_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS smartinvest_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    whatsapp_number VARCHAR(20),
    selected_plan VARCHAR(50),
    subcategory VARCHAR(50),
    address_proof_path VARCHAR(255),
    payment_id VARCHAR(100),
    order_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);`;

// Execute table creation
db.query(createFormTables, (err) => {
  if (err) {
    console.error('Error creating form tables:', err);
  } else {
    console.log('Form tables created or already exist');
  }
});

// Add form submission endpoints
app.post('/api/algosoft-forms', isAuthenticated, async (req, res) => {
  // ...endpoint implementation
});

app.post('/api/algoindi-forms', isAuthenticated, async (req, res) => {
  // ...endpoint implementation
});

app.post('/api/smartinvest-forms', isAuthenticated, async (req, res) => {
  // ...endpoint implementation
});

// Add password setup endpoint
app.post('/setup-password', isAuthenticated, async (req, res) => {
  try {
    const { uid, email } = req.body;

    // Update the user record in your database to mark that they have set up a password
    db.query(
      'UPDATE users SET has_password = TRUE WHERE firebase_uid = ?',
      [uid],
      (err, result) => {
        if (err) {
          console.error('Error updating user password status:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ status: 'success', message: 'Password setup completed' });
      }
    );
  } catch (error) {
    console.error('Error in password setup:', error);
    res.status(500).json({ error: 'Failed to setup password' });
  }
});

// Add has_password column to users table if it doesn't exist
db.query(`SHOW COLUMNS FROM users LIKE 'has_password'`, (err, results) => {
  if (err) {
    console.error('Error checking for has_password column:', err);
    return;
  }
  
  if (results.length === 0) {
    db.query(
      'ALTER TABLE users ADD COLUMN has_password BOOLEAN DEFAULT FALSE',
      (err) => {
        if (err) {
          console.error('Error adding has_password column:', err);
        } else {
          console.log('Added has_password column to users table');
        }
      }
    );
  }
});

// Add wallet related endpoints 
app.get('/api/user/wallet', isAuthenticated, async (req, res) => {
  try {
    const userId = req.dbUser.id;
    console.log('Fetching wallet for user:', userId);

    // Fetch wallet entry
    const [wallet] = await db.query(
      'SELECT * FROM user_wallet WHERE user_id = ?',
      [userId]
    );

    // If no wallet exists, create one
    if (!wallet) {
      console.log('No wallet found for user. Creating a new wallet entry.');
      await db.query(
        'INSERT INTO user_wallet (user_id, balance) VALUES (?, 0)',
        [userId]
      );
      return res.json({ balance: 0 });
    } 

    const balance = parseFloat(wallet.balance) || 0;
    console.log('Wallet balance fetched successfully:', balance);

    res.json({ balance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error.message);
    res.status(500).json({
      error: 'Failed to fetch wallet balance',
      details: error.message,
    });
  }
});

app.get('/api/user/collectible-plans', isAuthenticated, async (req, res) => {
  try {
    const userId = req.dbUser.id;
    
    // Get plans that have completed their duration and haven't been collected
    const query = `
      SELECT p.*, pc.base_price, pc.plan_name
      FROM (
        SELECT * FROM algo_software_plans 
        UNION ALL 
        SELECT * FROM indicator_plans
        UNION ALL 
        SELECT * FROM algo_smart_investment_plans
      ) p
      JOIN plan_configurations pc ON p.plan_id = pc.id
      WHERE p.user_id = ?
      AND p.collected = FALSE
      AND DATEDIFF(CURRENT_TIMESTAMP, p.purchase_date) >= 
        CASE 
          WHEN p.duration = '18 Months' THEN 540
          WHEN p.duration = '21 Months' THEN 630
          WHEN p.duration = '24 Months' THEN 720
          ELSE 0
        END
    `;
    
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch collectible plans' });
      }
      
      res.json(results);
    });
  } catch (error) {
    console.error('Error fetching collectible plans:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/user/collect-earnings', isAuthenticated, async (req, res) => {
  const { planId } = req.body;
  const userId = req.dbUser.id;

  db.beginTransaction(async (err) => {
    if (err) {
      return res.status(500).json({ error: 'Transaction error' });
    }

    try {
      // Get plan details and calculate earnings
      const plan = await new Promise((resolve, reject) => {
        db.query(
          'SELECT * FROM plan_configurations WHERE id = ?',
          [planId],
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
          }
        );
      });

      // Calculate earnings based on plan type and duration
      const earnings = calculateEarnings(plan);

      // Update user's wallet balance
      await new Promise((resolve, reject) => {
        db.query(
          'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
          [earnings, userId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Mark plan as collected
      await new Promise((resolve, reject) => {
        db.query(
          'UPDATE plans SET collected = TRUE WHERE id = ? AND user_id = ?',
          [planId, userId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Get new wallet balance
      const newBalance = await new Promise((resolve, reject) => {
        db.query(
          'SELECT wallet_balance FROM users WHERE id = ?',
          [userId],
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0].wallet_balance);
          }
        );
      });

      db.commit((err) => {
        if (err) {
          db.rollback(() => {
            res.status(500).json({ error: 'Failed to collect earnings' });
          });
        } else {
          res.json({ 
            status: 'success', 
            message: 'Earnings collected successfully',
            newBalance
          });
        }
      });
    } catch (error) {
      db.rollback(() => {
        console.error('Error collecting earnings:', error);
        res.status(500).json({ error: 'Failed to collect earnings' });
      });
    }
  });
});

// Helper function to calculate earnings
function calculateEarnings(plan) {
  // Implement your earnings calculation logic here
  // This is a simple example - modify according to your business rules
  return plan.base_price * 1.5; // 50% return
}


// Add new endpoint to check plan expiration status 
app.get('/api/user/check-plan-expiry', isAuthenticated, (req, res) => {
    const userId = req.dbUser.id;
  
    const query = `
        SELECT 
            p.*,
            p.purchase_date as start_date,
            DATE_ADD(p.purchase_date, INTERVAL 
                CASE 
                    WHEN p.duration = '3 Months' THEN 3
                    WHEN p.duration = '6 Months' THEN 6
                    WHEN p.duration = '9 Months' THEN 9
                    WHEN p.duration = '12 Months' THEN 12
                    WHEN p.duration = '18 Months' THEN 18
                    WHEN p.duration = '24 Months' THEN 24
                    ELSE 18
                END MONTH) as expiry_date,
            DATE_ADD(p.purchase_date, INTERVAL 1 MONTH) as next_billing_date,
            CASE 
                WHEN TIMESTAMPDIFF(MONTH, p.purchase_date, CURRENT_TIMESTAMP) >= 
                    CASE 
                        WHEN p.duration = '3 Months' THEN 3
                        WHEN p.duration = '6 Months' THEN 6
                        WHEN p.duration = '9 Months' THEN 9
                        WHEN p.duration = '12 Months' THEN 12
                        WHEN p.duration = '18 Months' THEN 18
                        WHEN p.duration = '24 Months' THEN 24
                        ELSE 18
                    END
                THEN TRUE 
                ELSE FALSE 
            END as is_expired,
            GREATEST(0,
                CASE 
                    WHEN p.duration = '3 Months' THEN 3
                    WHEN p.duration = '6 Months' THEN 6
                    WHEN p.duration = '9 Months' THEN 9
                    WHEN p.duration = '12 Months' THEN 12
                    WHEN p.duration = '18 Months' THEN 18
                    WHEN p.duration = '24 Months' THEN 24
                    ELSE 18
                END - TIMESTAMPDIFF(MONTH, p.purchase_date, CURRENT_TIMESTAMP)
            ) as months_remaining
        FROM (
            SELECT *, 'Algo Software' as plan_type FROM algo_software_plans 
            UNION ALL 
            SELECT *, 'Indicator Plan' as plan_type FROM indicator_plans
            UNION ALL 
            SELECT *, 'Algo Smart Investment' as plan_type FROM algo_smart_investment_plans
        ) p
        JOIN plan_configurations pc ON p.plan_id = pc.id
        WHERE p.user_id = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error checking plan expiry:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const formattedResults = results.map(plan => ({
            ...plan,
            status: plan.is_expired ? 'Expired' : 'Active',
            start_date: plan.start_date,
            expiry_date: plan.expiry_date,
            next_billing_date: plan.next_billing_date,
            months_remaining: Math.max(0, plan.months_remaining)
        }));

        res.json(formattedResults);
    });
});

// Add form data columns to plan tables
const alterPlanTables = [
  `ALTER TABLE algo_software_plans 
   ADD COLUMN contact_number VARCHAR(20),
   ADD COLUMN email VARCHAR(255),
   ADD COLUMN whatsapp_number VARCHAR(20),
   ADD COLUMN email VARCHAR(255),
   ADD COLUMN whatsapp_number VARCHAR(20),
   ADD COLUMN mt5_account VARCHAR(100),
   ADD COLUMN trading_capital DECIMAL(10, 2),
   ADD COLUMN risk_reward_ratio VARCHAR(20),
   ADD COLUMN per_day_trades INT,
   ADD COLUMN capital_percentage_used INT,
   ADD COLUMN selected_segments VARCHAR(255)`,

  `ALTER TABLE indicator_plans 
   ADD COLUMN contact_number VARCHAR(20),
   ADD COLUMN email VARCHAR(255),
   ADD COLUMN whatsapp_number VARCHAR(20),
   ADD COLUMN tradingview_user_id VARCHAR(100)`,

  `ALTER TABLE algo_smart_investment_plans 
   ADD COLUMN contact_number VARCHAR(20),
   ADD COLUMN email VARCHAR(255),
   ADD COLUMN whatsapp_number VARCHAR(20),
   ADD COLUMN address_proof_path VARCHAR(255)`
];

alterPlanTables.forEach(query => {
  db.query(query, (err) => {
    if (err && !err.message.includes('Duplicate column name')) {
      console.error('Error altering plan tables:', err);
    }
  });
});

// Add API endpoints for form submissions
app.post('/api/algosoft-forms', isAuthenticated, async (req, res) => {
  const userId = req.dbUser.id;
  const { planId, contactNumber, email, whatsappNumber, mt5Account, 
          tradingCapital, riskRewardRatio, perDayTrades, 
          capitalPercentageUsed, selectedSegments } = req.body;

  const query = `
    UPDATE algo_software_plans 
    SET contact_number = ?, email = ?, whatsapp_number = ?, 
        mt5_account = ?, trading_capital = ?, risk_reward_ratio = ?,
        per_day_trades = ?, capital_percentage_used = ?, 
        selected_segments = ?
    WHERE user_id = ? AND id = ?`;

  db.query(query, [
    contactNumber, email, whatsappNumber, mt5Account,
    tradingCapital, riskRewardRatio, perDayTrades,
    capitalPercentageUsed, selectedSegments, userId, planId
  ], (err) => {
    if (err) {
      console.error('Error saving form data:', err);
      return res.status(500).json({ error: 'Failed to save form data' });
    }
    res.json({ status: 'Form data saved successfully' });
  });
});

app.post('/api/algoindi-forms', isAuthenticated, async (req, res) => {
  const userId = req.dbUser.id;
  const { planId, contactNumber, email, whatsappNumber, tradingViewUserId } = req.body;

  const query = `
    UPDATE indicator_plans 
    SET contact_number = ?, email = ?, 
        whatsapp_number = ?, tradingview_user_id = ?
    WHERE user_id = ? AND id = ?`;

  db.query(query, [
    contactNumber, email, whatsappNumber, 
    tradingViewUserId, userId, planId
  ], (err) => {
    if (err) {
      console.error('Error saving form data:', err);
      return res.status(500).json({ error: 'Failed to save form data' });
    }
    res.json({ status: 'Form data saved successfully' });
  });
});

app.post('/api/smartinvest-forms', isAuthenticated, async (req, res) => {
  const userId = req.dbUser.id;
  const { planId, contactNumber, email, whatsappNumber, addressProof } = req.body;

  const query = `
    UPDATE algo_smart_investment_plans 
    SET contact_number = ?, email = ?, 
        whatsapp_number = ?, address_proof_path = ?
    WHERE user_id = ? AND id = ?`;

  db.query(query, [
    contactNumber, email, whatsappNumber, 
    addressProof, userId, planId
  ], (err) => {
    if (err) {
      console.error('Error saving form data:', err);
      return res.status(500).json({ error: 'Failed to save form data' });
    }
    res.json({ status: 'Form data saved successfully' });
  });
});

// Add phone verification endpoint
app.post('/api/verify-phone', isAuthenticated, async (req, res) => {
  const { phoneNumber, sessionInfo, code } = req.body;

  try {
    // Verify the phone verification code
    const credential = await admin.auth().verifyPhoneNumber({
      sessionInfo,
      code,
    });

    // Update the user's phone number verification status in database
    db.query(
      'UPDATE users SET phone_verified = TRUE WHERE id = ?',
      [req.dbUser.id],
      (err) => {
        if (err) {
          console.error('Error updating phone verification status:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ status: 'success', phoneNumber: credential.phoneNumber });
      }
    );
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(400).json({ error: 'Invalid verification code' });
  }
});

// Modify the form submission endpoints to check for phone verification
const checkPhoneVerification = async (req, res, next) => {
  db.query(
    'SELECT phone_verified FROM users WHERE id = ?',
    [req.dbUser.id],
    (err, results) => {
      if (err || !results[0]?.phone_verified) {
        return res.status(403).json({ error: 'Phone number not verified' });
      }
      next();
    }
  );
};

// Update form endpoints to use phone verification
app.post('/api/algosoft-forms', isAuthenticated, checkPhoneVerification, async (req, res) => {
  const userId = req.dbUser.id;
  const { planId, contactNumber, email, whatsappNumber, mt5Account, 
          tradingCapital, riskRewardRatio, perDayTrades, 
          capitalPercentageUsed, selectedSegments } = req.body;

  const query = `
    UPDATE algo_software_plans 
    SET contact_number = ?, email = ?, whatsapp_number = ?, 
        mt5_account = ?, trading_capital = ?, risk_reward_ratio = ?,
        per_day_trades = ?, capital_percentage_used = ?, 
        selected_segments = ?
    WHERE user_id = ? AND id = ?`;

  db.query(query, [
    contactNumber, email, whatsappNumber, mt5Account,
    tradingCapital, riskRewardRatio, perDayTrades,
    capitalPercentageUsed, selectedSegments, userId, planId
  ], (err) => {
    if (err) {
      console.error('Error saving form data:', err);
      return res.status(500).json({ error: 'Failed to save form data' });
    }
    res.json({ status: 'Form data saved successfully' });
  });
});

app.post('/api/algoindi-forms', isAuthenticated, checkPhoneVerification, async (req, res) => {
  const userId = req.dbUser.id;
  const { planId, contactNumber, email, whatsappNumber, tradingViewUserId } = req.body;

  const query = `
    UPDATE indicator_plans 
    SET contact_number = ?, email = ?, 
        whatsapp_number = ?, tradingview_user_id = ?
    WHERE user_id = ? AND id = ?`;

  db.query(query, [
    contactNumber, email, whatsappNumber, 
    tradingViewUserId, userId, planId
  ], (err) => {
    if (err) {
      console.error('Error saving form data:', err);
      return res.status(500).json({ error: 'Failed to save form data' });
    }
    res.json({ status: 'Form data saved successfully' });
  });
});

app.post('/api/smartinvest-forms', isAuthenticated, checkPhoneVerification, async (req, res) => {
  const userId = req.dbUser.id;
  const { planId, contactNumber, email, whatsappNumber, addressProof } = req.body;

  const query = `
    UPDATE algo_smart_investment_plans 
    SET contact_number = ?, email = ?, 
        whatsapp_number = ?, address_proof_path = ?
    WHERE user_id = ? AND id = ?`;
 
  db.query(query, [
    contactNumber, email, whatsappNumber, 
    addressProof, userId, planId
  ], (err) => {
    if (err) {
      console.error('Error saving form data:', err);
      return res.status(500).json({ error: 'Failed to save form data' });
    }
    res.json({ status: 'Form data saved successfully' });
  });
});

// Add column to users table for phone verification
db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE`, (err) => {
  if (err) {
    console.error('Error adding phone_verified column:', err);
  }
});

// Add new endpoint to check plan expiration status 
app.get('/api/user/check-plan-expiry', isAuthenticated, (req, res) => {
    const userId = req.dbUser.id;
  
    const query = `
        SELECT 
            p.*,
            p.purchase_date as start_date,
            DATE_ADD(p.purchase_date, INTERVAL 
                CASE 
                    WHEN p.duration = '3 Months' THEN 3
                    WHEN p.duration = '6 Months' THEN 6
                    WHEN p.duration = '9 Months' THEN 9
                    WHEN p.duration = '12 Months' THEN 12
                    WHEN p.duration = '18 Months' THEN 18
                    WHEN p.duration = '24 Months' THEN 24
                    ELSE 18
                END MONTH) as expiry_date,
            DATE_ADD(p.purchase_date, INTERVAL 1 MONTH) as next_billing_date,
            CASE 
                WHEN TIMESTAMPDIFF(MONTH, p.purchase_date, CURRENT_TIMESTAMP) >= 
                    CASE 
                        WHEN p.duration = '3 Months' THEN 3
                        WHEN p.duration = '6 Months' THEN 6
                        WHEN p.duration = '9 Months' THEN 9
                        WHEN p.duration = '12 Months' THEN 12
                        WHEN p.duration = '18 Months' THEN 18
                        WHEN p.duration = '24 Months' THEN 24
                        ELSE 18
                    END
                THEN TRUE 
                ELSE FALSE 
            END as is_expired,
            GREATEST(0,
                CASE  
                    WHEN p.duration = '3 Months' THEN 3
                    WHEN p.duration = '6 Months' THEN 6
                    WHEN p.duration = '9 Months' THEN 9
                    WHEN p.duration = '12 Months' THEN 12
                    WHEN p.duration = '18 Months' THEN 18
                    WHEN p.duration = '24 Months' THEN 24
                    ELSE 18
                END - TIMESTAMPDIFF(MONTH, p.purchase_date, CURRENT_TIMESTAMP)
            ) as months_remaining
        FROM (  
            SELECT *, 'Algo Software' as plan_type FROM algo_software_plans 
            UNION ALL 
            SELECT *, 'Indicator Plan' as plan type FROM indicator_plans
            UNION ALL 
            SELECT *, 'Algo Smart Investment' as plan type FROM algo_smart_investment_plans
        ) p
        JOIN plan_configurations pc ON p.plan_id = pc.id
        WHERE p.user_id = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error checking plan expiry:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const formattedResults = results.map(plan => ({
            ...plan,
            status: plan.is_expired ? 'Expired' : 'Active',
            start_date: plan.start_date,
            expiry_date: plan.expiry_date,
            next_billing_date: plan.next_billing_date,
            months_remaining: Math.max(0, plan.months_remaining)
        }));

        res.json(formattedResults);
    });
});

// Add is_collected column to plan tables
const alterPlanTablesForCollection = [
  `ALTER TABLE algo_software_plans 
   ADD COLUMN IF NOT EXISTS is_collected BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE indicator_plans 
   ADD COLUMN IF NOT EXISTS is_collected BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE algo_smart_investment_plans 
   ADD COLUMN IF NOT EXISTS is_collected BOOLEAN DEFAULT FALSE`
];

alterPlanTablesForCollection.forEach(query => {
  db.query(query, (err) => {
    if (err) {
      console.error('Error adding is_collected column:', err);
    }
  });
});

// Add endpoint to mark plan as collected
app.post('/api/user/collect-plan/:planId', isAuthenticated, async (req, res) => {
    const { planId } = req.params;
    const { planType } = req.body;
    const userId = req.dbUser.id;

    let tableName;
    switch (planType) {
        case 'Algo Software':
            tableName = 'algo_software_plans';
            break;
        case 'Indicator Plan':
            tableName = 'indicator_plans';
            break;
        case 'Algo Smart Investment':
            tableName = 'algo_smart_investment_plans';
            break;
        default:
            return res.status(400).json({ error: 'Invalid plan type' });
    }

    const sql = `UPDATE ${tableName} SET is_collected = TRUE 
                 WHERE id = ? AND user_id = ? AND is_collected = FALSE`;

    db.query(sql, [planId, userId], (err, result) => {
        if (err) {
            console.error('Error collecting plan:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Plan not found or already collected' });
        }

        res.json({ message: 'Plan collected successfully' });
    });
});

// Add admin endpoint to mark plan as collected
app.post('/admin/collect-plan/:planId', isAdmin, async (req, res) => {
    const { planId } = req.params;
    const { planType } = req.body;

    let tableName;
    switch (planType) {
        case 'Algo Software':
            tableName = 'algo_software_plans';
            break;
        case 'Indicator Plan':
            tableName = 'indicator_plans';
            break;
        case 'Algo Smart Investment':
            tableName = 'algo_smart_investment_plans';
            break;
        default:
            return res.status(400).json({ error: 'Invalid plan type' });
    } 

    const sql = `UPDATE ${tableName} SET is_collected = TRUE WHERE id = ?`;

    db.query(sql, [planId], (err, result) => {
        if (err) {
            console.error('Error collecting plan:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.json({ message: 'Plan marked as collected successfully' });
    });
});

// Add this endpoint to handle plan collection
app.post('/api/plans/collect', isAuthenticated, async (req, res) => {
  const { planId, planType } = req.body;
  const userId = req.dbUser.id;

  try { 
    await db.beginTransaction();
    
    // Get the plan details based on plan type
    let tableName;
    switch (planType) {
      case 'Algo Software':
        tableName = 'algo_software_plans';
        break;
      case 'Indicator Plan':
        tableName = 'indicator_plans';
        break;
      case 'Algo Smart Investment':
        tableName = 'algo_smart_investment_plans';
        break;
      default:
        throw new Error('Invalid plan type');
    }
 
    // Get plan details
    const plans = await db.query(
      `SELECT * FROM ${tableName} WHERE id = ? AND user_id = ? AND is_collected = 0`,
      [planId, userId]
    );

    if (!plans || plans.length === 0) {
      throw new Error('Plan not found or already collected');
    }

    const plan = plans[0];
    
    // Calculate earnings based on plan type and duration
    const earnings = calculatePlanEarnings(plan);

    // Update user's wallet balance
    await db.query(
      `INSERT INTO user_wallet (user_id, balance) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE balance = balance + ?`,
      [userId, earnings, earnings]
    );

    // Mark plan as collected
    await db.query(
      `UPDATE ${tableName} SET is_collected = 1 WHERE id = ?`,
      [planId]
    );

    await db.commit();

    res.json({
      success: true,
      message: 'Plan collected successfully',
      collected_amount: earnings
    });

  } catch (error) {
    await db.rollback();
    console.error('Transaction failed:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to collect plan earnings' 
    });
  }
});

// Helper function to calculate earnings based on plan type and duration
function calculatePlanEarnings(plan) {
  const planPrice = parseFloat(plan.plan_price);
  let returnRate = 0;

  switch (plan.plan_type) {
    case 'Algo Software':
      returnRate = 0.45; // 45% return
      break;
    case 'Indicator Plan':
      returnRate = 0.60; // 60% return
      break;
    case 'Algo Smart Investment':
      returnRate = 0.75; // 75% return
      break;
    default:
      returnRate = 0.50; // 50% default return
  }

  return planPrice * returnRate;
}

// Create user_wallet table if it doesn't exist
const createWalletTable = `
CREATE TABLE IF NOT EXISTS user_wallet (
    user_id INT PRIMARY KEY,
    balance DECIMAL(10, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)`;

db.query(createWalletTable, (err) => {
  if (err) {
    console.error('Error creating wallet table:', err);
  } else {
    console.log('Wallet table ready');
  }
});

// Add this endpoint to handle plan collection
app.post('/api/plans/collect', isAuthenticated, async (req, res) => {
  const { planId, planType } = req.body;
  const userId = req.dbUser.id;

  try {
    await db.beginTransaction();

    // Get the plan details based on plan type
    let tableName;
    switch (planType) {
      case 'Algo Software':
        tableName = 'algo_software_plans';
        break;
      case 'Indicator Plan':
        tableName = 'indicator_plans';
        break;
      case 'Algo Smart Investment':
        tableName = 'algo_smart_investment_plans';
        break;
      default:
        throw new Error('Invalid plan type');
    }

    // Get plan with explicit columns
    const [plans] = await db.query(
      `SELECT id, user_id, plan_name, plan_price, is_collected 
       FROM ${tableName} 
       WHERE id = ? AND user_id = ? AND is_collected = 0`,
      [planId, userId]
    );

    if (!plans || plans.length === 0) {
      throw new Error('Plan not found or already collected');
    }

    const plan = plans[0];

    // Validate plan price
    if (!plan.plan_price) {
      throw new Error('Invalid plan price');
    }

    const collectedAmount = parseFloat(plan.plan_price);
    if (isNaN(collectedAmount) || collectedAmount <= 0) {
      throw new Error('Invalid collection amount');
    }

    // Get current wallet balance
    const [walletRows] = await db.query(
      'SELECT balance FROM user_wallet WHERE user_id = ?',
      [userId]
    );

    const currentBalance = walletRows.length > 0 ? parseFloat(walletRows[0].balance) : 0;
    const newBalance = currentBalance + collectedAmount;

    // Update or create wallet entry
    await db.query(
      `INSERT INTO user_wallet (user_id, balance) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE balance = ?`,
      [userId, newBalance, newBalance]
    );

    // Mark plan as collected
    await db.query(
      `UPDATE ${tableName} SET is_collected = 1 WHERE id = ? AND user_id = ?`,
      [planId, userId]
    );

    await db.commit();

    res.json({
      success: true,
      message: 'Plan collected successfully',
      collected_amount: collectedAmount,
      new_balance: newBalance
    });

  } catch (error) {
    await db.rollback();
    console.error('Collection transaction failed:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to collect plan earnings' 
    });
  }
});

// Add endpoint to get wallet balance
app.get('/api/user/wallet', isAuthenticated, async (req, res) => {
  try {
    const userId = req.dbUser.id;
    const [wallet] = await db.query(
      'SELECT balance FROM user_wallet WHERE user_id = ?',
      [userId]
    );

    const balance = wallet.length > 0 ? parseFloat(wallet[0].balance) : 0;
    res.json({ balance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// Create withdrawals table if not exists
// const createWithdrawalsTable = `
// CREATE TABLE IF NOT EXISTS withdrawals (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   user_id INT NOT NULL,
//   amount DECIMAL(10, 2) NOT NULL,
//   bank_name VARCHAR(255) NOT NULL,
//   account_number VARCHAR(50) NOT NULL,
//   ifsc_code VARCHAR(20) NOT NULL,
//   account_holder_name VARCHAR(255) NOT NULL,
//   remarks TEXT,
//   status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//   FOREIGN KEY (user_id) REFERENCES users(id)
// )`;  

// db.query(createWithdrawalsTable, (err) => {
//   if (err) console.error('Error creating withdrawals table:', err);
//   else console.log('Withdrawals table checked/created successfully');
// });

// Add withdrawal endpoints
app.post('/api/user/withdrawals', isAuthenticated, async (req, res) => {
  const userId = req.dbUser.id;
  const { amount, bankName, accountNumber, ifscCode, accountHolderName, remarks } = req.body;

  try {
    // Check if user has sufficient balance
    const [wallet] = await db.query('SELECT balance FROM user_wallet WHERE user_id = ?', [userId]);
    
    if (!wallet || parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal request
    await db.query(
      'INSERT INTO withdrawals (user_id, amount, bank_name, account_number, ifsc_code, account_holder_name, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, amount, bankName, accountNumber, ifscCode, accountHolderName, remarks]
    );

    // Deduct amount from wallet
    await db.query(
      'UPDATE user_wallet SET balance = balance - ? WHERE user_id = ?',
      [amount, userId]
    );

    res.json({ message: 'Withdrawal request submitted successfully' });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
});

app.get('/api/user/withdrawals', isAuthenticated, async (req, res) => {
  const userId = req.dbUser.id;

  try {
    const withdrawals = await db.query(
      'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
});



// Add withdrawal endpoints
app.post('/api/user/withdrawals', isAuthenticated, async (req, res) => {
  const userId = req.dbUser.id;
  const { amount, bankName, accountNumber, ifscCode, accountHolderName, remarks } = req.body;

  try {
    // Check if user has sufficient balance
    const [wallet] = await db.query('SELECT balance FROM user_wallet WHERE user_id = ?', [userId]);
    
    if (!wallet || parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    } 

    // Create withdrawal request
    await db.query(
      'INSERT INTO withdrawals (user_id, amount, bank_name, account_number, ifsc_code, account_holder_name, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, amount, bankName, accountNumber, ifscCode, accountHolderName, remarks]
    );

    // Deduct amount from wallet
    await db.query(
      'UPDATE user_wallet SET balance = balance - ? WHERE user_id = ?',
      [amount, userId]
    );

    res.json({ message: 'Withdrawal request submitted successfully' });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
});

// Get user withdrawal history
app.get('/api/user/withdrawals', isAuthenticated, async (req, res) => {
  const userId = req.dbUser.id;
  try {
    const withdrawals = await db.query(
      'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
});

// Admin endpoints for withdrawal management
app.get('/admin/withdrawals', isAdmin, async (req, res) => {
  try {
    const withdrawals = await db.query(` 
      SELECT w.*, u.username, u.email
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `);
    res.json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

app.post('/admin/withdrawals/:id/:action', isAdmin, async (req, res) => {
  const { id, action } = req.params;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    await db.beginTransaction();

    const [withdrawal] = await db.query(
      'SELECT * FROM withdrawals WHERE id = ? AND status = "pending"',
      [id]
    );

    if (!withdrawal) {
      await db.rollback();
      return res.status(404).json({ error: 'Withdrawal request not found or already processed' });
    }

    if (action === 'reject') {
      // If rejecting, return the amount to user's wallet
      await db.query(
        'UPDATE user_wallet SET balance = balance + ? WHERE user_id = ?',
        [withdrawal.amount, withdrawal.user_id]
      );
    }

    // Update withdrawal status
    await db.query(
      'UPDATE withdrawals SET status = ? WHERE id = ?',
      [action === 'approve' ? 'approved' : 'rejected', id]
    );

    await db.commit();
    res.json({ message: `Withdrawal ${action}d successfully` });
  } catch (error) {
    await db.rollback();
    console.error(`Error ${action}ing withdrawal:`, error);
    res.status(500).json({ error: `Failed to ${action} withdrawal` });
  }
});

// Create withdrawals table
const createWithdrawalsTable = `
DROP TABLE IF EXISTS withdrawals;
CREATE TABLE withdrawals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  ifsc_code VARCHAR(20) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  remarks TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`;

db.query(createWithdrawalsTable, (err) => {
  if (err) {
    console.error('Error creating withdrawals table:', err);
  } else {
    console.log('Withdrawals table created successfully');
  }
});

// // Add payment_details table creation
// const createPaymentDetailsTable = `
// CREATE TABLE IF NOT EXISTS payment_details (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   user_id INT NOT NULL,
//   order_id VARCHAR(255) NOT NULL,
//   payment_id VARCHAR(255),
//   amount DECIMAL(10, 2) NOT NULL,
//   status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//   FOREIGN KEY (user_id) REFERENCES users(id)
// )`;

// db.query(createPaymentDetailsTable, (err) => {
//   if (err) console.error('Error creating payment_details table:', err);
//   else console.log('Payment details table ready');
// });

// Update verify payment endpoint
// app.post('/verify-payment', isAuthenticated, async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
//   const userId = req.dbUser.id;

//   try {
//     // Start transaction
//     await db.beginTransaction();

//     // Get payment details from database
//     const [paymentDetails] = await db.query(
//       'SELECT * FROM payment_details WHERE order_id = ? AND user_id = ?',
//       [razorpay_order_id, userId]
//     );

//     if (!paymentDetails || paymentDetails.length === 0) {
//       throw new Error('Payment details not found');
//     }

//     // Verify signature
//     const text = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const generated_signature = crypto
//       .createHmac('sha256', razorpay.key_secret)
//       .update(text)
//       .digest('hex');

//     if (generated_signature !== razorpay_signature) {
//       throw new Error('Invalid payment signature');
//     }

//     // Update payment status
//     await db.query(
//       'UPDATE payment_details SET payment_id = ?, status = ? WHERE order_id = ?',
//       [razorpay_payment_id, 'completed', razorpay_order_id]
//     );

//     await db.commit();
//     res.json({ status: 'success' });

//   } catch (error) {
//     await db.rollback();
//     console.error('Payment verification error:', error);
//     res.status(400).json({ error: error.message });
//   }
// });

// Create payment_details table if it doesn't exist

// Add columns for upgrade tracking
const alterPlanTablesForUpgrades = [
  `ALTER TABLE algo_software_plans 
   ADD COLUMN IF NOT EXISTS upgraded_from INT NULL,
   ADD COLUMN IF NOT EXISTS upgraded_to INT NULL,
   ADD COLUMN IF NOT EXISTS previous_duration VARCHAR(50) NULL,
   ADD COLUMN IF NOT EXISTS is_upgraded BOOLEAN DEFAULT FALSE`,
   
  `ALTER TABLE indicator_plans 
   ADD COLUMN IF NOT EXISTS upgraded_from INT NULL,
   ADD COLUMN IF NOT EXISTS upgraded_to INT NULL,
   ADD COLUMN IF NOT EXISTS previous_duration VARCHAR(50) NULL,
   ADD COLUMN IF NOT EXISTS is_upgraded BOOLEAN DEFAULT FALSE`
];

alterPlanTablesForUpgrades.forEach(query => {
  db.query(query, (err) => {
    if (err && !err.message.includes('Duplicate column name')) {
      console.error('Error altering plan tables for upgrades:', err);
    }
  });
});

// Add new endpoint to handle plan upgrades
app.post('/api/upgrade-plan', isAuthenticated, async (req, res) => {
  const { oldPlanId, newPlanId, planType } = req.body;
  const userId = req.dbUser.id;

  try {
    await db.beginTransaction();

    // Get table name based on plan type
    let tableName;
    switch (planType) {
      case 'Algo Software':
        tableName = 'algo_software_plans';
        break;
      case 'Indicator Plan':
        tableName = 'indicator_plans';
        break;
      default:
        throw new Error('Invalid plan type for upgrade');
    }

    // Fetch old plan details
    const [oldPlan] = await db.query(
      `SELECT * FROM ${tableName} WHERE id = ? AND user_id = ?`,
      [oldPlanId, userId]
    );

    if (!oldPlan) {
      throw new Error('Original plan not found');
    }

    // Fetch new plan configuration
    const [newPlanConfig] = await db.query(
      'SELECT * FROM plan_configurations WHERE id = ?',
      [newPlanId]
    );

    if (!newPlanConfig) {
      throw new Error('New plan configuration not found');
    }

    // Log old and new plans
    console.log('Old Plan:', oldPlan);
    console.log('New Plan:', newPlanConfig);

    // Verify upgrade is valid (new plan price > old plan price)
    if (parseFloat(newPlanConfig.base_price) <= parseFloat(oldPlan.plan_price)) {
      throw new Error('Invalid upgrade: New plan must be more expensive than current plan');
    }

    // Mark old plan as upgraded
    await db.query(
      `UPDATE ${tableName} SET 
       is_upgraded = TRUE, 
       upgraded_to = ? 
       WHERE id = ?`,
      [newPlanId, oldPlanId]
    );

    // Insert new upgraded plan
    await db.query(
      `INSERT INTO ${tableName} (
        user_id, plan_name, plan_price, real_price, 
        duration, upgraded_from, purchase_date
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        newPlanConfig.plan_name,
        newPlanConfig.base_price,
        newPlanConfig.real_price || newPlanConfig.base_price,
        newPlanConfig.duration,
        oldPlanId
      ]
    );

    await db.commit();

    res.json({
      status: 'success',
      message: 'Plan upgraded successfully'
    });

  } catch (error) {
    await db.rollback();
    console.error('Plan upgrade error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Helper functions for duration calculations
function convertDurationToDays(duration) {
  const match = duration.match(/(\d+)\s+(Day|Days|Month|Months|Year|Years)/i);
  if (!match) return 0;
  
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  if (unit.includes('day')) return amount;
  if (unit.includes('month')) return amount * 30;
  if (unit.includes('year')) return amount * 365;
  return 0;
}

function convertDaysToDuration(days) {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    if (remainingDays === 0) return `${years} ${years === 1 ? 'Year' : 'Years'}`;
    return `${years} ${years === 1 ? 'Year' : 'Years'} ${remainingDays} Days`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) return `${months} ${months === 1 ? 'Month' : 'Months'}`;
    return `${months} ${months === 1 ? 'Month' : 'Months'} ${remainingDays} Days`;
  }
  return `${days} ${days === 1 ? 'Day' : 'Days'}`;
}

function calculateRemainingDays(purchaseDate, totalDays) {
  const start = new Date(purchaseDate);
  const now = new Date();
  const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, totalDays - elapsedDays);
}

// Modify user plans endpoint to include upgrade information
app.get('/api/user/plans', isAuthenticated, (req, res) => {
  // ...existing code...
  
  const queries = [
    `SELECT p.*, 'Algo Software' as plan_type, pc.base_price as upgrade_base_price,
     CASE 
       WHEN p.is_upgraded = 1 THEN 'Upgraded'
       WHEN p.upgraded_to IS NOT NULL THEN 'Expired (Upgraded)'
       ELSE 'Active'
     END as status
     FROM algo_software_plans p
     LEFT JOIN plan_configurations pc ON p.upgraded_to = pc.id
     WHERE p.user_id = ?`,
    
    `SELECT p.*, 'Indicator Plan' as plan_type, pc.base_price as upgrade_base_price,
     CASE 
       WHEN p.is_upgraded = 1 THEN 'Upgraded'
       WHEN p.upgraded_to IS NOT NULL THEN 'Expired (Upgraded)'
       ELSE 'Active'
     END as status
     FROM indicator_plans p
     LEFT JOIN plan_configurations pc ON p.upgraded_to = pc.id
     WHERE p.user_id = ?`,
    
    `SELECT *, 'Algo Smart Investment' as plan_type, 'Active' as status 
     FROM algo_smart_investment_plans 
     WHERE user_id = ?`
  ];

  // ...existing code...
});

app.get('/api/plan-configurations/:planId', async (req, res) => {
  const { planId } = req.params;

  try {
    console.log("Fetching plan configuration for planId:", planId); // Debug log
    const query = 'SELECT * FROM plan_configurations WHERE id = ?';
    const results = await db.query(query, [planId]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Plan configuration not found" });
    }

    res.json(results[0]);
  } catch (error) {
    console.error("Error fetching plan configuration:", error);
    res.status(500).json({ error: "Failed to fetch plan configuration" });
  }
});

// Add new columns to algo_smart_investment_plans table for split payments
const alterSmartInvestmentPlanTable = `
ALTER TABLE algo_smart_investment_plans 
ADD COLUMN IF NOT EXISTS first_collection_made BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS final_collection_made BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_collection_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS final_collection_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS months_collected INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_collection_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS total_collected_amount DECIMAL(10, 2) DEFAULT 0`;

db.query(alterSmartInvestmentPlanTable, (err) => {
  if (err) {
    console.error('Error adding split payment columns to algo_smart_investment_plans table:', err);
  } else {
    console.log('Added split payment columns to algo_smart_investment_plans table');
  }
});

// Update the collection endpoint to handle split payments
app.post('/api/plans/collect', isAuthenticated, async (req, res) => {
  const { planId, planType, collectionType } = req.body;
  const userId = req.dbUser.id;

  try {
    await db.beginTransaction();

    if (planType === 'Algo Smart Investment') {
      // Get plan details
      const [plan] = await db.query(
        'SELECT * FROM algo_smart_investment_plans WHERE id = ? AND user_id = ?',
        [planId, userId]
      );

      if (!plan) {
        throw new Error('Plan not found');
      }

      if (collectionType === 'half') {
        // Handle first 50% collection
        if (plan.first_collection_made) {
          throw new Error('First collection already made');
        }

        await db.query(
          `UPDATE algo_smart_investment_plans 
           SET first_collection_made = TRUE, 
               first_collection_date = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [planId]
        );

        // Add 50% of total returns to wallet
        const collectedAmount = plan.plan_price;
        await db.query(
          `INSERT INTO user_wallet (user_id, balance) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE balance = balance + ?`,
          [userId, collectedAmount, collectedAmount]
        );

        await db.commit();
        res.json({ status: 'success', collected_amount: collectedAmount });
      } else if (collectionType === 'final') {
        // Handle final 50% collection
        if (!plan.first_collection_made) {
          throw new Error('Must collect first 50% before final collection');
        }
        if (plan.final_collection_made) {
          throw new Error('Final collection already made');
        }

        await db.query(
          `UPDATE algo_smart_investment_plans 
           SET final_collection_made = TRUE, 
               final_collection_date = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [planId]
        );

        // Add remaining 50% to wallet
        const collectedAmount = plan.plan_price;
        await db.query(
          `INSERT INTO user_wallet (user_id, balance) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE balance = balance + ?`,
          [userId, collectedAmount, collectedAmount]
        );

        await db.commit();
        res.json({ status: 'success', collected_amount: collectedAmount });
      }
    } else {
      // Handle regular collection for other plan types
      // ...existing collection logic...
    }
  } catch (error) {
    await db.rollback();
    console.error('Error processing collection:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update the collection endpoint to handle monthly collections
app.post('/api/plans/collect', isAuthenticated, async (req, res) => {
  const { planId, planType, collectionType } = req.body;
  const userId = req.dbUser.id;

  try {
    await db.beginTransaction();

    // Get plan details
    const [plan] = await db.query(
      'SELECT * FROM algo_smart_investment_plans WHERE id = ? AND user_id = ?',
      [planId, userId]
    );

    if (!plan) {
      throw new Error('Plan not found');
    }

    if (plan.subcategory === 'Income Flow Builder' && collectionType === 'monthly') {
      // Calculate monthly returns
      const totalReturn = plan.plan_price * 2;
      const durationInMonths = getDurationInMonths(plan.duration);
      const monthlyReturn = totalReturn / durationInMonths;

      // Calculate months since last collection or start date
      const lastCollection = plan.last_collection_date ? new Date(plan.last_collection_date) : new Date(plan.purchase_date);
      const now = new Date();
      const monthsSinceLastCollection = 
        (now.getFullYear() - lastCollection.getFullYear()) * 12 + 
        (now.getMonth() - lastCollection.getMonth());

      if (monthsSinceLastCollection < 1) {
        throw new Error('Next collection not yet available');
      }

      const pendingAmount = monthlyReturn * monthsSinceLastCollection;
      const newMonthsCollected = (plan.months_collected || 0) + monthsSinceLastCollection;

      if (newMonthsCollected > durationInMonths) {
        throw new Error('All monthly returns have been collected');
      }

      // Update plan collection status
      await db.query(
        `UPDATE algo_smart_investment_plans 
         SET months_collected = ?,
             last_collection_date = CURRENT_TIMESTAMP,
             total_collected_amount = COALESCE(total_collected_amount, 0) + ?
         WHERE id = ?`,
        [newMonthsCollected, pendingAmount, planId]
      );

      // Add to user's wallet
      await db.query(
        `INSERT INTO user_wallet (user_id, balance) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE balance = balance + ?`,
        [userId, pendingAmount, pendingAmount]
      );

      // Fetch updated plan details
      const [updatedPlan] = await db.query(
        'SELECT * FROM algo_smart_investment_plans WHERE id = ?',
        [planId]
      );

      await db.commit();
      
      res.json({
        status: 'success',
        collected_amount: pendingAmount,
        months_collected: updatedPlan.months_collected,
        total_months: durationInMonths,
        new_balance: pendingAmount,
        plan: updatedPlan // Include updated plan data
      });
    }
    // ... rest of the existing code ...
  } catch (error) {
    await db.rollback();
    console.error('Error processing collection:', error);
    res.status(400).json({ error: error.message });
  }
});

// ...existing code...

// Add new endpoints for admin dashboard
app.get('/admin/plan-purchases', isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        u.username,
        u.email,
        CASE 
          WHEN p.table_source = 'algo_software_plans' THEN 'Algo Software'
          WHEN p.table_source = 'indicator_plans' THEN 'Indicator Plan'
          ELSE 'Algo Smart Investment'
        END as plan_type
      FROM (
        SELECT *, 'algo_software_plans' as table_source FROM algo_software_plans
        UNION ALL
        SELECT *, 'indicator_plans' as table_source FROM indicator_plans
        UNION ALL
        SELECT *, 'algo_smart_investment_plans' as table_source FROM algo_smart_investment_plans
      ) p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.purchase_date DESC
    `;
    
    const purchases = await db.query(query);
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching plan purchases:', error);
    res.status(500).json({ error: 'Failed to fetch plan purchases' });
  }
});

app.get('/admin/plan-upgrades', isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        u.username,
        u.email,
        old_plan.plan_name as old_plan_name,
        old_plan.plan_price as old_plan_price,
        old_plan.duration as previous_duration,
        pc.plan_name as new_plan_name,
        pc.base_price as new_plan_price,
        pc.duration as new_duration,
        DATEDIFF(
          DATE_ADD(old_plan.purchase_date, INTERVAL 
            CASE 
              WHEN old_plan.duration LIKE '%Month%' THEN CAST(SUBSTRING_INDEX(old_plan.duration, ' ', 1) AS SIGNED) 
              ELSE 18 
            END MONTH
          ),
          old_plan.upgrade_date
        ) as remaining_days,
        (pc.base_price - old_plan.plan_price) as price_difference
      FROM (
        SELECT *, 'algo_software_plans' as plan_type FROM algo_software_plans WHERE is_upgraded = 1
        UNION ALL
        SELECT *, 'indicator_plans' as plan_type FROM indicator_plans WHERE is_upgraded = 1
      ) p
      JOIN users u ON p.user_id = u.id
      JOIN plan_configurations pc ON p.upgraded_to = pc.id
      JOIN (
        SELECT id, plan_name, plan_price, duration, purchase_date, upgrade_date
        FROM algo_software_plans
        UNION ALL
        SELECT id, plan_name, plan_price, duration, purchase_date, upgrade_date
        FROM indicator_plans
      ) old_plan ON p.upgraded_from = old_plan.id
      ORDER BY p.upgrade_date DESC
    `;
    
    const upgrades = await db.query(query);
    res.json(upgrades);
  } catch (error) {
    console.error('Error fetching plan upgrades:', error);
    res.status(500).json({ error: 'Failed to fetch plan upgrades' });
  }
});

// Add endpoint to create duration promo code
app.post('/admin/duration-promo-codes', isAdmin, (req, res) => {
    const { code, valid_from, valid_until, applicable_plan_ids } = req.body;
    
    if (!code || !valid_from || !applicable_plan_ids || applicable_plan_ids.length === 0) {
        return res.status(400).json({ error: 'All fields are required and at least one plan must be selected' });
    }

    const sql = `INSERT INTO duration_promo_codes 
                 (code, valid_from, valid_until, applicable_plan_ids) 
                 VALUES (?, ?, ?, ?)`;

    db.query(sql, [
        code,
        valid_from,
        valid_until,
        JSON.stringify(applicable_plan_ids)
    ], (err, result) => {
        if (err) {
            console.error('Error creating promo code:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ status: 'Duration promo code created successfully' });
    });
});

// Validate duration promo code
app.post('/validate-duration-promo', isAuthenticated, async (req, res) => {
  try {
    const { code, subcategory } = req.body;

    // Check if code exists and is active
    const [promo] = await db.query(
      'SELECT * FROM duration_promo_codes WHERE code = ?',
      [code]
    );

    if (!promo) {
      return res.status(400).json({ error: 'Invalid or inactive promo code' });
    }

    // Validate dates
    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

    if (now < validFrom || (validUntil && now > validUntil)) {
      return res.status(400).json({ error: 'Promo code is not valid at this time' });
    }

    res.json({
      status: 'Valid promo code',
      reduction_amount: promo.reduction_days,
      reduction_unit: 'days'
    });
  } catch (err) {
    console.error('Error validating duration promo code:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ...existing code...

// Create duration_promo_codes table
const createDurationPromoCodeTable = `
CREATE TABLE IF NOT EXISTS duration_promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    reduction_days INT NOT NULL,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME,
    subcategory JSON,
    applicable_plan_ids JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createDurationPromoCodeTable, (err) => {
    if (err) console.error('Error creating duration promo codes table:', err);
    else console.log('Duration promo codes table checked/created');
});

// Get all duration promo codes 
app.get('/admin/duration-promo-codes', isAdmin, (req, res) => {
    db.query('SELECT * FROM duration_promo_codes ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Error fetching duration promo codes:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Create new duration promo code
app.post('/admin/duration-promo-codes', isAdmin, (req, res) => {
    const { code, reduction_days, valid_from, valid_until, subcategory, applicable_plan_ids } = req.body;

    if (!code || !reduction_days || !valid_from) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `
        INSERT INTO duration_promo_codes 
        (code, reduction_days, valid_from, valid_until, subcategory, applicable_plan_ids) 
        VALUES (?, ?, ?, ?, ?, ?)`;

    const values = [
        code.toUpperCase(),
        reduction_days,
        valid_from,
        valid_until || null,
        JSON.stringify(subcategory),
        JSON.stringify(applicable_plan_ids)
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error creating duration promo code:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ 
            id: result.insertId,
            message: 'Duration promo code created successfully' 
        });
    });
});

// Delete duration promo code
app.delete('/admin/duration-promo-codes/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM duration_promo_codes WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting duration promo code:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promo code not found' });
        }
        res.json({ message: 'Duration promo code deleted successfully' });
    });
});

// Update duration promo code
app.put('/admin/duration-promo-codes/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const { code, reduction_days, valid_from, valid_until, is_active, subcategory, applicable_plan_ids } = req.body;

    const sql = `
        UPDATE duration_promo_codes 
        SET code = ?, reduction_days = ?, valid_from = ?, valid_until = ?, 
            is_active = ?, subcategory = ?, applicable_plan_ids = ?
        WHERE id = ?`;

    const values = [
        code.toUpperCase(),
        reduction_days,
        valid_from,
        valid_until || null,
        is_active,
        JSON.stringify(subcategory),
        JSON.stringify(applicable_plan_ids),
        id
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating duration promo code:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promo code not found' });
        }
        res.json({ message: 'Duration promo code updated successfully' });
    });
});

// ...existing code...

app.put('/admin/duration-promo-codes/:id', isAdmin, (req, res) => {
  const { id } = req.params;
  const { code, reduction_days, valid_from, valid_until, subcategory, applicable_plan_ids } = req.body;

  const sql = `
    UPDATE duration_promo_codes 
    SET code = ?, reduction_days = ?, valid_from = ?, valid_until = ?, subcategory = ?, applicable_plan_ids = ?
    WHERE id = ?`;

  const values = [
    code.toUpperCase(),
    parseInt(reduction_days),
    valid_from,
    valid_until || null,
    JSON.stringify(subcategory || []),
    JSON.stringify(applicable_plan_ids || []),
    id
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating duration promo code:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    res.json({ message: 'Duration promo code updated successfully' });
  });
});

// Create duration promo code endpoint 
app.post('/admin/duration-promo-codes', isAdmin, (req, res) => {
  const { code, reduction_days, valid_from, valid_until, subcategory, applicable_plan_ids } = req.body;

  if (!code || !reduction_days || !valid_from) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO duration_promo_codes 
    (code, reduction_days, valid_from, valid_until, subcategory, applicable_plan_ids) 
    VALUES (?, ?, ?, ?, ?, ?)`;

  const values = [
    code.toUpperCase(),
    parseInt(reduction_days),
    valid_from,
    valid_until || null,
    JSON.stringify(subcategory || []),
    JSON.stringify(applicable_plan_ids || [])
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error creating duration promo code:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({
      id: result.insertId,
      message: 'Duration promo code created successfully'
    });
  });
});

// ...existing code...

app.get('/admin/duration-promo-codes', isAdmin, (req, res) => {
  const sql = 'SELECT * FROM duration_promo_codes ORDER BY created_at DESC';
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching duration promo codes:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Parse JSON fields for each promo code
    const formattedResults = results.map(promo => ({
      ...promo,
      subcategory: typeof promo.subcategory === 'string' ? 
        JSON.parse(promo.subcategory) : 
        promo.subcategory,
      applicable_plan_ids: typeof promo.applicable_plan_ids === 'string' ? 
        JSON.parse(promo.applicable_plan_ids) : 
        promo.applicable_plan_ids
    }));

    res.json(formattedResults);
  });
});

// Add reduction_days column to duration_promo_codes table if it doesn't exist
const alterDurationPromoTable = `
ALTER TABLE duration_promo_codes 
ADD COLUMN IF NOT EXISTS reduction_days INT NOT NULL DEFAULT 0`;

db.query(alterDurationPromoTable, (err) => {
  if (err) console.error('Error altering duration_promo_codes table:', err);
  else console.log('Duration promo codes table updated successfully');
});

// Update duration promo code endpoint
app.put('/admin/duration-promo-codes/:id', isAdmin, (req, res) => {
  const { id } = req.params;
  const { code, reduction_days, valid_from, valid_until, subcategory, applicable_plan_ids } = req.body;
  
  if (!code || !reduction_days || !valid_from) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    UPDATE duration_promo_codes 
    SET code = ?, reduction_days = ?, valid_from = ?, valid_until = ?, subcategory = ?, applicable_plan_ids = ?
    WHERE id = ?`;

  const values = [
    code.toUpperCase(),
    parseInt(reduction_days),
    valid_from,
    valid_until || null,
    JSON.stringify(subcategory || []),
    JSON.stringify(applicable_plan_ids || []),
    id
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating duration promo code:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    res.json({ message: 'Duration promo code updated successfully' });
  });
});

// ...existing code...

// Add subcategory column to duration_promo_codes table if it doesn't exist
const alterDurationPromoTableForSubcategory = `
ALTER TABLE duration_promo_codes 
ADD COLUMN IF NOT EXISTS subcategory JSON DEFAULT NULL`;

db.query(alterDurationPromoTableForSubcategory, (err) => {
  if (err) console.error('Error altering duration_promo_codes table for subcategory:', err);
  else console.log('Duration promo codes table updated with subcategory column successfully');
});

// ...existing code...

// Update the validate duration promo endpoint
app.post('/validate-duration-promo', isAuthenticated, async (req, res) => {
  try {
    const { code, subcategory } = req.body;
    console.log('Validating duration promo code:', code);

    // Get promo code without status check since all codes are active
    const [promo] = await db.query(
      'SELECT * FROM duration_promo_codes WHERE code = ?',
      [code]
    );

    if (!promo) {
      console.log('Promo code not found:', code);
      return res.status(400).json({ error: 'Invalid promo code' });
    }

    // Validate dates
    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

    if (now < validFrom) {
      return res.status(400).json({ 
        error: 'This promo code is not active yet',
        valid_from: validFrom
      });
    }

    if (validUntil && now > validUntil) {
      return res.status(400).json({ 
        error: 'This promo code has expired',
        valid_until: validUntil
      });
    }

    // Success response
    res.json({
      status: 'Valid promo code',
      reduction_amount: promo.reduction_days,
      reduction_unit: 'days'
    });

  } catch (err) {
    console.error('Error validating duration promo code:', err);
    res.status(500).json({ error: 'Server error validating promo code' });
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
