import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'fmcl.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','tech_manager','senior_manager','finance_manager','managing_director','staff')),
      building_id INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT
    );

    CREATE TABLE IF NOT EXISTS employee_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      building_id INTEGER NOT NULL REFERENCES buildings(id),
      category_id INTEGER NOT NULL REFERENCES employee_categories(id),
      join_date TEXT NOT NULL,
      leave_date TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','left','terminated')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS item_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES item_categories(id),
      vendor_id INTEGER REFERENCES vendors(id),
      size TEXT,
      unit TEXT DEFAULT 'piece',
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 20,
      unit_cost REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES inventory_items(id),
      type TEXT NOT NULL CHECK(type IN ('in','out','return','adjustment')),
      quantity INTEGER NOT NULL,
      reference_id INTEGER,
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      item_id INTEGER NOT NULL REFERENCES inventory_items(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      allocation_date TEXT NOT NULL,
      return_date TEXT,
      status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued','returned','deducted')),
      issued_by INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deductions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      allocation_id INTEGER REFERENCES allocations(id),
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      tenure_days INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processed','waived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS procurement_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES inventory_items(id),
      quantity_requested INTEGER NOT NULL,
      justification TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','approved','rejected','ordered','received')),
      requested_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      procurement_id INTEGER NOT NULL REFERENCES procurement_requests(id),
      step INTEGER NOT NULL,
      role TEXT NOT NULL,
      approver_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','waiting','cancelled')),
      comments TEXT,
      actioned_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed initial data if empty
  const count = (db.prepare('SELECT COUNT(*) as c FROM buildings').get() as { c: number }).c;
  if (count === 0) seedData(db);
}

function seedData(db: Database.Database) {
  const bcrypt = require('bcryptjs');

  // Buildings
  const buildings = [
    'Building A','Building B','Building C','Building D','Building E',
    'Building F','Building G','Building H','Building I','Building J'
  ];
  const insertBuilding = db.prepare('INSERT INTO buildings (name, location) VALUES (?, ?)');
  buildings.forEach(b => insertBuilding.run(b, 'Hyderabad'));

  // Employee categories
  const cats = ['Mechanical','Electrical','Plumbing','Electrician','HVAC Technician','Housekeeper','Pantry Staff'];
  const insertCat = db.prepare('INSERT INTO employee_categories (name) VALUES (?)');
  cats.forEach(c => insertCat.run(c));

  // Item categories
  const itemCats = ['Uniform Dress','Footwear','Safety Equipment','Tools','Accessories'];
  const insertItemCat = db.prepare('INSERT INTO item_categories (name) VALUES (?)');
  itemCats.forEach(c => insertItemCat.run(c));

  // Default vendor
  db.prepare('INSERT INTO vendors (name, contact_person, email, phone) VALUES (?,?,?,?)').run(
    'Universal Uniforms Ltd', 'Rajesh Kumar', 'rajesh@uul.com', '+91-9876543210'
  );

  // Inventory items
  const items = [
    { name: 'Work Dress (Blue)', category_id: 1, size: 'M', unit_cost: 450, stock_quantity: 150, vendor_id: 1 },
    { name: 'Work Dress (Blue)', category_id: 1, size: 'L', unit_cost: 450, stock_quantity: 120, vendor_id: 1 },
    { name: 'Work Dress (Blue)', category_id: 1, size: 'XL', unit_cost: 450, stock_quantity: 80, vendor_id: 1 },
    { name: 'Safety Shoes', category_id: 2, size: '7', unit_cost: 850, stock_quantity: 60, vendor_id: 1 },
    { name: 'Safety Shoes', category_id: 2, size: '8', unit_cost: 850, stock_quantity: 75, vendor_id: 1 },
    { name: 'Safety Shoes', category_id: 2, size: '9', unit_cost: 850, stock_quantity: 50, vendor_id: 1 },
    { name: 'Safety Shoes', category_id: 2, size: '10', unit_cost: 850, stock_quantity: 30, vendor_id: 1 },
    { name: 'Hard Hat', category_id: 3, size: 'Universal', unit_cost: 200, stock_quantity: 100, vendor_id: 1 },
    { name: 'Safety Vest', category_id: 3, size: 'Universal', unit_cost: 150, stock_quantity: 90, vendor_id: 1 },
  ];
  const insertItem = db.prepare(
    'INSERT INTO inventory_items (name, category_id, vendor_id, size, unit_cost, stock_quantity) VALUES (?,?,?,?,?,?)'
  );
  items.forEach(i => insertItem.run(i.name, i.category_id, i.vendor_id, i.size, i.unit_cost, i.stock_quantity));

  // Admin user
  const hash = bcrypt.hashSync('Admin@123', 10);
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)').run(
    'System Admin', 'admin@fmcl.com', hash, 'admin'
  );

  // Sample role users
  const roleUsers = [
    { name: 'Ramya Reddy', email: 'tech.manager@fmcl.com', role: 'tech_manager' },
    { name: 'Satyanarayana P', email: 'senior.manager@fmcl.com', role: 'senior_manager' },
    { name: 'Finance Head', email: 'finance.manager@fmcl.com', role: 'finance_manager' },
    { name: 'Managing Director', email: 'md@fmcl.com', role: 'managing_director' },
  ];
  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)');
  roleUsers.forEach(u => insertUser.run(u.name, u.email, bcrypt.hashSync('Pass@123', 10), u.role));
}
