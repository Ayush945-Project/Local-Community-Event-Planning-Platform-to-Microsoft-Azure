import { runScript } from './db.js';

const sqliteDDL = `
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT CHECK(role IN ('organizer', 'volunteer', 'attendee')) NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organizer_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  date_time DATETIME NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  banner_url TEXT,
  status TEXT CHECK(status IN ('Draft', 'Published', 'Completed', 'Cancelled')) DEFAULT 'Draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS Registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('Registered', 'Waitlisted')) DEFAULT 'Registered',
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES Events(id),
  FOREIGN KEY (user_id) REFERENCES Users(id),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS VolunteerRoles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  shift_time TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  description TEXT,
  FOREIGN KEY (event_id) REFERENCES Events(id)
);

CREATE TABLE IF NOT EXISTS VolunteerAssignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('Assigned', 'Completed', 'Cancelled')) DEFAULT 'Assigned',
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES VolunteerRoles(id),
  FOREIGN KEY (user_id) REFERENCES Users(id),
  UNIQUE(role_id, user_id)
);

CREATE TABLE IF NOT EXISTS Announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES Events(id)
);
`;

const azureDDL = `
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    phone NVARCHAR(50),
    role NVARCHAR(50) CHECK(role IN ('organizer', 'volunteer', 'attendee')) NOT NULL,
    password NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
  );
END;

IF OBJECT_ID('dbo.Events', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Events (
    id INT IDENTITY(1,1) PRIMARY KEY,
    organizer_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(100) NOT NULL,
    date_time DATETIME NOT NULL,
    location NVARCHAR(500) NOT NULL,
    capacity INT NOT NULL,
    banner_url NVARCHAR(2000),
    status NVARCHAR(50) CHECK(status IN ('Draft', 'Published', 'Completed', 'Cancelled')) DEFAULT 'Draft',
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (organizer_id) REFERENCES dbo.Users(id)
  );
END;

IF OBJECT_ID('dbo.Registrations', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Registrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status NVARCHAR(50) CHECK(status IN ('Registered', 'Waitlisted')) DEFAULT 'Registered',
    registered_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (event_id) REFERENCES dbo.Events(id),
    FOREIGN KEY (user_id) REFERENCES dbo.Users(id),
    CONSTRAINT UQ_Event_User UNIQUE(event_id, user_id)
  );
END;

IF OBJECT_ID('dbo.VolunteerRoles', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.VolunteerRoles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    event_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    shift_time NVARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    description NVARCHAR(MAX),
    FOREIGN KEY (event_id) REFERENCES dbo.Events(id)
  );
END;

IF OBJECT_ID('dbo.VolunteerAssignments', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.VolunteerAssignments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    role_id INT NOT NULL,
    user_id INT NOT NULL,
    status NVARCHAR(50) CHECK(status IN ('Assigned', 'Completed', 'Cancelled')) DEFAULT 'Assigned',
    assigned_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (role_id) REFERENCES dbo.VolunteerRoles(id),
    FOREIGN KEY (user_id) REFERENCES dbo.Users(id),
    CONSTRAINT UQ_Role_User UNIQUE(role_id, user_id)
  );
END;

IF OBJECT_ID('dbo.Announcements', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Announcements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    event_id INT NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    sent_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (event_id) REFERENCES dbo.Events(id)
  );
END;
`;

export async function initializeDatabase() {
  const isAzure = process.env.AZURE_SQL_CONNECTIONSTRING || 
                  (process.env.DB_SERVER && process.env.DB_DATABASE);
                  
  const ddl = isAzure ? azureDDL : sqliteDDL;
  
  try {
    console.log('Initializing database schema...');
    // Split the script into separate statements for SQLite or run as batch if Azure
    if (isAzure) {
      await runScript(ddl);
    } else {
      // Split by semicolon and run sequentially
      const statements = ddl
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
        
      for (const statement of statements) {
        await runScript(statement);
      }
    }
    console.log('Database schema initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database schema:', err);
    throw err;
  }
}
