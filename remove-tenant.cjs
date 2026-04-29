const fs = require('fs');

const files = [
  'src/pages/Customers.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Employees.tsx',
  'src/pages/Inventory.tsx',
  'src/pages/Ledger.tsx',
  'src/pages/Payroll.tsx',
  'src/pages/Purchases.tsx',
  'src/pages/Reports.tsx',
  'src/pages/Sales.tsx',
  'src/pages/Users.tsx',
  'src/pages/Vendors.tsx',
  'src/context/BranchContext.tsx'
];

files.forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  
  // Clean single 'enum' query patterns
  text = text.replace(/} else {\s+q = query\(q, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+}/g, '}');
  text = text.replace(/} else {\s+empQ = query\(collection\(db, 'employees'\), where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+}/g, '}');
  text = text.replace(/} else {\s+slipQ = query\(collection\(db, 'payroll'\), where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\), orderBy\('date', 'desc'\)\);\s+}/g, '}');

  // Dashboard
  text = text.replace(/} else {\s+salesQuery = query\(salesQuery, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+purchaseQuery = query\(purchaseQuery, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+inventoryQuery = query\(inventoryQuery, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+}/g, '}');

  // Sales
  text = text.replace(/} else {\s+q = query\(q, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+invQ = query\(invQ, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+custQ = query\(custQ, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+}/g, '}');

  // Ledger
  text = text.replace(/} else {\s+q = query\(q, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+custQ = query\(custQ, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+vendQ = query\(vendQ, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+}/g, '}');

  // Purchases
  text = text.replace(/} else {\s+q = query\(q, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+invQ = query\(invQ, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+venQ = query\(venQ, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+}/g, '}');

  // Reports
  text = text.replace(/} else {\s+qSales = query\(qSales, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+qPurchases = query\(qPurchases, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+qInventory = query\(qInventory, where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\);\s+}/g, '}');

  // Employees
  text = text.replace(/\? query\(collection\(db, 'employees'\), where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\)\)/g, "? collection(db, 'employees')");
  text = text.replace(/query\(collection\(db, 'ledger'\), where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\), where/g, "query(collection(db, 'ledger'), where");
  text = text.replace(/query\(collection\(db, 'payroll'\), where\('tenantId', '==', user\?\.tenantId \|\| user\?\.uid\), where/g, "query(collection(db, 'payroll'), where");

  // Users
  text = text.replace(/let q = query\(collection\(db, 'users'\), where\('tenantId', '==', user\.tenantId \|\| user\.uid\)\);/g, "let q: any = collection(db, 'users');");

  // BranchContext
  text = text.replace(/const q = query\(collection\(db, 'branches'\), where\('tenantId', '==', user\.tenantId \|\| user\.uid\)\);/g, "const q = collection(db, 'branches');");

  fs.writeFileSync(file, text);
});
console.log("Done");
