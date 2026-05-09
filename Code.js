/**
 * LOKARA - Local Marketplace Application (FIXED VERSION)
 * Solusi UMKM di Sekitarmu (Radius 1 KM)
 * 
 * Backend: Google Apps Script
 * Database: Google Sheets
 * Version: 2.0 (Fixed - May 2026)
 */

// ==================== KONFIGURASI ====================
const CONFIG = {
  SHEET_ID: '1112KgB4JI93YqU8qqyMKpl41AUmlFWB6B60rm4rIPgo', // Ganti dengan ID Spreadsheet Anda
  MAX_DISTANCE_KM: 1, // Radius maksimal 1 KM
  EARTH_RADIUS_KM: 6371,
  ADMIN_EMAIL: 'admin@lokara.id'
};

// ==================== SHEET NAMES ====================
const SHEETS = {
  USERS: 'Users',
  PRODUCTS: 'Products',
  ORDERS: 'Orders',
  ORDER_ITEMS: 'OrderItems',
  REVIEWS: 'Reviews',
  CATEGORIES: 'Categories',
  CHATS: 'Chats',
  WISHLIST: 'Wishlist',
  NOTIFICATIONS: 'Notifications'
};

// ==================== DO GET ====================
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('LOKARA - Solusi UMKM di Sekitarmu')
    .setFaviconUrl('https://cdn-icons-png.flaticon.com/512/684/684908.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== DO POST (API Endpoint) ====================
function doPost(e) {
  try {
    let action, data;

    if (e.postData && e.postData.contents) {
      const payload = JSON.parse(e.postData.contents);
      action = payload.action;
      data = payload.data || {};
    } else if (e.parameter && e.parameter.action) {
      action = e.parameter.action;
      data = e.parameter.data ? JSON.parse(e.parameter.data) : {};
    } else {
      throw new Error('Invalid request: missing action or data');
    }

    Logger.log('doPost called with action: ' + action);
    Logger.log('Data keys: ' + Object.keys(data).join(', '));

    const result = processRequest(action, data);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== MAIN PROCESSOR ====================
function processRequest(action, data) {
  if (!action || typeof action !== 'string') {
    throw new Error('Action is required and must be a string');
  }

  if (!data || typeof data !== 'object') {
    data = {};
  }

  Logger.log('Processing action: ' + action);

  switch(action) {
    case 'register': return registerUser(data);
    case 'login': return loginUser(data);
    case 'getProfile': return getUserProfile(data);
    case 'updateProfile': return updateUserProfile(data);
    case 'updateProfilePhoto': return updateProfilePhoto(data);
    case 'addProduct': return addProduct(data);
    case 'editProduct': return editProduct(data);
    case 'deleteProduct': return deleteProduct(data);
    case 'getProducts': return getProducts(data);
    case 'getProductDetail': return getProductDetail(data);
    case 'getNearbyProducts': return getNearbyProducts(data);
    case 'createOrder': return createOrder(data);
    case 'getOrders': return getOrders(data);
    case 'updateOrderStatus': return updateOrderStatus(data);
    case 'addReview': return addReview(data);
    case 'getReviews': return getReviews(data);
    case 'toggleWishlist': return toggleWishlist(data);
    case 'getWishlist': return getWishlist(data);
    case 'sendMessage': return sendMessage(data);
    case 'getMessages': return getMessages(data);
    case 'getCategories': return getCategories();
    case 'getNotifications': return getNotifications(data);
    case 'markNotificationRead': return markNotificationRead(data);
    case 'searchProducts': return searchProducts(data);
    case 'getSellerProducts': return getSellerProducts(data);
    case 'getDashboardStats': return getDashboardStats(data);
    default: throw new Error('Action tidak dikenali: ' + action);
  }
}

// ==================== HELPER FUNCTIONS ====================
function getSheet(sheetName) {
  try {
    let ss;
    if (CONFIG.SHEET_ID && CONFIG.SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
      ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    } else {
      // Fallback: use the active spreadsheet (useful during development)
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    if (!ss) {
      throw new Error('Spreadsheet tidak ditemukan. Pastikan SHEET_ID sudah dikonfigurasi atau script dijalankan dari Spreadsheet.');
    }
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      initializeSheetHeaders(sheet, sheetName);
    }
    return sheet;
  } catch(e) {
    throw new Error('Gagal mengakses sheet ' + sheetName + ': ' + e.toString());
  }
}

function initializeSheetHeaders(sheet, sheetName) {
  const headers = {
    'Users': ['ID', 'Nama', 'Email', 'Password', 'Telepon', 'Role', 'Latitude', 'Longitude', 'Alamat', 'Foto', 'Status', 'CreatedAt', 'UpdatedAt'],
    'Products': ['ID', 'SellerID', 'Nama', 'Deskripsi', 'Harga', 'Stok', 'Kategori', 'Foto', 'Latitude', 'Longitude', 'Alamat', 'Status', 'CreatedAt', 'UpdatedAt'],
    'Orders': ['ID', 'BuyerID', 'SellerID', 'Total', 'Status', 'AlamatPengiriman', 'Latitude', 'Longitude', 'MetodePembayaran', 'CreatedAt', 'UpdatedAt'],
    'OrderItems': ['ID', 'OrderID', 'ProductID', 'Quantity', 'HargaSatuan', 'Subtotal'],
    'Reviews': ['ID', 'ProductID', 'BuyerID', 'Rating', 'Komentar', 'CreatedAt'],
    'Categories': ['ID', 'Nama', 'Icon', 'Status'],
    'Chats': ['ID', 'SenderID', 'ReceiverID', 'Pesan', 'CreatedAt', 'IsRead'],
    'Wishlist': ['ID', 'UserID', 'ProductID', 'CreatedAt'],
    'Notifications': ['ID', 'UserID', 'Judul', 'Pesan', 'Type', 'IsRead', 'CreatedAt']
  };

  if (headers[sheetName]) {
    sheet.getRange(1, 1, 1, headers[sheetName].length).setValues([headers[sheetName]]);
    sheet.getRange(1, 1, 1, headers[sheetName].length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers[sheetName].length).setBackground('#1B5E20');
    sheet.getRange(1, 1, 1, headers[sheetName].length).setFontColor('#FFFFFF');
  }
}

function generateId() {
  return Utilities.getUuid();
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password harus diisi');
  }
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return digest.map(function(byte) {
    return (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0');
  }).join('');
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = CONFIG.EARTH_RADIUS_KM;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ==================== AUTHENTICATION ====================
function registerUser(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Data registrasi tidak valid');
  }
  if (!data.nama || data.nama.trim() === '') {
    throw new Error('Nama harus diisi');
  }
  if (!data.email || data.email.trim() === '') {
    throw new Error('Email harus diisi');
  }
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) {
    throw new Error('Format email tidak valid');
  }
  if (!data.password || data.password.trim() === '') {
    throw new Error('Password harus diisi');
  }
  if (data.password.length < 6) {
    throw new Error('Password minimal 6 karakter');
  }

  const sheet = getSheet(SHEETS.USERS);
  const users = sheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {
    if (users[i][2] === data.email) {
      throw new Error('Email sudah terdaftar');
    }
  }

  const id = generateId();
  const hashedPassword = hashPassword(data.password);
  const timestamp = getCurrentTimestamp();

  sheet.appendRow([
    id, data.nama.trim(), data.email.trim(), hashedPassword, data.telepon || '',
    data.role || 'buyer', data.latitude || '', data.longitude || '',
    data.alamat || '', data.foto || '', 'active', timestamp, timestamp
  ]);

  try {
    addNotification({
      userId: id,
      judul: 'Selamat Datang di LOKARA!',
      pesan: 'Akun Anda berhasil dibuat. Mulai jelajahi UMKM di sekitar Anda.',
      type: 'welcome'
    });
  } catch(e) {
    Logger.log('Failed to send welcome notification: ' + e.toString());
  }

  return { id: id, nama: data.nama, email: data.email, role: data.role || 'buyer' };
}

function loginUser(data) {
  if (!data || !data.email || !data.password) {
    throw new Error('Email dan password harus diisi');
  }

  const sheet = getSheet(SHEETS.USERS);
  const users = sheet.getDataRange().getValues();
  const hashedPassword = hashPassword(data.password);

  for (let i = 1; i < users.length; i++) {
    if (users[i][2] === data.email && users[i][3] === hashedPassword) {
      if (users[i][10] !== 'active') {
        throw new Error('Akun Anda dinonaktifkan');
      }
      return {
        id: users[i][0],
        nama: users[i][1],
        email: users[i][2],
        telepon: users[i][4],
        role: users[i][5],
        latitude: users[i][6],
        longitude: users[i][7],
        alamat: users[i][8],
        foto: users[i][9]
      };
    }
  }

  throw new Error('Email atau password salah');
}

function getUserProfile(data) {
  if (!data || !data.userId) {
    throw new Error('User ID diperlukan');
  }

  const sheet = getSheet(SHEETS.USERS);
  const users = sheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === data.userId) {
      return {
        id: users[i][0],
        nama: users[i][1],
        email: users[i][2],
        telepon: users[i][4],
        role: users[i][5],
        latitude: users[i][6],
        longitude: users[i][7],
        alamat: users[i][8],
        foto: users[i][9],
        status: users[i][10]
      };
    }
  }

  throw new Error('User tidak ditemukan');
}

function updateUserProfile(data) {
  if (!data || !data.userId) {
    throw new Error('User ID diperlukan');
  }

  const sheet = getSheet(SHEETS.USERS);
  const users = sheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === data.userId) {
      const row = i + 1;
      if (data.nama) sheet.getRange(row, 2).setValue(data.nama);
      if (data.telepon) sheet.getRange(row, 5).setValue(data.telepon);
      if (data.latitude) sheet.getRange(row, 7).setValue(data.latitude);
      if (data.longitude) sheet.getRange(row, 8).setValue(data.longitude);
      if (data.alamat) sheet.getRange(row, 9).setValue(data.alamat);
      if (data.foto) sheet.getRange(row, 10).setValue(data.foto);
      sheet.getRange(row, 13).setValue(getCurrentTimestamp());

      return { success: true, message: 'Profil berhasil diperbarui' };
    }
  }

  throw new Error('User tidak ditemukan');
}

function updateProfilePhoto(data) {
  if (!data || !data.userId) {
    throw new Error('User ID diperlukan');
  }
  if (!data.foto) {
    throw new Error('Data foto diperlukan');
  }

  const sheet = getSheet(SHEETS.USERS);
  const users = sheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === data.userId) {
      sheet.getRange(i + 1, 10).setValue(data.foto);
      sheet.getRange(i + 1, 13).setValue(getCurrentTimestamp());
      return { success: true, foto: data.foto };
    }
  }

  throw new Error('User tidak ditemukan');
}
function addProduct(data) {
  if (!data || !data.sellerId || !data.nama || !data.harga || data.stok === undefined || !data.kategori) {
    throw new Error('Data produk tidak lengkap. Diperlukan: sellerId, nama, harga, stok, kategori');
  }

  const sheet = getSheet(SHEETS.PRODUCTS);
  const id = generateId();
  const timestamp = getCurrentTimestamp();

  sheet.appendRow([
    id, data.sellerId, data.nama.trim(), data.deskripsi || '', parseFloat(data.harga),
    parseInt(data.stok), data.kategori, data.foto || '', data.latitude || '',
    data.longitude || '', data.alamat || '', 'active', timestamp, timestamp
  ]);

  return { id: id, message: 'Produk berhasil ditambahkan' };
}

function editProduct(data) {
  if (!data || !data.productId || !data.sellerId) {
    throw new Error('Product ID dan Seller ID diperlukan');
  }

  const sheet = getSheet(SHEETS.PRODUCTS);
  const products = sheet.getDataRange().getValues();

  for (let i = 1; i < products.length; i++) {
    if (products[i][0] === data.productId && products[i][1] === data.sellerId) {
      const row = i + 1;
      if (data.nama) sheet.getRange(row, 3).setValue(data.nama);
      if (data.deskripsi) sheet.getRange(row, 4).setValue(data.deskripsi);
      if (data.harga) sheet.getRange(row, 5).setValue(parseFloat(data.harga));
      if (data.stok !== undefined) sheet.getRange(row, 6).setValue(parseInt(data.stok));
      if (data.kategori) sheet.getRange(row, 7).setValue(data.kategori);
      if (data.foto) sheet.getRange(row, 8).setValue(data.foto);
      if (data.status) sheet.getRange(row, 12).setValue(data.status);
      sheet.getRange(row, 14).setValue(getCurrentTimestamp());

      return { success: true, message: 'Produk berhasil diperbarui' };
    }
  }

  throw new Error('Produk tidak ditemukan atau Anda bukan pemiliknya');
}

function deleteProduct(data) {
  if (!data || !data.productId || !data.sellerId) {
    throw new Error('Product ID dan Seller ID diperlukan');
  }

  const sheet = getSheet(SHEETS.PRODUCTS);
  const products = sheet.getDataRange().getValues();

  for (let i = 1; i < products.length; i++) {
    if (products[i][0] === data.productId && products[i][1] === data.sellerId) {
      sheet.getRange(i + 1, 12).setValue('deleted');
      return { success: true, message: 'Produk berhasil dihapus' };
    }
  }

  throw new Error('Produk tidak ditemukan atau Anda bukan pemiliknya');
}

function getProducts(data) {
  const sheet = getSheet(SHEETS.PRODUCTS);
  const products = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < products.length; i++) {
    if (products[i][11] === 'active') {
      result.push({
        id: products[i][0],
        sellerId: products[i][1],
        nama: products[i][2],
        deskripsi: products[i][3],
        harga: products[i][4],
        stok: products[i][5],
        kategori: products[i][6],
        foto: products[i][7],
        latitude: products[i][8],
        longitude: products[i][9],
        alamat: products[i][10],
        createdAt: products[i][12]
      });
    }
  }

  return result;
}

function getProductDetail(data) {
  if (!data || !data.productId) {
    throw new Error('Product ID diperlukan');
  }

  const sheet = getSheet(SHEETS.PRODUCTS);
  const products = sheet.getDataRange().getValues();

  for (let i = 1; i < products.length; i++) {
    if (products[i][0] === data.productId) {
      let seller = { nama: 'Unknown', foto: '' };
      try {
        seller = getUserProfile({ userId: products[i][1] });
      } catch(e) {
        Logger.log('Seller not found for product: ' + data.productId);
      }

      let reviews = [];
      try {
        reviews = getReviews({ productId: data.productId });
      } catch(e) {
        Logger.log('No reviews for product: ' + data.productId);
      }

      return {
        id: products[i][0],
        sellerId: products[i][1],
        sellerNama: seller.nama,
        sellerFoto: seller.foto,
        nama: products[i][2],
        deskripsi: products[i][3],
        harga: products[i][4],
        stok: products[i][5],
        kategori: products[i][6],
        foto: products[i][7],
        latitude: products[i][8],
        longitude: products[i][9],
        alamat: products[i][10],
        createdAt: products[i][12],
        reviews: reviews
      };
    }
  }

  throw new Error('Produk tidak ditemukan');
}

function getNearbyProducts(data) {
  if (!data || !data.latitude || !data.longitude) {
    throw new Error('Latitude dan longitude diperlukan');
  }

  const sheet = getSheet(SHEETS.PRODUCTS);
  const products = sheet.getDataRange().getValues();
  const userLat = parseFloat(data.latitude);
  const userLon = parseFloat(data.longitude);
  const result = [];

  for (let i = 1; i < products.length; i++) {
    if (products[i][11] === 'active' && products[i][8] && products[i][9]) {
      const distance = calculateDistance(
        userLat, userLon,
        parseFloat(products[i][8]), parseFloat(products[i][9])
      );

      if (distance <= CONFIG.MAX_DISTANCE_KM) {
        let seller = { nama: 'Unknown', foto: '' };
        try {
          seller = getUserProfile({ userId: products[i][1] });
        } catch(e) {
          Logger.log('Seller not found: ' + products[i][1]);
        }

        result.push({
          id: products[i][0],
          sellerId: products[i][1],
          sellerNama: seller.nama,
          sellerFoto: seller.foto,
          nama: products[i][2],
          deskripsi: products[i][3],
          harga: products[i][4],
          stok: products[i][5],
          kategori: products[i][6],
          foto: products[i][7],
          latitude: products[i][8],
          longitude: products[i][9],
          alamat: products[i][10],
          distance: distance.toFixed(2),
          createdAt: products[i][12]
        });
      }
    }
  }

  result.sort(function(a, b) {
    return parseFloat(a.distance) - parseFloat(b.distance);
  });

  return result;
}

function searchProducts(data) {
  if (!data || !data.keyword) {
    return getProducts(data);
  }

  const sheet = getSheet(SHEETS.PRODUCTS);
  const products = sheet.getDataRange().getValues();
  const keyword = data.keyword.toLowerCase();
  const result = [];

  for (let i = 1; i < products.length; i++) {
    if (products[i][11] === 'active') {
      const nama = (products[i][2] || '').toLowerCase();
      const deskripsi = (products[i][3] || '').toLowerCase();
      const kategori = (products[i][6] || '').toLowerCase();

      if (nama.includes(keyword) || deskripsi.includes(keyword) || kategori.includes(keyword)) {
        result.push({
          id: products[i][0],
          sellerId: products[i][1],
          nama: products[i][2],
          deskripsi: products[i][3],
          harga: products[i][4],
          stok: products[i][5],
          kategori: products[i][6],
          foto: products[i][7],
          latitude: products[i][8],
          longitude: products[i][9],
          alamat: products[i][10]
        });
      }
    }
  }

  return result;
}

function getSellerProducts(data) {
  if (!data || !data.sellerId) {
    throw new Error('Seller ID diperlukan');
  }

  const sheet = getSheet(SHEETS.PRODUCTS);
  const products = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < products.length; i++) {
    if (products[i][1] === data.sellerId && products[i][11] !== 'deleted') {
      result.push({
        id: products[i][0],
        nama: products[i][2],
        deskripsi: products[i][3],
        harga: products[i][4],
        stok: products[i][5],
        kategori: products[i][6],
        foto: products[i][7],
        status: products[i][11],
        createdAt: products[i][12]
      });
    }
  }

  return result;
}

// ==================== ORDERS ====================
function createOrder(data) {
  if (!data || !data.buyerId || !data.sellerId || !data.items || !Array.isArray(data.items)) {
    throw new Error('Data pesanan tidak lengkap');
  }

  const orderSheet = getSheet(SHEETS.ORDERS);
  const orderItemsSheet = getSheet(SHEETS.ORDER_ITEMS);
  const productSheet = getSheet(SHEETS.PRODUCTS);

  const orderId = generateId();
  const timestamp = getCurrentTimestamp();

  let total = 0;
  for (let j = 0; j < data.items.length; j++) {
    const item = data.items[j];
    const products = productSheet.getDataRange().getValues();
    let found = false;

    for (let i = 1; i < products.length; i++) {
      if (products[i][0] === item.productId) {
        if (products[i][5] < item.quantity) {
          throw new Error('Stok ' + products[i][2] + ' tidak mencukupi');
        }
        total += products[i][4] * item.quantity;
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error('Produk tidak ditemukan: ' + item.productId);
    }
  }

  orderSheet.appendRow([
    orderId, data.buyerId, data.sellerId, total, 'pending',
    data.alamatPengiriman || '', data.latitude || '', data.longitude || '',
    data.metodePembayaran || 'COD', timestamp, timestamp
  ]);

  for (let j = 0; j < data.items.length; j++) {
    const item = data.items[j];
    const products = productSheet.getDataRange().getValues();

    for (let i = 1; i < products.length; i++) {
      if (products[i][0] === item.productId) {
        const hargaSatuan = products[i][4];
        const subtotal = hargaSatuan * item.quantity;

        orderItemsSheet.appendRow([
          generateId(), orderId, item.productId, item.quantity, hargaSatuan, subtotal
        ]);

        const newStock = products[i][5] - item.quantity;
        productSheet.getRange(i + 1, 6).setValue(newStock);
        break;
      }
    }
  }

  try {
    addNotification({
      userId: data.sellerId,
      judul: 'Pesanan Baru!',
      pesan: 'Anda memiliki pesanan baru dengan total Rp ' + total.toLocaleString('id-ID'),
      type: 'order'
    });
  } catch(e) {
    Logger.log('Failed to send notification: ' + e.toString());
  }

  return { orderId: orderId, total: total, message: 'Pesanan berhasil dibuat' };
}

function getOrders(data) {
  if (!data || !data.userId) {
    throw new Error('User ID diperlukan');
  }

  const orderSheet = getSheet(SHEETS.ORDERS);
  const orders = orderSheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < orders.length; i++) {
    if (orders[i][1] === data.userId || orders[i][2] === data.userId) {

      const orderItemsSheet = getSheet(SHEETS.ORDER_ITEMS);
      const items = orderItemsSheet.getDataRange().getValues();
      const orderItems = [];

      for (let j = 1; j < items.length; j++) {
        if (items[j][1] === orders[i][0]) {
          let productNama = 'Produk';
          let productFoto = '';
          try {
            const product = getProductDetail({ productId: items[j][2] });
            productNama = product.nama;
            productFoto = product.foto;
          } catch(e) {
            Logger.log('Product not found: ' + items[j][2]);
          }

          orderItems.push({
            id: items[j][0],
            productId: items[j][2],
            productNama: productNama,
            productFoto: productFoto,
            quantity: items[j][3],
            hargaSatuan: items[j][4],
            subtotal: items[j][5]
          });
        }
      }

      let buyerNama = 'Unknown';
      let sellerNama = 'Unknown';
      try {
        const buyer = getUserProfile({ userId: orders[i][1] });
        buyerNama = buyer.nama;
      } catch(e) {}

      try {
        const seller = getUserProfile({ userId: orders[i][2] });
        sellerNama = seller.nama;
      } catch(e) {}

      result.push({
        id: orders[i][0],
        buyerId: orders[i][1],
        buyerNama: buyerNama,
        sellerId: orders[i][2],
        sellerNama: sellerNama,
        total: orders[i][3],
        status: orders[i][4],
        alamatPengiriman: orders[i][5],
        metodePembayaran: orders[i][8],
        items: orderItems,
        createdAt: orders[i][9]
      });
    }
  }

  return result;
}

function updateOrderStatus(data) {
  if (!data || !data.orderId || !data.status) {
    throw new Error('Order ID dan status diperlukan');
  }

  const sheet = getSheet(SHEETS.ORDERS);
  const orders = sheet.getDataRange().getValues();

  for (let i = 1; i < orders.length; i++) {
    if (orders[i][0] === data.orderId) {
      const row = i + 1;
      sheet.getRange(row, 5).setValue(data.status);
      sheet.getRange(row, 11).setValue(getCurrentTimestamp());

      try {
        const notifyUserId = data.status === 'completed' ? orders[i][1] : orders[i][2];
        addNotification({
          userId: notifyUserId,
          judul: 'Update Pesanan',
          pesan: 'Pesanan ' + data.orderId + ' status diperbarui menjadi ' + data.status,
          type: 'order_update'
        });
      } catch(e) {
        Logger.log('Failed to send notification: ' + e.toString());
      }

      return { success: true, message: 'Status pesanan diperbarui' };
    }
  }

  throw new Error('Pesanan tidak ditemukan');
}

// ==================== REVIEWS ====================
function addReview(data) {
  if (!data || !data.productId || !data.buyerId || !data.rating) {
    throw new Error('Data review tidak lengkap');
  }

  const sheet = getSheet(SHEETS.REVIEWS);
  const id = generateId();
  const timestamp = getCurrentTimestamp();

  sheet.appendRow([
    id, data.productId, data.buyerId, parseInt(data.rating), data.komentar || '', timestamp
  ]);

  return { success: true, message: 'Review berhasil ditambahkan' };
}

function getReviews(data) {
  if (!data || !data.productId) {
    return [];
  }

  const sheet = getSheet(SHEETS.REVIEWS);
  const reviews = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < reviews.length; i++) {
    if (reviews[i][1] === data.productId) {
      let buyerNama = 'Unknown';
      let buyerFoto = '';
      try {
        const buyer = getUserProfile({ userId: reviews[i][2] });
        buyerNama = buyer.nama;
        buyerFoto = buyer.foto;
      } catch(e) {}

      result.push({
        id: reviews[i][0],
        buyerId: reviews[i][2],
        buyerNama: buyerNama,
        buyerFoto: buyerFoto,
        rating: reviews[i][3],
        komentar: reviews[i][4],
        createdAt: reviews[i][5]
      });
    }
  }

  return result;
}

// ==================== WISHLIST ====================
function toggleWishlist(data) {
  if (!data || !data.userId || !data.productId) {
    throw new Error('User ID dan Product ID diperlukan');
  }

  const sheet = getSheet(SHEETS.WISHLIST);
  const items = sheet.getDataRange().getValues();

  for (let i = 1; i < items.length; i++) {
    if (items[i][1] === data.userId && items[i][2] === data.productId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Dihapus dari wishlist', inWishlist: false };
    }
  }

  const id = generateId();
  const timestamp = getCurrentTimestamp();
  sheet.appendRow([id, data.userId, data.productId, timestamp]);

  return { success: true, message: 'Ditambahkan ke wishlist', inWishlist: true };
}

function getWishlist(data) {
  if (!data || !data.userId) {
    throw new Error('User ID diperlukan');
  }

  const sheet = getSheet(SHEETS.WISHLIST);
  const items = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < items.length; i++) {
    if (items[i][1] === data.userId) {
      let product = null;
      try {
        product = getProductDetail({ productId: items[i][2] });
      } catch(e) {
        Logger.log('Product not found in wishlist: ' + items[i][2]);
      }

      if (product) {
        result.push({
          id: items[i][0],
          productId: items[i][2],
          product: product,
          createdAt: items[i][3]
        });
      }
    }
  }

  return result;
}

// ==================== CHAT ====================
function sendMessage(data) {
  if (!data || !data.senderId || !data.receiverId || !data.pesan) {
    throw new Error('Data pesan tidak lengkap');
  }

  const sheet = getSheet(SHEETS.CHATS);
  const id = generateId();
  const timestamp = getCurrentTimestamp();

  sheet.appendRow([
    id, data.senderId, data.receiverId, data.pesan, timestamp, false
  ]);

  try {
    addNotification({
      userId: data.receiverId,
      judul: 'Pesan Baru',
      pesan: 'Anda memiliki pesan baru',
      type: 'chat'
    });
  } catch(e) {
    Logger.log('Failed to send notification: ' + e.toString());
  }

  return { success: true, message: 'Pesan terkirim' };
}

function getMessages(data) {
  if (!data || !data.userId || !data.otherId) {
    throw new Error('User ID dan Other ID diperlukan');
  }

  const sheet = getSheet(SHEETS.CHATS);
  const messages = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < messages.length; i++) {
    if ((messages[i][1] === data.userId && messages[i][2] === data.otherId) ||
        (messages[i][1] === data.otherId && messages[i][2] === data.userId)) {

      let senderNama = 'Unknown';
      let senderFoto = '';
      try {
        const sender = getUserProfile({ userId: messages[i][1] });
        senderNama = sender.nama;
        senderFoto = sender.foto;
      } catch(e) {}

      result.push({
        id: messages[i][0],
        senderId: messages[i][1],
        senderNama: senderNama,
        senderFoto: senderFoto,
        pesan: messages[i][3],
        createdAt: messages[i][4],
        isRead: messages[i][5]
      });

      if (messages[i][2] === data.userId && !messages[i][5]) {
        sheet.getRange(i + 1, 6).setValue(true);
      }
    }
  }

  return result;
}

// ==================== CATEGORIES ====================
function getCategories() {
  const sheet = getSheet(SHEETS.CATEGORIES);
  const categories = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < categories.length; i++) {
    if (categories[i][3] !== 'inactive') {
      result.push({
        id: categories[i][0],
        nama: categories[i][1],
        icon: categories[i][2]
      });
    }
  }

  return result;
}

// ==================== NOTIFICATIONS ====================
function addNotification(data) {
  if (!data || !data.userId || !data.judul || !data.pesan) {
    Logger.log('Invalid notification data');
    return { success: false };
  }

  const sheet = getSheet(SHEETS.NOTIFICATIONS);
  const id = generateId();
  const timestamp = getCurrentTimestamp();

  sheet.appendRow([
    id, data.userId, data.judul, data.pesan, data.type || 'general', false, timestamp
  ]);

  return { success: true };
}

function getNotifications(data) {
  if (!data || !data.userId) {
    throw new Error('User ID diperlukan');
  }

  const sheet = getSheet(SHEETS.NOTIFICATIONS);
  const notifications = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < notifications.length; i++) {
    if (notifications[i][1] === data.userId) {
      result.push({
        id: notifications[i][0],
        judul: notifications[i][2],
        pesan: notifications[i][3],
        type: notifications[i][4],
        isRead: notifications[i][5],
        createdAt: notifications[i][6]
      });
    }
  }

  return result.sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function markNotificationRead(data) {
  if (!data || !data.notificationId) {
    throw new Error('Notification ID diperlukan');
  }

  const sheet = getSheet(SHEETS.NOTIFICATIONS);
  const notifications = sheet.getDataRange().getValues();

  for (let i = 1; i < notifications.length; i++) {
    if (notifications[i][0] === data.notificationId) {
      sheet.getRange(i + 1, 6).setValue(true);
      return { success: true };
    }
  }

  throw new Error('Notifikasi tidak ditemukan');
}

// ==================== DASHBOARD ====================
function getDashboardStats(data) {
  if (!data || !data.userId || !data.role) {
    throw new Error('User ID dan role diperlukan');
  }

  const userId = data.userId;
  const role = data.role;

  const stats = {
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    totalReviews: 0,
    averageRating: 0,
    totalWishlist: 0
  };

  if (role === 'seller') {
    const productSheet = getSheet(SHEETS.PRODUCTS);
    const products = productSheet.getDataRange().getValues();
    const productIds = [];

    for (let i = 1; i < products.length; i++) {
      if (products[i][1] === userId && products[i][11] === 'active') {
        stats.totalProducts++;
        productIds.push(products[i][0]);
      }
    }

    const orderSheet = getSheet(SHEETS.ORDERS);
    const orders = orderSheet.getDataRange().getValues();

    for (let i = 1; i < orders.length; i++) {
      if (orders[i][2] === userId) {
        stats.totalOrders++;
        if (orders[i][4] === 'pending') stats.pendingOrders++;
        if (orders[i][4] === 'completed') stats.totalSales += parseFloat(orders[i][3]) || 0;
      }
    }

    const reviewSheet = getSheet(SHEETS.REVIEWS);
    const reviews = reviewSheet.getDataRange().getValues();
    let totalRating = 0;
    let reviewCount = 0;

    for (let i = 1; i < reviews.length; i++) {
      if (productIds.indexOf(reviews[i][1]) !== -1) {
        totalRating += parseInt(reviews[i][3]) || 0;
        reviewCount++;
      }
    }

    stats.totalReviews = reviewCount;
    stats.averageRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;
  } else {
    const orderSheet = getSheet(SHEETS.ORDERS);
    const orders = orderSheet.getDataRange().getValues();

    for (let i = 1; i < orders.length; i++) {
      if (orders[i][1] === userId) {
        stats.totalOrders++;
        if (orders[i][4] === 'pending') stats.pendingOrders++;
      }
    }

    const wishlistSheet = getSheet(SHEETS.WISHLIST);
    const wishlist = wishlistSheet.getDataRange().getValues();
    stats.totalWishlist = 0;

    for (let i = 1; i < wishlist.length; i++) {
      if (wishlist[i][1] === userId) stats.totalWishlist++;
    }
  }

  return stats;
}

// ==================== INITIALIZATION ====================
function initializeCategories() {
  const sheet = getSheet(SHEETS.CATEGORIES);
  const categories = [
    ['CAT001', 'Makanan & Minuman', '🍔', 'active'],
    ['CAT002', 'Fashion & Pakaian', '👕', 'active'],
    ['CAT003', 'Elektronik', '💻', 'active'],
    ['CAT004', 'Kecantikan & Kesehatan', '💄', 'active'],
    ['CAT005', 'Rumah Tangga', '🏠', 'active'],
    ['CAT006', 'Olahraga & Hobi', '⚽', 'active'],
    ['CAT007', 'Buku & Alat Tulis', '📚', 'active'],
    ['CAT008', 'Otomotif', '🚗', 'active'],
    ['CAT009', 'Jasa', '🛠️', 'active'],
    ['CAT010', 'Kerajinan Tangan', '🎨', 'active']
  ];

  sheet.clear();
  sheet.getRange(1, 1, 1, 4).setValues([['ID', 'Nama', 'Icon', 'Status']]);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  sheet.getRange(1, 1, 1, 4).setBackground('#1B5E20');
  sheet.getRange(1, 1, 1, 4).setFontColor('#FFFFFF');

  for (let i = 0; i < categories.length; i++) {
    sheet.appendRow(categories[i]);
  }

  return 'Kategori berhasil diinisialisasi: ' + categories.length + ' kategori';
}

function initializeAll() {
  Object.keys(SHEETS).forEach(function(sheetName) {
    getSheet(SHEETS[sheetName]);
  });
  initializeCategories();
  return 'Semua sheet berhasil diinisialisasi';
}
