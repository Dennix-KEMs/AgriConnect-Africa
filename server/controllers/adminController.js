const { pool } = require("../database/db");
const PDFDocument = require("pdfkit");
const auditService = require("../services/auditService");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const {
    validatePassword
} = require("../utils/passwordValidator");

const logoPath = path.join(__dirname, "..", "logo 1.png");

exports.getDashboardStats = async (req, res) => {

  try {

    // ========================================================
    // BASIC PLATFORM COUNTS
    // ========================================================

    const [[users]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM users
    `);

    // ========================================================
// USER STATUS COUNTS
// ========================================================

const [[activeUsers]] = await pool.query(`
  SELECT COUNT(*) AS total
  FROM users
  WHERE isActive = 1
`);

const [[suspendedUsers]] = await pool.query(`
  SELECT COUNT(*) AS total
  FROM users
  WHERE isActive = 0
`);


    // ========================================================
    // ACTIVE ROLE COUNTS
    // ========================================================

    const [[farmers]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM user_roles
      WHERE role = 'farmer'
      AND status = 'active'
    `);


    const [[buyers]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM user_roles
      WHERE role = 'buyer'
      AND status = 'active'
    `);


    const [[suppliers]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM user_roles
      WHERE role = 'supplier'
      AND status = 'active'
    `);


    const [[experts]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM user_roles
      WHERE role = 'expert'
      AND status = 'active'
    `);


    // ========================================================
    // MARKETPLACE
    // ========================================================

    const [[products]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM products
    `);


    const [[orders]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM orders
    `);


    const [[bookings]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM bookings
    `);


    // ========================================================
    // REVENUE
    // ========================================================

    const [[revenue]] = await pool.query(`
      SELECT
        COALESCE(
          SUM(total_price),
          0
        ) AS total
      FROM orders
      WHERE status = 'delivered'
    `);


    // ========================================================
    // VERIFICATION COUNTS
    // ========================================================

    const [[pendingVerifications]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM verification_submissions
        WHERE status = 'pending'
      `);


    const [[pendingExperts]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM verification_submissions
        WHERE verification_type = 'expert'
        AND status = 'pending'
      `);


    const [[pendingSuppliers]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM verification_submissions
        WHERE verification_type = 'supplier'
        AND status = 'pending'
      `);


    // ========================================================
    // SINGLE RESPONSE
    // ========================================================

    res.json({

      users: users.total,

      activeUsers: activeUsers.total,

suspendedUsers: suspendedUsers.total,

      farmers: farmers.total,

      buyers: buyers.total,

      suppliers: suppliers.total,

      experts: experts.total,

      products: products.total,

      orders: orders.total,

      bookings: bookings.total,

      revenue: revenue.total,

      pendingVerifications:
        pendingVerifications.total,

      pendingExperts:
        pendingExperts.total,

      pendingSuppliers:
        pendingSuppliers.total

    });


  } catch (error) {

    console.error(
      "Dashboard statistics error:",
      error
    );


    // Only send error if a response
    // hasn't already been sent.

    if (!res.headersSent) {

      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }

};

exports.getAllUsers = async (req, res) => {

  try {

    const search =
      String(req.query.search || "").trim();

    const status =
      String(req.query.status || "all")
        .trim()
        .toLowerCase();

    const accountType =
      String(req.query.accountType || "all")
        .trim()
        .toLowerCase();

let sql = `
    SELECT
        u.id,
        u.fullName,
        u.email,
        u.phone,
        u.accountType,
        u.county,
        u.createdAt,
        u.isActive

    FROM users u

    LEFT JOIN admin_access aa
        ON aa.user_id = u.id

    WHERE 1 = 1

    AND aa.user_id IS NULL
`;

    const params = [];


    // =====================================================
    // SEARCH
    // =====================================================

    if (search) {

      sql += `
        AND (
          fullName LIKE ?
          OR email LIKE ?
          OR phone LIKE ?
          OR county LIKE ?
        )
      `;

      const searchValue =
        `%${search}%`;

      params.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );

    }


    // =====================================================
    // STATUS FILTER
    // =====================================================

    if (status === "active") {

      sql += `
        AND isActive = 1
      `;

    }

    if (status === "suspended") {

      sql += `
        AND isActive = 0
      `;

    }


    // =====================================================
    // ACCOUNT TYPE FILTER
    // =====================================================

    if (
      accountType !== "all" &&
      accountType
    ) {

      sql += `
        AND LOWER(accountType) = ?
      `;

      params.push(accountType);

    }


    // =====================================================
    // ORDER
    // =====================================================

    sql += `
      ORDER BY createdAt DESC
    `;


    const [users] =
      await pool.query(
        sql,
        params
      );


    return res.json({

      success: true,

      totalUsers:
        users.length,

      users

    });

  } catch (error) {

    console.error(
      "GET ALL USERS ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to load users."

    });

  }

};

exports.getAllProducts = async (req, res) => {
  try {

    const search =
      req.query.search || "";

    const [products] =
      await pool.query(
`
SELECT
  *
FROM products
WHERE
  product_name LIKE ?
  OR category LIKE ?
ORDER BY created_at DESC
`,
[
  `%${search}%`,
  `%${search}%`
]
);

    res.json({
      totalProducts:
        products.length,
      products
    });

  } catch(error) {

    res.status(500).json({
      error: error.message
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {

    const status =
      req.query.status;

    let sql = `
      SELECT
        o.id,
        o.quantity,
        o.total_price,
        o.status,
        o.created_at,

        p.product_name,

        buyer.fullName
        AS buyer_name,

        seller.fullName
        AS seller_name

      FROM orders o

      JOIN products p
        ON o.product_id = p.id

      JOIN users buyer
        ON o.buyer_id = buyer.id

      JOIN users seller
        ON o.seller_id = seller.id
    `;

    const params = [];

    if (status) {

      sql += `
        WHERE o.status = ?
      `;

      params.push(status);
    }

    sql += `
      ORDER BY o.created_at DESC
    `;

    const [orders] =
      await pool.query(
        sql,
        params
      );

    res.json({
      totalOrders:
        orders.length,
      orders
    });

  } catch(error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `
      SELECT *
      FROM bookings
      ORDER BY created_at DESC
      `
    );

    res.json({
      totalBookings: bookings.length,
      bookings
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    await pool.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    res.json({
      message: "User deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM products WHERE id = ?",
      [id]
    );

    res.json({
      message: "Product removed successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.updateUserStatus = async (req, res) => {

  try {

    const adminId = req.user.id;
    const { id } = req.params;

    const userId = Number(id);

    const requestedStatus =
      req.body.isActive;

    const reason =
      String(req.body.reason || "").trim();


    // =====================================================
    // VALIDATE USER ID
    // =====================================================

    if (!Number.isInteger(userId)) {

      return res.status(400).json({
        success: false,
        message: "Invalid user ID."
      });

    }


    // =====================================================
    // VALIDATE STATUS
    // =====================================================

    if (
      requestedStatus !== true &&
      requestedStatus !== false
    ) {

      return res.status(400).json({
        success: false,
        message:
          "isActive must be either true or false."
      });

    }


    // =====================================================
    // REQUIRE REASON
    // =====================================================

    if (!reason) {

      return res.status(400).json({
        success: false,
        message:
          "A reason is required."
      });

    }


    // =====================================================
    // FIND USER
    // =====================================================

    const [users] = await pool.query(
      `
      SELECT
        id,
        fullName,
        email,
        accountType,
        isActive
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );


    if (users.length === 0) {

      return res.status(404).json({
        success: false,
        message: "User not found."
      });

    }


    const user = users[0];


    // =====================================================
    // PREVENT SELF-SUSPENSION
    // =====================================================

    if (
      Number(user.id) ===
      Number(adminId)
    ) {

      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own account status."
      });

    }


    // =====================================================
    // CURRENT STATUS
    // =====================================================

    const currentStatus =
      Number(user.isActive) === 1;


    // =====================================================
    // NO CHANGE
    // =====================================================

    if (
      currentStatus === requestedStatus
    ) {

      return res.status(400).json({

        success: false,

        message:
          requestedStatus
            ? "User is already active."
            : "User is already suspended."

      });

    }


    // =====================================================
    // UPDATE USER
    // =====================================================

    await pool.query(
      `
      UPDATE users
      SET isActive = ?
      WHERE id = ?
      `,
      [
        requestedStatus ? 1 : 0,
        userId
      ]
    );


    // =====================================================
    // AUDIT ACTION
    // =====================================================

    await auditService.logAction({

      actorUserId: adminId,

      action:
        requestedStatus
          ? "USER_UNSUSPENDED"
          : "USER_SUSPENDED",

      entityType: "USER",

      entityId: userId,

      description:
        requestedStatus
          ? `User ${user.fullName} was unsuspended. Reason: ${reason}`
          : `User ${user.fullName} was suspended. Reason: ${reason}`,

      oldValues: {
        isActive:
          currentStatus ? 1 : 0
      },

      newValues: {
        isActive:
          requestedStatus ? 1 : 0,

        reason
      },

      ipAddress:
        req.ip,

      userAgent:
        req.get("user-agent")

    });


    // =====================================================
    // RESPONSE
    // =====================================================

    return res.json({

      success: true,

      message:
        requestedStatus
          ? "User unsuspended successfully."
          : "User suspended successfully.",

      user: {

        id: user.id,

        fullName:
          user.fullName,

        email:
          user.email,

        accountType:
          user.accountType,

        isActive:
          requestedStatus ? 1 : 0

      }

    });

  } catch (error) {

    console.error(
      "UPDATE USER STATUS ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to update user status."

    });

  }

};

exports.getUserActivity = async (req, res) => {
  try {
    const [users] = await pool.query(
      `
      SELECT
        id,
        fullName,
        accountType,
        last_seen
      FROM users
      ORDER BY last_seen DESC
      `
    );

    res.json({
      totalUsers: users.length,
      users
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getLoginLogs = async (req, res) => {
  try {
    const [logs] = await pool.query(
      `
      SELECT
        l.id,
        u.fullName,
        u.email,
        l.login_time
      FROM login_logs l
      JOIN users u
        ON l.user_id = u.id
      ORDER BY l.login_time DESC
      `
    );

    res.json({
      totalLogs: logs.length,
      logs
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getRevenueReport = async (req, res) => {
  try {

    const [[revenue]] = await pool.query(`
      SELECT
        COALESCE(
          SUM(total_price),
          0
        ) AS totalRevenue
      FROM orders
      WHERE status = 'delivered'
    `);

    const [[delivered]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM orders
      WHERE status='delivered'
    `);

    const [[cancelled]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM orders
      WHERE status='cancelled'
    `);

    const [[pending]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM orders
      WHERE status='pending'
    `);

    res.json({
      revenue: revenue.totalRevenue,
      deliveredOrders: delivered.total,
      cancelledOrders: cancelled.total,
      pendingOrders: pending.total
    });

  } catch(error) {

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getTopProducts = async (req, res) => {
  try {

    const [products] =
      await pool.query(`
       SELECT
    p.product_name,
    u.fullName AS sellerName,
    SUM(o.quantity) AS totalSold
FROM orders o
JOIN products p
    ON o.product_id = p.id
JOIN users u
    ON p.seller_id = u.id
GROUP BY p.id
ORDER BY totalSold DESC
LIMIT 10;
      `);

    res.json({
      products
    });

  } catch(error) {

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getSellerRevenue = async (req, res) => {
  try {

    const [sellers] =
      await pool.query(`
        SELECT

          u.fullName,

          u.accountType,

          SUM(o.total_price)
          AS revenue

        FROM orders o

        JOIN users u
          ON o.seller_id = u.id

        WHERE o.status='delivered'

        GROUP BY u.id

        ORDER BY revenue DESC
      `);

    res.json({
      sellers
    });

  } catch(error) {

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getMonthlyRevenue = async (req, res) => {
  try {

    const [months] = await pool.query(`
      SELECT
        YEAR(created_at) AS year,
        MONTH(created_at) AS month,
        SUM(total_price) AS revenue
      FROM orders
      WHERE status = 'delivered'
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY YEAR(created_at), MONTH(created_at)
    `);

    res.json(months);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getOrderStatusStats = async (req, res) => {
  try {

    const [stats] = await pool.query(`
      SELECT
        status,
        COUNT(*) AS total
      FROM orders
      GROUP BY status
      ORDER BY status
    `);

    res.json(stats);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getRecentTransactions = async (req, res) => {
  try {

    const [transactions] = await pool.query(`
      SELECT
        o.id,
        buyer.fullName AS buyer,
        seller.fullName AS seller,
        p.product_name,
        o.quantity,
        o.total_price,
        o.status,
        o.created_at
      FROM orders o
      JOIN users buyer
        ON o.buyer_id = buyer.id
      JOIN users seller
        ON o.seller_id = seller.id
      JOIN products p
        ON o.product_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      transactions
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

// =====================================================
// GET TRANSACTION LEDGER
// =====================================================

exports.getTransactions = async (req, res) => {

  try {

    const search =
      String(req.query.search || "").trim();

    const status =
      String(req.query.status || "")
        .trim()
        .toLowerCase();

    const dateFrom =
      String(req.query.dateFrom || "").trim();

    const dateTo =
      String(req.query.dateTo || "").trim();


    // =====================================================
    // BASE QUERY
    // =====================================================

    let sql = `
      SELECT

        o.id,

        o.quantity,

        o.total_price,

        o.status,

        o.created_at,

        p.product_name,

        buyer.id AS buyer_id,
        buyer.fullName AS buyer_name,
        buyer.email AS buyer_email,
        buyer.phone AS buyer_phone,

        seller.id AS seller_id,
        seller.fullName AS seller_name,
        seller.email AS seller_email,
        seller.phone AS seller_phone

      FROM orders o

      JOIN products p
        ON p.id = o.product_id

      JOIN users buyer
        ON buyer.id = o.buyer_id

      JOIN users seller
        ON seller.id = o.seller_id

      WHERE 1 = 1
    `;


    const params = [];


    // =====================================================
    // SEARCH
    // =====================================================

    if (search) {

      sql += `
        AND (
          buyer.fullName LIKE ?
          OR buyer.email LIKE ?

          OR seller.fullName LIKE ?
          OR seller.email LIKE ?

          OR p.product_name LIKE ?

          OR CAST(o.id AS CHAR) LIKE ?
        )
      `;

      const searchValue =
        `%${search}%`;

      params.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );

    }


    // =====================================================
    // STATUS
    // =====================================================

    if (status) {

      sql += `
        AND o.status = ?
      `;

      params.push(status);

    }


    // =====================================================
    // DATE FROM
    // =====================================================

    if (dateFrom) {

      sql += `
        AND DATE(o.created_at) >= ?
      `;

      params.push(dateFrom);

    }


    // =====================================================
    // DATE TO
    // =====================================================

    if (dateTo) {

      sql += `
        AND DATE(o.created_at) <= ?
      `;

      params.push(dateTo);

    }


    // =====================================================
    // ORDER
    // =====================================================

    sql += `
      ORDER BY o.created_at DESC
    `;


    // =====================================================
    // EXECUTE
    // =====================================================

    const [transactions] =
      await pool.query(
        sql,
        params
      );


    // =====================================================
    // CALCULATE FILTERED SUMMARY
    // =====================================================

    let transactionValue = 0;

    let deliveredOrders = 0;

    let pendingOrders = 0;

    let cancelledOrders = 0;


    transactions.forEach(
      transaction => {

        transactionValue +=
          Number(
            transaction.total_price || 0
          );


        if (
          transaction.status === "delivered"
        ) {

          deliveredOrders++;

        }


        if (
          transaction.status === "pending"
        ) {

          pendingOrders++;

        }


        if (
          transaction.status === "cancelled"
        ) {

          cancelledOrders++;

        }

      }
    );


    const averageTransaction =
      transactions.length > 0
        ? transactionValue /
          transactions.length
        : 0;


    // =====================================================
    // RESPONSE
    // =====================================================

    return res.json({

      success: true,

      transactions,

      summary: {

        transactionCount:
          transactions.length,

        transactionValue,

        averageTransaction,

        deliveredOrders,

        pendingOrders,

        cancelledOrders

      }

    });


  } catch (error) {

    console.error(
      "GET TRANSACTION LEDGER ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to load transaction ledger."

    });

  }

};

// =====================================================
// GET TRANSACTION DETAILS
// =====================================================

exports.getTransactionDetails = async (req, res) => {

  try {

    const transactionId =
      Number(req.params.id);


    // =====================================================
    // VALIDATE ID
    // =====================================================

    if (!Number.isInteger(transactionId)) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid transaction ID."

      });

    }


    // =====================================================
    // GET TRANSACTION
    // =====================================================

    const [transactions] =
      await pool.query(
        `
        SELECT

          o.id,
          o.quantity,
          o.total_price,
          o.status,
          o.created_at,

          p.id AS product_id,
          p.product_name,
          p.category,
          p.price AS unit_price,

          buyer.id AS buyer_id,
          buyer.fullName AS buyer_name,
          buyer.email AS buyer_email,
          buyer.phone AS buyer_phone,

          seller.id AS seller_id,
          seller.fullName AS seller_name,
          seller.email AS seller_email,
          seller.phone AS seller_phone

        FROM orders o

        JOIN products p
          ON o.product_id = p.id

        JOIN users buyer
          ON o.buyer_id = buyer.id

        JOIN users seller
          ON o.seller_id = seller.id

        WHERE o.id = ?

        LIMIT 1
        `,
        [transactionId]
      );


    // =====================================================
    // NOT FOUND
    // =====================================================

    if (
      transactions.length === 0
    ) {

      return res.status(404).json({

        success: false,

        message:
          "Transaction not found."

      });

    }


    const transaction =
      transactions[0];


    // =====================================================
    // RESPONSE
    // =====================================================

    return res.json({

      success: true,

      transaction: {

        id:
          transaction.id,

        quantity:
          transaction.quantity,

        totalAmount:
          transaction.total_price,

        status:
          transaction.status,

        createdAt:
          transaction.created_at,


        product: {

          id:
            transaction.product_id,

          name:
            transaction.product_name,

          category:
            transaction.category,

          unitPrice:
            transaction.unit_price

        },


        buyer: {

          id:
            transaction.buyer_id,

          name:
            transaction.buyer_name,

          email:
            transaction.buyer_email,

          phone:
            transaction.buyer_phone

        },


        seller: {

          id:
            transaction.seller_id,

          name:
            transaction.seller_name,

          email:
            transaction.seller_email,

          phone:
            transaction.seller_phone

        }

      }

    });


  } catch (error) {

    console.error(
      "GET TRANSACTION DETAILS ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to load transaction details."

    });

  }

};

exports.exportTransactionsCSV = async (req, res) => {
  try {

    const [transactions] = await pool.query(`
      SELECT
        o.id,
        buyer.fullName AS buyer,
        seller.fullName AS seller,
        p.product_name,
        o.quantity,
        o.total_price,
        o.status,
        o.created_at
      FROM orders o
      JOIN users buyer
        ON o.buyer_id = buyer.id
      JOIN users seller
        ON o.seller_id = seller.id
      JOIN products p
        ON o.product_id = p.id
      ORDER BY o.created_at DESC
    `);

    let csv =
`Order ID,Buyer,Seller,Product,Quantity,Amount,Status,Date\n`;

    transactions.forEach(order => {

      csv +=
`${order.id},"${order.buyer}","${order.seller}","${order.product_name}",${order.quantity},${order.total_price},${order.status},"${new Date(order.created_at).toLocaleString()}"\n`;

    });

    res.setHeader(
      "Content-Type",
      "text/csv"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=transactions.csv"
    );

    res.send(csv);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

// =====================================================
// EXPORT TRANSACTIONS - PROFESSIONAL AGRICONNECT PDF
// =====================================================

exports.exportTransactionsPDF = async (req, res) => {

  try {

    // ===================================================
    // GET TRANSACTIONS
    // ===================================================

    const [transactions] = await pool.query(`
      SELECT
        o.id,
        buyer.fullName AS buyer,
        seller.fullName AS seller,
        p.product_name,
        o.quantity,
        o.total_price,
        o.status,
        o.created_at

      FROM orders o

      JOIN users buyer
        ON buyer.id = o.buyer_id

      JOIN users seller
        ON seller.id = o.seller_id

      JOIN products p
        ON p.id = o.product_id

      ORDER BY o.created_at DESC
    `);


    // ===================================================
    // GET ADMIN INFORMATION
    // ===================================================

    let generatedBy = "Administrator";

    try {

      const [[admin]] = await pool.query(
        `
        SELECT fullName
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [req.user.id]
      );

      if (admin && admin.fullName) {
        generatedBy = admin.fullName;
      }

    } catch (error) {

      console.warn(
        "Could not load administrator name:",
        error.message
      );

    }


    // ===================================================
    // COLORS
    // ===================================================

    const COLORS = {

      green:
        "#1B5E20",

      lightGreen:
        "#E8F5E9",

      lighterGreen:
        "#F3F9F4",

      white:
        "#FFFFFF",

      lightGray:
        "#F7F7F7",

      border:
        "#D9D9D9",

      text:
        "#111111",

      muted:
        "#555555"

    };


    // ===================================================
    // CREATE PDF
    // ===================================================

    const doc = new PDFDocument({

      size: "A4",

      layout: "landscape",

      margins: {
        top: 24,
        bottom: 32,
        left: 24,
        right: 24
      },

      bufferPages: true

    });


    // ===================================================
    // RESPONSE HEADERS
    // ===================================================

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=agriconnect-transactions-report.pdf"
    );


    doc.pipe(res);


    // ===================================================
    // PAGE DIMENSIONS
    // ===================================================

    const pageWidth =
      doc.page.width;

    const pageHeight =
      doc.page.height;

    const left =
      doc.page.margins.left;

    const right =
      pageWidth -
      doc.page.margins.right;

    const contentWidth =
      right - left;


    // ===================================================
    // LOGO
    // ===================================================

    const logoPath =
      path.join(
        __dirname,
        "..",
        "logo 1.png"
      );


    // ===================================================
    // UTILITY FUNCTIONS
    // ===================================================

    function formatCurrency(value) {

      return `KES ${Number(
        value || 0
      ).toLocaleString("en-KE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })}`;

    }


    function formatDate(value) {

      if (!value) {
        return "-";
      }

      const date =
        new Date(value);

      const day =
        String(
          date.getDate()
        ).padStart(2, "0");

      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, "0");

      const year =
        date.getFullYear();

      return `${day}/${month}/${year}`;

    }


    function truncate(
      value,
      maxLength
    ) {

      const text =
        String(
          value || ""
        );

      if (
        text.length <=
        maxLength
      ) {

        return text;

      }

      return (
        text.substring(
          0,
          maxLength - 3
        ) +
        "..."
      );

    }


    // ===================================================
    // FINANCIAL CALCULATIONS
    // ===================================================

    const totalValue =
      transactions.reduce(
        (
          total,
          transaction
        ) =>
          total +
          Number(
            transaction.total_price || 0
          ),
        0
      );


    const deliveredCount =
      transactions.filter(
        transaction =>
          String(
            transaction.status
          ).toLowerCase() ===
          "delivered"
      ).length;


    const pendingCount =
      transactions.filter(
        transaction =>
          String(
            transaction.status
          ).toLowerCase() ===
          "pending"
      ).length;


    const cancelledCount =
      transactions.filter(
        transaction =>
          String(
            transaction.status
          ).toLowerCase() ===
          "cancelled"
      ).length;


    const generatedDate =
      new Date().toLocaleString(
        "en-KE"
      );


    // ===================================================
    // DRAW REPORT HEADER
    // ===================================================

    function drawReportHeader() {

      const headerTop =
        24;


      // -------------------------------------------------
      // LOGO
      // -------------------------------------------------

      try {

        if (
          require("fs").existsSync(
            logoPath
          )
        ) {

          doc.image(
            logoPath,
            left,
            headerTop,
            {
              width: 48,
              height: 42,
              fit: [48, 42]
            }
          );

        }

      } catch (error) {

        console.warn(
          "Logo could not be loaded:",
          error.message
        );

      }


      // -------------------------------------------------
      // BRAND NAME
      // -------------------------------------------------

      doc
        .fillColor(
          COLORS.green
        )
        .font(
          "Helvetica-Bold"
        )
        .fontSize(
          17
        )
        .text(
          "AGRICONNECT AFRICA",
          left + 68,
          headerTop + 1
        );


      // -------------------------------------------------
      // REPORT TITLE
      // -------------------------------------------------

      doc
        .fillColor(
          COLORS.text
        )
        .font(
          "Helvetica"
        )
        .fontSize(
          9
        )
        .text(
          "FINANCIAL & TRANSACTIONS REPORT",
          left + 68,
          headerTop + 22
        );


      // -------------------------------------------------
      // GREEN DIVIDER
      // -------------------------------------------------

      const dividerY =
        headerTop + 54;


      doc
        .strokeColor(
          COLORS.green
        )
        .lineWidth(
          2
        )
        .moveTo(
          left,
          dividerY
        )
        .lineTo(
          right,
          dividerY
        )
        .stroke();


      return dividerY + 14;

    }


    // ===================================================
    // DRAW SUMMARY SECTION
    // ===================================================

    function drawSummary(
      startY
    ) {

      const infoWidth =
        contentWidth * 0.40;

      const cardsX =
        left + infoWidth + 18;

      const cardsWidth =
        contentWidth -
        infoWidth -
        18;

      const cardGap =
        8;

      const cardWidth =
        (
          cardsWidth -
          cardGap
        ) / 2;

      const cardHeight =
        38;


      // -------------------------------------------------
      // REPORT INFORMATION
      // -------------------------------------------------

      doc
        .fillColor(
          COLORS.text
        )
        .font(
          "Helvetica-Bold"
        )
        .fontSize(
          8
        )
        .text(
          "REPORT INFORMATION",
          left,
          startY
        );


      doc
        .font(
          "Helvetica"
        )
        .fontSize(
          7
        )
        .fillColor(
          COLORS.text
        );


      doc.text(
        `Generated by: ${generatedBy}`,
        left,
        startY + 12
      );


      doc.text(
        `Generated: ${generatedDate}`,
        left,
        startY + 22
      );


      doc.text(
        `Total transactions: ${transactions.length}`,
        left,
        startY + 32
      );


      // -------------------------------------------------
      // SUMMARY CARDS
      // -------------------------------------------------

      const cards = [

        {
          title:
            "TOTAL VALUE",

          value:
            formatCurrency(
              totalValue
            )
        },

        {
          title:
            "DELIVERED",

          value:
            deliveredCount
              .toLocaleString()
        },

        {
          title:
            "PENDING",

          value:
            pendingCount
              .toLocaleString()
        },

        {
          title:
            "CANCELLED",

          value:
            cancelledCount
              .toLocaleString()
        }

      ];


      cards.forEach(
        (
          card,
          index
        ) => {

          const row =
            Math.floor(
              index / 2
            );

          const column =
            index % 2;


          const x =
            cardsX +
            column *
              (
                cardWidth +
                cardGap
              );

          const y =
            startY +
            row *
              (
                cardHeight +
                5
              );


          // Card background

          doc
            .roundedRect(
              x,
              y,
              cardWidth,
              cardHeight,
              4
            )
            .fillAndStroke(
              COLORS.lightGreen,
              COLORS.border
            );


          // Card title

          doc
            .fillColor(
              COLORS.muted
            )
            .font(
              "Helvetica-Bold"
            )
            .fontSize(
              6
            )
            .text(
              card.title,
              x,
              y + 7,
              {
                width:
                  cardWidth,
                align:
                  "center"
              }
            );


          // Card value

          doc
            .fillColor(
              COLORS.green
            )
            .font(
              "Helvetica-Bold"
            )
            .fontSize(
              9
            )
            .text(
              card.value,
              x,
              y + 19,
              {
                width:
                  cardWidth,
                align:
                  "center"
              }
            );

        }
      );


      return startY + 91;

    }


    // ===================================================
    // TABLE CONFIGURATION
    // ===================================================

    const columns = [

      {
        key: "id",
        title: "ORDER",
        width: 43
      },

      {
        key: "buyer",
        title: "BUYER",
        width: 90
      },

      {
        key: "seller",
        title: "SELLER",
        width: 90
      },

      {
        key: "product_name",
        title: "PRODUCT",
        width: 165
      },

      {
        key: "quantity",
        title: "QTY",
        width: 42
      },

      {
        key: "total_price",
        title: "AMOUNT",
        width: 85
      },

      {
        key: "status",
        title: "STATUS",
        width: 90
      },

      {
        key: "created_at",
        title: "DATE",
        width:
          contentWidth -
          (
            43 +
            90 +
            90 +
            165 +
            42 +
            85 +
            90
          )

      }

    ];


    const tableHeaderHeight =
      20;

    const rowHeight =
      18;


    // ===================================================
    // DRAW TABLE HEADER
    // ===================================================

    function drawTableHeader(
      y
    ) {

      let x =
        left;


      // Header background

      doc
        .fillColor(
          COLORS.green
        )
        .rect(
          left,
          y,
          contentWidth,
          tableHeaderHeight
        )
        .fill();


      columns.forEach(
        column => {

          doc
            .fillColor(
              COLORS.white
            )
            .font(
              "Helvetica-Bold"
            )
            .fontSize(
              6.5
            )
            .text(
              column.title,
              x + 4,
              y + 6,
              {
                width:
                  column.width - 8,
                align:
                  column.key ===
                  "quantity"
                    ? "center"
                    : "left",
                lineBreak:
                  false
              }
            );


          x +=
            column.width;

        }
      );


      return (
        y +
        tableHeaderHeight
      );

    }


    // ===================================================
    // DRAW TABLE ROW
    // ===================================================

    function drawTableRow(
      transaction,
      y,
      index
    ) {

      let x =
        left;


      // Alternating background

      if (
        index % 2 === 0
      ) {

        doc
          .fillColor(
            COLORS.lightGray
          )
          .rect(
            left,
            y,
            contentWidth,
            rowHeight
          )
          .fill();

      }


      // Bottom border

      doc
        .strokeColor(
          COLORS.border
        )
        .lineWidth(
          0.5
        )
        .moveTo(
          left,
          y + rowHeight
        )
        .lineTo(
          right,
          y + rowHeight
        )
        .stroke();


      columns.forEach(
        column => {

          let value =
            "";


          switch (
            column.key
          ) {

            case "id":

              value =
                `#${transaction.id}`;

              break;


            case "buyer":

              value =
                truncate(
                  transaction.buyer,
                  17
                );

              break;


            case "seller":

              value =
                truncate(
                  transaction.seller,
                  17
                );

              break;


            case "product_name":

              value =
                truncate(
                  transaction.product_name,
                  29
                );

              break;


            case "quantity":

              value =
                transaction.quantity ||
                0;

              break;


            case "total_price":

              value =
                formatCurrency(
                  transaction.total_price
                );

              break;


            case "status":

              value =
                String(
                  transaction.status ||
                  ""
                ).toUpperCase();

              break;


            case "created_at":

              value =
                formatDate(
                  transaction.created_at
                );

              break;

          }


          // ------------------------------------------------
          // STATUS COLOR
          // ------------------------------------------------

          let textColor =
            COLORS.text;


          if (
            column.key ===
            "status"
          ) {

            const status =
              String(
                transaction.status ||
                ""
              ).toLowerCase();


            if (
              status ===
              "delivered"
            ) {

              textColor =
                COLORS.green;

            }

            else if (
              status ===
              "cancelled"
            ) {

              textColor =
                "#B71C1C";

            }

            else if (
              status ===
              "processing"
            ) {

              textColor =
                "#8A5A00";

            }

          }


          doc
            .fillColor(
              textColor
            )
            .font(
              column.key ===
              "status"
                ? "Helvetica-Bold"
                : "Helvetica"
            )
            .fontSize(
              6.3
            )
            .text(
              String(value),
              x + 4,
              y + 5,
              {
                width:
                  column.width - 8,
                height:
                  rowHeight - 5,
                lineBreak:
                  false,
                align:
                  column.key ===
                  "quantity"
                    ? "center"
                    : "left"
              }
            );


          x +=
            column.width;

        }
      );


      return (
        y +
        rowHeight
      );

    }


    // ===================================================
    // FIRST PAGE HEADER + SUMMARY
    // ===================================================

    let currentY =
      drawReportHeader();


    currentY =
      drawSummary(
        currentY
      );


    // ===================================================
    // TABLE HEADER
    // ===================================================

    currentY =
      drawTableHeader(
        currentY
      );


    // ===================================================
    // DRAW TRANSACTIONS
    // ===================================================

    transactions.forEach(
      (
        transaction,
        index
      ) => {

        // ------------------------------------------------
        // CHECK PAGE SPACE
        // ------------------------------------------------

        if (
          currentY +
            rowHeight +
            35 >
          pageHeight -
            doc.page.margins.bottom
        ) {

          doc.addPage();


          currentY =
            drawReportHeader();


          // Smaller continuation-page spacing

          currentY += 2;


          currentY =
            drawTableHeader(
              currentY
            );

        }


        currentY =
          drawTableRow(
            transaction,
            currentY,
            index
          );

      }
    );


    // ===================================================
    // EMPTY TRANSACTION STATE
    // ===================================================

    if (
      transactions.length === 0
    ) {

      doc
        .fillColor(
          COLORS.muted
        )
        .font(
          "Helvetica"
        )
        .fontSize(
          8
        )
        .text(
          "No marketplace transactions were found.",
          left,
          currentY + 12,
          {
            width:
              contentWidth,
            align:
              "center"
          }
        );

    }


    // ===================================================
    // BUFFERED PAGE FOOTERS
    // ===================================================

    const range =
      doc.bufferedPageRange();


    const totalPages =
      range.count;


    for (
      let i = 0;
      i < totalPages;
      i++
    ) {

      doc.switchToPage(
        range.start + i
      );


      const footerY =
        pageHeight - 23;


      // Footer line

      doc
        .strokeColor(
          COLORS.border
        )
        .lineWidth(
          0.7
        )
        .moveTo(
          left,
          footerY - 7
        )
        .lineTo(
          right,
          footerY - 7
        )
        .stroke();


      // Footer left

      doc
        .fillColor(
          COLORS.muted
        )
        .font(
          "Helvetica"
        )
        .fontSize(
          6.5
        )
        .text(
          "AgriConnect Africa • Confidential Administrative Document",
          left,
          footerY
        );


      // Footer right

      doc
        .fillColor(
          COLORS.green
        )
        .font(
          "Helvetica-Bold"
        )
        .fontSize(
          6.5
        )
        .text(
          `Page ${i + 1} of ${totalPages}`,
          left,
          footerY,
          {
            width:
              contentWidth,
            align:
              "right"
          }
        );

    }


    // ===================================================
    // FINALIZE PDF
    // ===================================================

    doc.end();


  } catch (error) {

    console.error(
      "TRANSACTION PDF EXPORT ERROR:",
      error
    );


    if (
      !res.headersSent
    ) {

      res.status(500).json({
        success: false,
        error:
          "Failed to generate transaction PDF."
      });

    }

  }

};

// ============================================================
// GET PENDING VERIFICATIONS
// ============================================================

exports.getPendingVerifications = async (req, res) => {

  try {

    const [verifications] = await pool.query(`
      SELECT

        vs.id,
        vs.user_id,
        vs.user_role_id,
        vs.verification_type,
        vs.status,
        vs.submitted_at,
        vs.updated_at,

        u.fullName,
        u.email,
        u.phone,
        u.county,
        u.subcounty,
        u.ward,

        ur.role,
        ur.status AS role_status

      FROM verification_submissions vs

      JOIN users u
        ON u.id = vs.user_id

      JOIN user_roles ur
        ON ur.id = vs.user_role_id

      WHERE vs.status = 'pending'

      ORDER BY vs.submitted_at ASC
    `);


    res.json({

      success: true,

      total: verifications.length,

      verifications

    });


  } catch (error) {

    console.error(
      "Get pending verifications error:",
      error
    );

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

};

// ============================================================
// GET VERIFICATION DETAILS
// ============================================================

exports.getVerificationDetails = async (req, res) => {

  try {

    const { id } = req.params;


    const [[verification]] = await pool.query(`
      SELECT

        vs.id,
        vs.user_id,
        vs.user_role_id,
        vs.verification_type,
        vs.status,
        vs.submitted_at,
        vs.reviewed_at,
        vs.reviewed_by,
        vs.rejection_reason,
        vs.admin_notes,
        vs.updated_at,

        u.fullName,
        u.email,
        u.phone,
        u.county,
        u.subcounty,
        u.ward,

        ur.role,
        ur.status AS role_status

      FROM verification_submissions vs

      JOIN users u
        ON u.id = vs.user_id

      JOIN user_roles ur
        ON ur.id = vs.user_role_id

      WHERE vs.id = ?

      LIMIT 1
    `, [id]);


    if (!verification) {

      return res.status(404).json({

        success: false,

        error: "Verification submission not found."

      });

    }


    const [documents] = await pool.query(`
      SELECT

        id,
        verification_id,
        document_type,
        document_number,
        file_path,
        original_filename,
        mime_type,
        uploaded_at

      FROM verification_documents

      WHERE verification_id = ?

      ORDER BY uploaded_at ASC
    `, [id]);


    res.json({

      success: true,

      verification,

      documents

    });


  } catch (error) {

    console.error(
      "Get verification details error:",
      error
    );

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

};

// ============================================================
// APPROVE VERIFICATION
// ============================================================

exports.approveVerification = async (req, res) => {

  const connection =
    await pool.getConnection();

  try {

    const { id } = req.params;

    const adminId =
      req.user.id;


    await connection.beginTransaction();


    // --------------------------------------------------------
    // FIND VERIFICATION
    // --------------------------------------------------------

    const [[verification]] =
      await connection.query(`
        SELECT
          id,
          user_id,
          user_role_id,
          verification_type,
          status

        FROM verification_submissions

        WHERE id = ?

        FOR UPDATE
      `, [id]);


    if (!verification) {

      await connection.rollback();

      return res.status(404).json({

        success: false,

        error:
          "Verification submission not found."

      });

    }


    // --------------------------------------------------------
    // PREVENT DOUBLE APPROVAL
    // --------------------------------------------------------

    if (
      verification.status ===
      "approved"
    ) {

      await connection.rollback();

      return res.status(400).json({

        success: false,

        error:
          "This verification has already been approved."

      });

    }


    // --------------------------------------------------------
    // APPROVE VERIFICATION
    // --------------------------------------------------------

    await connection.query(`
      UPDATE verification_submissions

      SET
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = ?,
        rejection_reason = NULL,
        updated_at = NOW()

      WHERE id = ?
    `, [
      adminId,
      id
    ]);


    // --------------------------------------------------------
    // ACTIVATE ROLE
    // --------------------------------------------------------

    await connection.query(`
      UPDATE user_roles

      SET
        status = 'active'

      WHERE id = ?
    `, [
      verification.user_role_id
    ]);


    await connection.commit();


    res.json({

      success: true,

      message:
        `${verification.verification_type} verification approved successfully.`,

      verificationId:
        verification.id,

      userId:
        verification.user_id,

      userRoleId:
        verification.user_role_id,

      role:
        verification.verification_type,

      status:
        "approved"

    });


  } catch (error) {

    await connection.rollback();

    console.error(
      "Approve verification error:",
      error
    );

    res.status(500).json({

      success: false,

      error: error.message

    });


  } finally {

    connection.release();

  }

};

// ============================================================
// REJECT VERIFICATION
// ============================================================

exports.rejectVerification = async (req, res) => {

  const connection =
    await pool.getConnection();

  try {

    const { id } = req.params;

    const adminId =
      req.user.id;

    const {
      rejection_reason,
      admin_notes
    } = req.body;


    if (
      !rejection_reason ||
      !rejection_reason.trim()
    ) {

      return res.status(400).json({

        success: false,

        error:
          "A rejection reason is required."

      });

    }


    await connection.beginTransaction();


    // --------------------------------------------------------
    // FIND VERIFICATION
    // --------------------------------------------------------

    const [[verification]] =
      await connection.query(`
        SELECT

          id,
          user_id,
          user_role_id,
          verification_type,
          status

        FROM verification_submissions

        WHERE id = ?

        FOR UPDATE
      `, [id]);


    if (!verification) {

      await connection.rollback();

      return res.status(404).json({

        success: false,

        error:
          "Verification submission not found."

      });

    }


    // --------------------------------------------------------
    // REJECT VERIFICATION
    // --------------------------------------------------------

    await connection.query(`
      UPDATE verification_submissions

      SET

        status = 'rejected',

        reviewed_at = NOW(),

        reviewed_by = ?,

        rejection_reason = ?,

        admin_notes = ?,

        updated_at = NOW()

      WHERE id = ?
    `, [
      adminId,
      rejection_reason.trim(),
      admin_notes || null,
      id
    ]);


    // --------------------------------------------------------
    // MARK ROLE AS REJECTED
    // --------------------------------------------------------

    await connection.query(`
      UPDATE user_roles

      SET
        status = 'rejected'

      WHERE id = ?
    `, [
      verification.user_role_id
    ]);


    await connection.commit();


    res.json({

      success: true,

      message:
        `${verification.verification_type} verification rejected.`,

      verificationId:
        verification.id,

      userId:
        verification.user_id,

      userRoleId:
        verification.user_role_id,

      role:
        verification.verification_type,

      status:
        "rejected",

      rejectionReason:
        rejection_reason.trim()

    });


  } catch (error) {

    await connection.rollback();

    console.error(
      "Reject verification error:",
      error
    );

    res.status(500).json({

      success: false,

      error: error.message

    });


  } finally {

    connection.release();

  }

};

exports.exportUsersPDF = async (req, res) => {

  try {

    const adminId = req.user.id;


    // =====================================================
    // BRAND COLORS
    // =====================================================

    const BRAND_GREEN = "#2E7D32";
    const DARK_GREEN = "#1B5E20";
    const LIGHT_GREEN = "#EAF5EC";
    const DARK_TEXT = "#1F2937";
    const MUTED_TEXT = "#6B7280";
    const BORDER = "#D9E2DC";
    const LIGHT_GRAY = "#F7F9F8";
    const WHITE = "#FFFFFF";
    const RED = "#B42318";


    // =====================================================
    // GET ADMIN DETAILS
    // =====================================================

    const [[admin]] = await pool.query(
      `
      SELECT
        id,
        fullName,
        email
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [adminId]
    );


    if (!admin) {

      return res.status(404).json({
        success: false,
        message: "Administrator account not found."
      });

    }


    const generatedBy =
      admin.fullName ||
      admin.email ||
      "System Administrator";


    // =====================================================
    // GENERATED DATE
    // =====================================================

    const generatedAt =
      new Date().toLocaleString(
        "en-KE",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      );


    // =====================================================
    // GENERATE UNIQUE REPORT ID
    // =====================================================

    const now =
      new Date();

    const datePart =
      now
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

    const timePart =
      now
        .toTimeString()
        .slice(0, 5)
        .replace(":", "");

    const randomPart =
      crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase();

    const reportId =
      `UMR-${datePart}-${timePart}-${randomPart}`;


    // =====================================================
    // FILTERS
    // =====================================================

    const search =
      String(
        req.query.search || ""
      ).trim();


    const status =
      String(
        req.query.status || "all"
      )
        .trim()
        .toLowerCase();


    const accountType =
      String(
        req.query.accountType || "all"
      )
        .trim()
        .toLowerCase();


    // =====================================================
    // BUILD USER QUERY
    // =====================================================

    let sql = `
      SELECT
        id,
        fullName,
        email,
        phone,
        accountType,
        county,
        createdAt,
        isActive
      FROM users
      WHERE 1 = 1
    `;


    const params = [];


    // =====================================================
    // SEARCH
    // =====================================================

    if (search) {

      sql += `
        AND (
          fullName LIKE ?
          OR email LIKE ?
          OR phone LIKE ?
          OR county LIKE ?
        )
      `;


      const searchValue =
        `%${search}%`;


      params.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );

    }


    // =====================================================
    // STATUS FILTER
    // =====================================================

    if (status === "active") {

      sql += `
        AND isActive = 1
      `;

    }


    if (status === "suspended") {

      sql += `
        AND isActive = 0
      `;

    }


    // =====================================================
    // ACCOUNT TYPE FILTER
    // =====================================================

    if (
      accountType !== "all" &&
      accountType
    ) {

      sql += `
        AND LOWER(accountType) = ?
      `;

      params.push(accountType);

    }


    // =====================================================
    // ORDER
    // =====================================================

    sql += `
      ORDER BY createdAt DESC
    `;


    // =====================================================
    // GET USERS
    // =====================================================

    const [users] =
      await pool.query(
        sql,
        params
      );


    // =====================================================
    // CREATE PDF
    // =====================================================

    const doc =
      new PDFDocument({
        size: "A4",
        margins: {
          top: 40,
          bottom: 55,
          left: 42,
          right: 42
        },
        autoFirstPage: true
      });


    // =====================================================
    // RESPONSE HEADERS
    // =====================================================

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );


    res.setHeader(
      "Content-Disposition",
      `attachment; filename="agriconnect-user-report-${reportId}.pdf"`
    );


    // =====================================================
    // PIPE PDF
    // =====================================================

    doc.pipe(res);


    // =====================================================
    // PAGE NUMBER
    // =====================================================

    let pageNumber = 1;


    // =====================================================
    // HELPER: DRAW HEADER
    // =====================================================

    const drawHeader = () => {

      const pageWidth =
        doc.page.width;


      // Header background

      doc
        .rect(
          0,
          0,
          pageWidth,
          105
        )
        .fill(LIGHT_GREEN);


      // Logo

      try {

        doc.image(
          logoPath,
          42,
          18,
          {
            width: 68
          }
        );

      } catch (logoError) {

        console.warn(
          "Could not load AgriConnect logo:",
          logoError.message
        );

      }


      // Brand name

      doc
        .fillColor(BRAND_GREEN)
        .font("Helvetica-Bold")
        .fontSize(21)
        .text(
          "AGRICONNECT AFRICA",
          125,
          25
        );


      // System name

      doc
        .fillColor(DARK_TEXT)
        .font("Helvetica")
        .fontSize(9)
        .text(
          "ADMINISTRATIVE MANAGEMENT SYSTEM",
          126,
          52
        );


      // Report title

      doc
        .fillColor(BRAND_GREEN)
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(
          "USER MANAGEMENT REPORT",
          126,
          70
        );


      // Reset

      doc.fillColor(DARK_TEXT);

    };


  // =====================================================
// HELPER: DRAW FOOTER
// =====================================================

const drawFooter = () => {

  const pageWidth =
    doc.page.width;

  const pageHeight =
    doc.page.height;


  // -----------------------------------------------------
  // FOOTER POSITION
  // -----------------------------------------------------

  // IMPORTANT:
  // Keep footer ABOVE PDFKit's bottom margin.

  const footerLineY =
    pageHeight - 80;

  const footerTextY =
    pageHeight - 68;


  // -----------------------------------------------------
  // DIVIDER
  // -----------------------------------------------------

  doc
    .save()

    .moveTo(
      42,
      footerLineY
    )

    .lineTo(
      pageWidth - 42,
      footerLineY
    )

    .strokeColor(BORDER)
    .lineWidth(1)
    .stroke();


  // -----------------------------------------------------
  // FOOTER TEXT
  // -----------------------------------------------------

  doc
    .fillColor(MUTED_TEXT)
    .font("Helvetica")
    .fontSize(7);


  // -----------------------------------------------------
  // LEFT
  // -----------------------------------------------------

  doc.text(
    "AgriConnect Africa • Administrative Management System",

    42,
    footerTextY,

    {
      width: 230,
      height: 10,
      lineBreak: false
    }
  );


  // -----------------------------------------------------
  // CENTER
  // -----------------------------------------------------

  doc.text(
    "Confidential Administrative Document",

    275,
    footerTextY,

    {
      width: 170,
      height: 10,
      align: "center",
      lineBreak: false
    }
  );


  // -----------------------------------------------------
  // RIGHT
  // -----------------------------------------------------

  doc.text(
    `Page ${pageNumber}`,

    465,
    footerTextY,

    {
      width: 87,
      height: 10,
      align: "right",
      lineBreak: false
    }
  );


  // -----------------------------------------------------
  // RESET
  // -----------------------------------------------------

  doc
    .restore();

};


    // =====================================================
    // HELPER: DRAW REPORT INFORMATION
    // =====================================================

    const drawReportInformation = () => {

      const y = 125;


      doc
        .fillColor(DARK_TEXT)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(
          "REPORT INFORMATION",
          42,
          y
        );


      // Left card

      doc
        .roundedRect(
          42,
          y + 20,
          250,
          68,
          6
        )
        .fill(LIGHT_GRAY);


      doc
        .fillColor(MUTED_TEXT)
        .font("Helvetica")
        .fontSize(8)
        .text(
          "REPORT ID",
          55,
          y + 31
        );


      doc
        .fillColor(DARK_TEXT)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          reportId,
          55,
          y + 44
        );


      doc
        .fillColor(MUTED_TEXT)
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Total records: ${users.length}`,
          55,
          y + 61
        );


      // Right card

      doc
        .roundedRect(
          307,
          y + 20,
          245,
          68,
          6
        )
        .fill(LIGHT_GRAY);


      doc
        .fillColor(MUTED_TEXT)
        .font("Helvetica")
        .fontSize(8)
        .text(
          "GENERATED BY",
          320,
          y + 31
        );


      doc
        .fillColor(DARK_TEXT)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          generatedBy,
          320,
          y + 44
        );


      doc
        .fillColor(MUTED_TEXT)
        .font("Helvetica")
        .fontSize(8)
        .text(
          generatedAt,
          320,
          y + 61
        );


      doc.fillColor(DARK_TEXT);

    };


    // =====================================================
    // HELPER: DRAW FILTERS
    // =====================================================

    const drawFilters = () => {

      const y = 225;


      doc
        .fillColor(DARK_TEXT)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(
          "FILTERS APPLIED",
          42,
          y
        );


      doc
        .roundedRect(
          42,
          y + 18,
          510,
          44,
          6
        )
        .fill(LIGHT_GREEN);


      doc
        .fillColor(DARK_TEXT)
        .font("Helvetica")
        .fontSize(8.5);


      doc.text(
        `Search: ${search || "All"}`,
        55,
        y + 35,
        {
          width: 165,
          ellipsis: true
        }
      );


      doc.text(
        `Status: ${
          status === "all"
            ? "All"
            : status
        }`,
        230,
        y + 35,
        {
          width: 140
        }
      );


      doc.text(
        `Account Type: ${
          accountType === "all"
            ? "All"
            : accountType
        }`,
        380,
        y + 35,
        {
          width: 155,
          ellipsis: true
        }
      );


      doc.fillColor(DARK_TEXT);

    };


    // =====================================================
    // TABLE SETTINGS
    // =====================================================

    const startX = 42;

    const tableWidth = 510;

    const widths = {

      user: 125,

      email: 150,

      role: 70,

      county: 85,

      status: 80

    };


    // =====================================================
    // HELPER: DRAW TABLE HEADER
    // =====================================================

    const drawTableHeader = (tableY) => {

      doc
        .roundedRect(
          startX,
          tableY,
          tableWidth,
          25,
          4
        )
        .fill(BRAND_GREEN);


      doc
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .fontSize(8);


      doc.text(
        "USER",
        startX + 8,
        tableY + 8,
        {
          width: widths.user - 12
        }
      );


      doc.text(
        "EMAIL",
        startX +
          widths.user +
          8,
        tableY + 8,
        {
          width: widths.email - 12
        }
      );


      doc.text(
        "ROLE",
        startX +
          widths.user +
          widths.email +
          8,
        tableY + 8,
        {
          width: widths.role - 12
        }
      );


      doc.text(
        "COUNTY",
        startX +
          widths.user +
          widths.email +
          widths.role +
          8,
        tableY + 8,
        {
          width: widths.county - 12
        }
      );


      doc.text(
        "STATUS",
        startX +
          widths.user +
          widths.email +
          widths.role +
          widths.county +
          8,
        tableY + 8,
        {
          width: widths.status - 12
        }
      );


      doc.fillColor(DARK_TEXT);

    };


    // =====================================================
    // HELPER: DRAW USER ROW
    // =====================================================

    const drawUserRow = (
      user,
      rowY,
      index
    ) => {

      const rowHeight = 25;


      // Alternating row background

      if (index % 2 === 0) {

        doc
          .rect(
            startX,
            rowY,
            tableWidth,
            rowHeight
          )
          .fill(LIGHT_GRAY);

      }


      // Bottom border

      doc
        .moveTo(
          startX,
          rowY + rowHeight
        )
        .lineTo(
          startX + tableWidth,
          rowY + rowHeight
        )
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();


      const statusText =
        Number(user.isActive) === 1
          ? "Active"
          : "Suspended";


      // User

      doc
        .fillColor(DARK_TEXT)
        .font("Helvetica")
        .fontSize(8)
        .text(
          user.fullName || "N/A",
          startX + 8,
          rowY + 8,
          {
            width: widths.user - 12,
            ellipsis: true
          }
        );


      // Email

      doc.text(
        user.email || "N/A",
        startX +
          widths.user +
          8,
        rowY + 8,
        {
          width: widths.email - 12,
          ellipsis: true
        }
      );


      // Role

      doc.text(
        user.accountType || "N/A",
        startX +
          widths.user +
          widths.email +
          8,
        rowY + 8,
        {
          width: widths.role - 12,
          ellipsis: true
        }
      );


      // County

      doc.text(
        user.county || "N/A",
        startX +
          widths.user +
          widths.email +
          widths.role +
          8,
        rowY + 8,
        {
          width: widths.county - 12,
          ellipsis: true
        }
      );


      // Status

      doc
        .font("Helvetica-Bold")
        .fillColor(
          statusText === "Active"
            ? BRAND_GREEN
            : RED
        )
        .text(
          statusText,
          startX +
            widths.user +
            widths.email +
            widths.role +
            widths.county +
            8,
          rowY + 8,
          {
            width: widths.status - 12
          }
        );


      doc.fillColor(DARK_TEXT);

    };


    // =====================================================
    // FIRST PAGE
    // =====================================================

    drawHeader();

    drawReportInformation();

    drawFilters();


    let y = 292;


    doc
      .fillColor(DARK_TEXT)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(
        "USERS",
        startX,
        y
      );


    y += 20;


    drawTableHeader(y);


    y += 25;


    // =====================================================
    // USERS
    // =====================================================

    if (users.length > 0) {

      users.forEach(
        (user, index) => {

          // Need a new page

          if (
  y >
  doc.page.height - 115
) {

  drawFooter();

  doc.addPage();

  pageNumber++;

  drawHeader();

  y = 125;

  doc
    .fillColor(DARK_TEXT)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(
      "USER MANAGEMENT REPORT — CONTINUED",
      startX,
      y
    );

  y += 20;

  drawTableHeader(y);

  y += 25;

}


          drawUserRow(
            user,
            y,
            index
          );


          y += 25;

        }
      );

    } else {

      doc
        .fillColor(MUTED_TEXT)
        .font("Helvetica")
        .fontSize(9)
        .text(
          "No users match the selected filters.",
          startX + 8,
          y + 10
        );

    }


    // =====================================================
    // REPORT SUMMARY
    // =====================================================

    y += 18;


    if (
      y >
      doc.page.height - 120
    ) {

      drawFooter();

      doc.addPage();

      pageNumber++;

      drawHeader();

      y = 125;

    }


    doc
      .roundedRect(
        startX,
        y,
        tableWidth,
        48,
        6
      )
      .fill(LIGHT_GREEN);


    doc
      .fillColor(DARK_GREEN)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(
        "REPORT SUMMARY",
        startX + 12,
        y + 10
      );


    doc
      .fillColor(DARK_TEXT)
      .font("Helvetica")
      .fontSize(8)
      .text(
        `${users.length} user${
          users.length === 1
            ? ""
            : "s"
        } included in this report based on the selected filters.`,
        startX + 12,
        y + 26,
        {
          width: 485
        }
      );


    doc.fillColor(DARK_TEXT);


    // =====================================================
    // FOOTER
    // =====================================================

    drawFooter();


    // =====================================================
    // AUDIT REPORT GENERATION
    // =====================================================

    await auditService.logAction({

      actorUserId:
        adminId,

      action:
        "USER_REPORT_GENERATED",

      entityType:
        "USER_REPORT",

      entityId:
        null,

      description:
        `Administrator generated user management report ${reportId}.`,

      oldValues:
        null,

      newValues: {

        reportId,

        reportType:
          "USER_MANAGEMENT",

        search:
          search || null,

        status,

        accountType,

        resultCount:
          users.length,

        generatedBy:
          generatedBy,

        generatedAt:
          new Date().toISOString()

      },

      ipAddress:
        req.ip,

      userAgent:
        req.get("user-agent")

    });


    // =====================================================
    // FINISH PDF
    // =====================================================

    doc.end();


  } catch (error) {

    console.error(
      "EXPORT USERS PDF ERROR:",
      error
    );


    if (!res.headersSent) {

      return res.status(500).json({

        success: false,

        message:
          "Failed to generate user report."

      });

    }

  }

};

// =====================================================
// GET TRANSACTION LEDGER
// =====================================================

exports.getTransactions = async (req, res) => {

  try {

    const search =
      String(req.query.search || "").trim();

    const status =
      String(req.query.status || "").trim().toLowerCase();

    const dateFrom =
      String(req.query.dateFrom || "").trim();

    const dateTo =
      String(req.query.dateTo || "").trim();


    let sql = `
      SELECT

        o.id,

        o.quantity,

        o.total_price,

        o.status,

        o.created_at,

        p.product_name,

        buyer.id AS buyer_id,
        buyer.fullName AS buyer_name,
        buyer.email AS buyer_email,

        seller.id AS seller_id,
        seller.fullName AS seller_name,
        seller.email AS seller_email

      FROM orders o

      JOIN products p
        ON p.id = o.product_id

      JOIN users buyer
        ON buyer.id = o.buyer_id

      JOIN users seller
        ON seller.id = o.seller_id

      WHERE 1 = 1
    `;


    const params = [];


    // =====================================================
    // SEARCH
    // =====================================================

    if (search) {

      sql += `
        AND (
          buyer.fullName LIKE ?
          OR buyer.email LIKE ?
          OR seller.fullName LIKE ?
          OR seller.email LIKE ?
          OR p.product_name LIKE ?
          OR CAST(o.id AS CHAR) LIKE ?
        )
      `;

      const searchValue =
        `%${search}%`;

      params.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );

    }


    // =====================================================
    // STATUS
    // =====================================================

    if (status) {

      sql += `
        AND o.status = ?
      `;

      params.push(status);

    }


    // =====================================================
    // DATE FROM
    // =====================================================

    if (dateFrom) {

      sql += `
        AND DATE(o.created_at) >= ?
      `;

      params.push(dateFrom);

    }


    // =====================================================
    // DATE TO
    // =====================================================

    if (dateTo) {

      sql += `
        AND DATE(o.created_at) <= ?
      `;

      params.push(dateTo);

    }


    // =====================================================
    // ORDER
    // =====================================================

    sql += `
      ORDER BY o.created_at DESC
    `;


    const [transactions] =
      await pool.query(
        sql,
        params
      );


    // =====================================================
    // FINANCIAL SUMMARY FOR FILTERED RESULTS
    // =====================================================

    let totalValue = 0;

    let delivered = 0;

    let pending = 0;

    let cancelled = 0;


    transactions.forEach(
      transaction => {

        const amount =
          Number(
            transaction.total_price || 0
          );


        totalValue += amount;


        if (
          transaction.status === "delivered"
        ) {

          delivered++;

        }

        if (
          transaction.status === "pending"
        ) {

          pending++;

        }

        if (
          transaction.status === "cancelled"
        ) {

          cancelled++;

        }

      }
    );


    const averageTransaction =
      transactions.length > 0
        ? totalValue / transactions.length
        : 0;


    return res.json({

      success: true,

      transactions,

      summary: {

        transactionCount:
          transactions.length,

        transactionValue:
          totalValue,

        averageTransaction,

        deliveredOrders:
          delivered,

        pendingOrders:
          pending,

        cancelledOrders:
          cancelled

      }

    });


  } catch (error) {

    console.error(
      "GET TRANSACTIONS ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to load transactions."

    });

  }

};


// ============================================================
// SUPER ADMIN - GET ADMINISTRATORS
// ============================================================

exports.getAdministrators = async (req, res) => {

    try {

        const [admins] = await pool.query(`
            SELECT

                aa.id AS admin_access_id,

                aa.user_id,

                aa.admin_level,

                aa.is_active,

                aa.created_at,

                aa.created_by,

                u.fullName,

                u.email,

                u.phone,

                u.isActive AS user_is_active,

                creator.fullName AS created_by_name

            FROM admin_access aa

            INNER JOIN users u
                ON u.id = aa.user_id

            LEFT JOIN users creator
                ON creator.id = aa.created_by

            ORDER BY
                aa.admin_level DESC,
                aa.created_at DESC
        `);


        console.log(
            "ADMINISTRATORS RETURNED:",
            admins
        );


        return res.json({

            success: true,

            administrators: admins

        });


    } catch (error) {

        console.error(
            "GET ADMINISTRATORS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Failed to load administrators."

        });

    }

};

// ============================================================
// SUPER ADMIN - CREATE ADMINISTRATOR
// ============================================================

exports.createAdministrator = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const {
            fullName,
            email,
            phone,
            password
        } = req.body;


        // ----------------------------------------------------
        // 1. VALIDATE REQUIRED FIELDS
        // ----------------------------------------------------

        if (
            !fullName ||
            !email ||
            !phone ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                error:
                    "Full name, email, phone and password are required."
            });

        }


        // ----------------------------------------------------
        // 2. NORMALIZE INPUT
        // ----------------------------------------------------

        const cleanName =
            String(fullName).trim();

        const cleanEmail =
            String(email)
                .trim()
                .toLowerCase();

        const cleanPhone =
            String(phone).trim();


        // ----------------------------------------------------
        // 3. VALIDATE PASSWORD
        // ----------------------------------------------------

        if (password.length < 8) {

            return res.status(400).json({
                success: false,
                error:
                    "Password must contain at least 8 characters."
            });

        }


        // ----------------------------------------------------
        // 4. CHECK EXISTING USER
        // ----------------------------------------------------

        const [existingUsers] =
            await connection.query(
                `
                SELECT
                    id,
                    email
                FROM users
                WHERE email = ?
                LIMIT 1
                `,
                [cleanEmail]
            );


        if (existingUsers.length > 0) {

            return res.status(409).json({
                success: false,
                error:
                    "A user with this email already exists."
            });

        }


        // ----------------------------------------------------
        // 5. HASH PASSWORD
        // ----------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(password, 12);


        // ----------------------------------------------------
        // 6. START TRANSACTION
        // ----------------------------------------------------

        await connection.beginTransaction();


        // ----------------------------------------------------
        // 7. CREATE USER ACCOUNT
        // ----------------------------------------------------

        const [userResult] =
            await connection.query(
                `
                INSERT INTO users
                (
                    fullName,
                    email,
                    phone,
                    password,
                    accountType,
                    isActive
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    cleanName,
                    cleanEmail,
                    cleanPhone,
                    hashedPassword,
                    "admin",
                    1
                ]
            );


        // ----------------------------------------------------
        // 8. GET NEW USER ID
        // ----------------------------------------------------

        const newUserId =
            userResult.insertId;


        console.log(
            "NEW ADMIN USER CREATED:",
            newUserId
        );


        // ----------------------------------------------------
        // 9. CREATE ADMIN ACCESS
        // ----------------------------------------------------

        const [adminResult] =
            await connection.query(
                `
                INSERT INTO admin_access
                (
                    user_id,
                    admin_level,
                    is_active,
                    created_by
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    newUserId,
                    "admin",
                    1,
                    req.user.id
                ]
            );


        const adminAccessId =
            adminResult.insertId;


        console.log(
            "ADMIN ACCESS CREATED:",
            adminAccessId
        );


        // ----------------------------------------------------
        // 10. VERIFY ADMIN ACCESS BEFORE COMMIT
        // ----------------------------------------------------

        const [[adminAccess]] =
            await connection.query(
                `
                SELECT
                    id,
                    user_id,
                    admin_level,
                    is_active,
                    created_by
                FROM admin_access
                WHERE id = ?
                LIMIT 1
                `,
                [adminAccessId]
            );


        if (!adminAccess) {

            throw new Error(
                "Administrator access record was not created."
            );

        }


        console.log(
            "ADMIN ACCESS VERIFIED:",
            adminAccess
        );


        // ----------------------------------------------------
        // 11. COMMIT TRANSACTION
        // ----------------------------------------------------

        await connection.commit();


        console.log(
            "ADMINISTRATOR CREATION COMMITTED:",
            {
                userId: newUserId,
                adminAccessId
            }
        );


        // ----------------------------------------------------
        // 12. RESPONSE
        // ----------------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Administrator created successfully.",

            administrator: {

                admin_access_id:
                    adminAccessId,

                user_id:
                    newUserId,

                fullName:
                    cleanName,

                email:
                    cleanEmail,

                phone:
                    cleanPhone,

                admin_level:
                    "admin",

                is_active:
                    1

            }

        });


    } catch (error) {

        // ----------------------------------------------------
        // ROLLBACK
        // ----------------------------------------------------

        try {

            await connection.rollback();

        } catch (rollbackError) {

            console.error(
                "ROLLBACK ERROR:",
                rollbackError
            );

        }


        console.error(
            "CREATE ADMINISTRATOR ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Failed to create administrator."

        });

    } finally {

        connection.release();

    }

};

// ============================================================
// SUPER ADMIN - UPDATE ADMIN STATUS
// ============================================================

exports.updateAdministratorStatus = async (req, res) => {

  try {

    const superAdminId =
      req.user.id;

    const adminAccessId =
    Number(req.params.id);

    const {
      isActive,
      reason
    } = req.body;

    if (!Number.isInteger(adminAccountId)) {

      return res.status(400).json({

        success: false,

        error:
          "Invalid administrator ID."

      });

    }

    if (
      isActive !== true &&
      isActive !== false
    ) {

      return res.status(400).json({

        success: false,

        error:
          "isActive must be true or false."

      });

    }

    if (
      !reason ||
      !String(reason).trim()
    ) {

      return res.status(400).json({

        success: false,

        error:
          "A reason is required."

      });

    }

    const [[admin]] =
    await connection.query(
        `
        SELECT
            acc.id AS admin_access_id,
            acc.user_id,
            acc.admin_level,
            acc.is_active,
            u.fullName,
            u.email

        FROM admin_access acc

        INNER JOIN users u
            ON u.id = acc.user_id

        WHERE acc.id = ?

        LIMIT 1
        `,
        [adminAccessId]
    );

    if (!admin) {

      return res.status(404).json({

        success: false,

        error:
          "Administrator not found."

      });

    }

    // --------------------------------------------------------
    // PREVENT SELF-DEACTIVATION
    // --------------------------------------------------------

    if (
      Number(admin.user_id) ===
      Number(superAdminId)
    ) {

      return res.status(400).json({

        success: false,

        error:
          "You cannot deactivate your own administrator account."

      });

    }

    // --------------------------------------------------------
    // PREVENT SUPER ADMIN DEACTIVATION
    // --------------------------------------------------------

    if (
      admin.admin_level ===
      "super_admin"
    ) {

      return res.status(403).json({

        success: false,

        error:
          "A super administrator cannot be deactivated through this operation."

      });

    }

    const currentStatus =
      Number(admin.is_active) === 1;

    if (
      currentStatus === isActive
    ) {

      return res.status(400).json({

        success: false,

        error:
          isActive
            ? "Administrator is already active."
            : "Administrator is already inactive."

      });

    }

    // --------------------------------------------------------
    // UPDATE ADMIN ACCOUNT
    // --------------------------------------------------------

    await pool.query(
      `
      UPDATE admin_accounts
      SET is_active = ?
      WHERE id = ?
      `,
      [
        isActive ? 1 : 0,
        adminAccountId
      ]
    );

    // --------------------------------------------------------
    // ALSO CONTROL USER LOGIN
    // --------------------------------------------------------

    await pool.query(
      `
      UPDATE users
      SET isActive = ?
      WHERE id = ?
      `,
      [
        isActive ? 1 : 0,
        admin.user_id
      ]
    );

    // --------------------------------------------------------
    // AUDIT
    // --------------------------------------------------------

    await auditService.logAction({

      actorUserId:
        superAdminId,

      action:
        isActive
          ? "ADMIN_ACTIVATED"
          : "ADMIN_DEACTIVATED",

      entityType:
        "ADMIN_ACCOUNT",

      entityId:
        adminAccountId,

      description:
        `${admin.fullName} was ${
          isActive
            ? "activated"
            : "deactivated"
        }. Reason: ${String(reason).trim()}`,

      oldValues: {

        isActive:
          currentStatus ? 1 : 0

      },

      newValues: {

        isActive:
          isActive ? 1 : 0,

        reason:
          String(reason).trim()

      },

      ipAddress:
        req.ip,

      userAgent:
        req.get("user-agent")

    });

    return res.json({

      success: true,

      message:
        isActive
          ? "Administrator activated successfully."
          : "Administrator deactivated successfully."

    });

  } catch (error) {

    console.error(
      "UPDATE ADMIN STATUS ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        "Failed to update administrator status."

    });

  }

};

// ============================================================
// SUPER ADMIN - UPDATE ADMINISTRATOR STATUS
// ============================================================

exports.updateAdministratorStatus = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { id } = req.params;
        const { isActive } = req.body;

        const adminAccessId = Number(id);

        // ----------------------------------------------------
        // 1. VALIDATE ID
        // ----------------------------------------------------

        if (!Number.isInteger(adminAccessId) || adminAccessId <= 0) {

            return res.status(400).json({
                success: false,
                error: "Invalid administrator ID."
            });

        }

        // ----------------------------------------------------
        // 2. VALIDATE STATUS
        // ----------------------------------------------------

        if (
            typeof isActive !== "boolean" &&
            isActive !== 0 &&
            isActive !== 1
        ) {

            return res.status(400).json({
                success: false,
                error:
                    "isActive must be true, false, 1 or 0."
            });

        }

        const newStatus =
            isActive === true || isActive === 1 ? 1 : 0;

        // ----------------------------------------------------
        // 3. FIND ADMINISTRATOR
        // ----------------------------------------------------

        const [[administrator]] =
            await connection.query(
                `
                SELECT
                    aa.id,
                    aa.user_id,
                    aa.admin_level,
                    aa.is_active,
                    u.fullName,
                    u.email
                FROM admin_access aa
                INNER JOIN users u
                    ON u.id = aa.user_id
                WHERE aa.id = ?
                LIMIT 1
                `,
                [adminAccessId]
            );

        if (!administrator) {

            return res.status(404).json({
                success: false,
                error: "Administrator not found."
            });

        }

        // ----------------------------------------------------
        // 4. PREVENT SELF-DEACTIVATION
        // ----------------------------------------------------

        if (
            administrator.user_id === req.user.id &&
            newStatus === 0
        ) {

            return res.status(400).json({
                success: false,
                error:
                    "You cannot deactivate your own administrator account."
            });

        }

        // ----------------------------------------------------
        // 5. PROTECT LAST SUPER ADMIN
        // ----------------------------------------------------

        if (
            administrator.admin_level === "super_admin" &&
            newStatus === 0
        ) {

            const [[countResult]] =
    await connection.query(
        `
        SELECT COUNT(*) AS total
        FROM admin_access
        WHERE admin_level = 'super_admin'
        AND is_active = 1
        `
    );

            if (Number(countResult.total) <= 1) {

                return res.status(400).json({
                    success: false,
                    error:
                        "The last active Super Admin cannot be deactivated."
                });

            }

        }

        // ----------------------------------------------------
        // 6. START TRANSACTION
        // ----------------------------------------------------

        await connection.beginTransaction();

        // ----------------------------------------------------
        // 7. UPDATE ADMIN ACCESS
        // ----------------------------------------------------

        await connection.query(
            `
            UPDATE admin_access
            SET is_active = ?
            WHERE id = ?
            `,
            [
                newStatus,
                adminAccessId
            ]
        );

        // ----------------------------------------------------
        // 8. UPDATE USER ACCOUNT STATUS
        // ----------------------------------------------------

        await connection.query(
            `
            UPDATE users
            SET isActive = ?
            WHERE id = ?
            `,
            [
                newStatus,
                administrator.user_id
            ]
        );

        // ----------------------------------------------------
        // 9. INVALIDATE EXISTING TOKENS WHEN DISABLED
        // ----------------------------------------------------

        if (newStatus === 0) {

            await connection.query(
                `
                UPDATE users
                SET token_version = token_version + 1
                WHERE id = ?
                `,
                [administrator.user_id]
            );

        }

        // ----------------------------------------------------
        // 10. COMMIT
        // ----------------------------------------------------

        await connection.commit();

        // ----------------------------------------------------
        // 11. RESPONSE
        // ----------------------------------------------------

        return res.json({

            success: true,

            message:
                newStatus === 1
                    ? "Administrator activated successfully."
                    : "Administrator deactivated successfully.",

            administrator: {

                admin_access_id:
                    administrator.id,

                user_id:
                    administrator.user_id,

                fullName:
                    administrator.fullName,

                email:
                    administrator.email,

                admin_level:
                    administrator.admin_level,

                is_active:
                    newStatus

            }

        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "UPDATE ADMINISTRATOR STATUS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            error:
                "Failed to update administrator status."
        });

    } finally {

        connection.release();

    }

};

// ============================================================
// ADMIN - CHANGE OWN PASSWORD
// ============================================================

exports.changeOwnPassword = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const userId = req.user.id;

        const {
            currentPassword,
            newPassword
        } = req.body;

        // ----------------------------------------------------
        // 1. VALIDATE INPUT
        // ----------------------------------------------------

        if (!currentPassword || !newPassword) {

            return res.status(400).json({
                success: false,
                error:
                    "Current password and new password are required."
            });

        }

        // ----------------------------------------------------
        // 2. VALIDATE NEW PASSWORD
        // ----------------------------------------------------

        const passwordValidation =
    validatePassword(newPassword);


if (!passwordValidation.valid) {

    return res.status(400).json({
        success: false,
        error:
            passwordValidation.message
    });

}

        // ----------------------------------------------------
        // 3. GET CURRENT PASSWORD
        // ----------------------------------------------------

        const [[user]] =
            await connection.query(
                `
                SELECT
                    id,
                    password,
                    token_version
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [userId]
            );

        if (!user) {

            return res.status(404).json({
                success: false,
                error: "User account not found."
            });

        }

        // ----------------------------------------------------
        // 4. VERIFY CURRENT PASSWORD
        // ----------------------------------------------------

        const passwordMatches =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                error:
                    "Current password is incorrect."
            });

        }

        // ----------------------------------------------------
        // 5. PREVENT SAME PASSWORD
        // ----------------------------------------------------

        const samePassword =
            await bcrypt.compare(
                newPassword,
                user.password
            );

        if (samePassword) {

            return res.status(400).json({
                success: false,
                error:
                    "New password must be different from the current password."
            });

        }

        // ----------------------------------------------------
        // 6. HASH NEW PASSWORD
        // ----------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                12
            );

        // ----------------------------------------------------
        // 7. UPDATE PASSWORD + INVALIDATE SESSIONS
        // ----------------------------------------------------

        await connection.beginTransaction();

        await connection.query(
            `
            UPDATE users
            SET
                password = ?,
                token_version = token_version + 1
            WHERE id = ?
            `,
            [
                hashedPassword,
                userId
            ]
        );

        await connection.commit();

        // ----------------------------------------------------
        // 8. RESPONSE
        // ----------------------------------------------------

        return res.json({

            success: true,

            message:
                "Password changed successfully. Please log in again."

        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "CHANGE OWN PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            error:
                "Failed to change password."
        });

    } finally {

        connection.release();

    }

};

// ============================================================
// SUPER ADMIN - RESET ADMINISTRATOR PASSWORD
// ============================================================

exports.resetAdministratorPassword = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { id } = req.params;
        const { newPassword } = req.body;

        const adminAccessId = Number(id);

        // ----------------------------------------------------
        // 1. VALIDATE ID
        // ----------------------------------------------------

        if (
            !Number.isInteger(adminAccessId) ||
            adminAccessId <= 0
        ) {

            return res.status(400).json({
                success: false,
                error:
                    "Invalid administrator ID."
            });

        }

        // ----------------------------------------------------
        // 2. VALIDATE PASSWORD
        // ----------------------------------------------------

        if (!newPassword) {

            return res.status(400).json({
                success: false,
                error:
                    "New password is required."
            });

        }

        const passwordValidation =
    validatePassword(newPassword);


if (!passwordValidation.valid) {

    return res.status(400).json({
        success: false,
        error:
            passwordValidation.message
    });

}

        // ----------------------------------------------------
        // 3. FIND ADMINISTRATOR
        // ----------------------------------------------------

        const [[administrator]] =
            await connection.query(
                `
                SELECT
                    aa.id,
                    aa.user_id,
                    aa.admin_level,
                    aa.is_active,
                    u.fullName,
                    u.email
                FROM admin_access aa
                INNER JOIN users u
                    ON u.id = aa.user_id
                WHERE aa.id = ?
                LIMIT 1
                `,
                [adminAccessId]
            );

        if (!administrator) {

            return res.status(404).json({
                success: false,
                error:
                    "Administrator not found."
            });

        }

        // ----------------------------------------------------
        // 4. PREVENT SELF RESET
        // ----------------------------------------------------

        if (
            administrator.user_id === req.user.id
        ) {

            return res.status(400).json({
                success: false,
                error:
                    "Use your own password-change option to change your password."
            });

        }

        // ----------------------------------------------------
        // 5. HASH PASSWORD
        // ----------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                12
            );

        // ----------------------------------------------------
        // 6. UPDATE PASSWORD
        // ----------------------------------------------------

        await connection.beginTransaction();

        await connection.query(
            `
            UPDATE users
            SET
                password = ?,
                token_version = token_version + 1
            WHERE id = ?
            `,
            [
                hashedPassword,
                administrator.user_id
            ]
        );

        await connection.commit();

        // ----------------------------------------------------
        // 7. RESPONSE
        // ----------------------------------------------------

        return res.json({

            success: true,

            message:
                "Administrator password reset successfully.",

            administrator: {

                admin_access_id:
                    administrator.id,

                user_id:
                    administrator.user_id,

                fullName:
                    administrator.fullName,

                email:
                    administrator.email

            }

        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "RESET ADMINISTRATOR PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            error:
                "Failed to reset administrator password."
        });

    } finally {

        connection.release();

    }

};

// ============================================================
// SUPER ADMIN - GET AVAILABLE ADMIN PERMISSIONS
// ============================================================

exports.getAdminPermissions = async (req, res) => {

    try {

        const [permissions] =
            await pool.query(`
                SELECT
                    id,
                    permission_key,
                    permission_name,
                    description
                FROM admin_permissions
                ORDER BY id ASC
            `);

        return res.json({

            success: true,

            permissions

        });

    } catch (error) {

        console.error(
            "GET ADMIN PERMISSIONS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "Failed to load administrator permissions."

        });

    }

};


// ============================================================
// SUPER ADMIN - GET ADMINISTRATOR PERMISSIONS
// ============================================================

exports.getAdministratorPermissions = async (req, res) => {

    try {

        const adminAccessId =
            Number(req.params.id);


        // ----------------------------------------------------
        // VALIDATE ID
        // ----------------------------------------------------

        if (!adminAccessId) {

            return res.status(400).json({

                success: false,

                error:
                    "Invalid administrator access ID."

            });

        }


        // ----------------------------------------------------
        // FIND ADMIN ACCESS
        // ----------------------------------------------------

        const [[administrator]] =
            await pool.query(
                `
                SELECT

                    aa.id AS admin_access_id,

                    aa.user_id,

                    aa.admin_level,

                    aa.is_active,

                    u.fullName,

                    u.email

                FROM admin_access aa

                INNER JOIN users u
                    ON u.id = aa.user_id

                WHERE aa.id = ?

                LIMIT 1
                `,
                [adminAccessId]
            );


        if (!administrator) {

            return res.status(404).json({

                success: false,

                error:
                    "Administrator not found."

            });

        }


        // ----------------------------------------------------
        // GET ASSIGNED PERMISSIONS
        // ----------------------------------------------------

        const [permissions] =
            await pool.query(
                `
                SELECT

                    ap.id,

                    ap.permission_key,

                    ap.permission_name,

                    ap.description

                FROM admin_permission_assignments apa

                INNER JOIN admin_permissions ap
                    ON ap.id = apa.permission_id

                WHERE apa.admin_access_id = ?

                ORDER BY ap.id ASC
                `,
                [adminAccessId]
            );


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.json({

            success: true,

            administrator,

            permissions

        });


    } catch (error) {

        console.error(
            "GET ADMINISTRATOR PERMISSIONS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Failed to retrieve administrator permissions."

        });

    }

};

// ============================================================
// SUPER ADMIN - UPDATE ADMINISTRATOR PERMISSIONS
// ============================================================

exports.updateAdministratorPermissions = async (
    req,
    res
) => {

    const connection =
        await pool.getConnection();


    try {

        // ----------------------------------------------------
        // THE ID IN THE URL IS admin_access.id
        // ----------------------------------------------------

        const adminAccessId =
            Number(req.params.id);


        const {
            permissions
        } = req.body;


        // ----------------------------------------------------
        // VALIDATE ID
        // ----------------------------------------------------

        if (!adminAccessId) {

            return res.status(400).json({

                success: false,

                error:
                    "Invalid administrator ID."

            });

        }


        // ----------------------------------------------------
        // VALIDATE PERMISSIONS
        // ----------------------------------------------------

        if (!Array.isArray(permissions)) {

            return res.status(400).json({

                success: false,

                error:
                    "Permissions must be an array."

            });

        }


        // ----------------------------------------------------
        // VERIFY ADMIN ACCESS
        // ----------------------------------------------------

        const [[admin]] =
            await connection.query(
                `
                SELECT

                    aa.id AS admin_access_id,

                    aa.user_id,

                    aa.admin_level,

                    aa.is_active,

                    u.fullName,

                    u.email

                FROM admin_access aa

                INNER JOIN users u
                    ON u.id = aa.user_id

                WHERE aa.id = ?

                LIMIT 1
                `,
                [adminAccessId]
            );


        if (!admin) {

            return res.status(404).json({

                success: false,

                error:
                    "Administrator not found."

            });

        }


        // ----------------------------------------------------
        // CHECK ADMIN IS ACTIVE
        // ----------------------------------------------------

        if (
            Number(admin.is_active) !== 1
        ) {

            return res.status(403).json({

                success: false,

                error:
                    "This administrator account is inactive."

            });

        }


        // ----------------------------------------------------
        // SUPER ADMIN PROTECTED
        // ----------------------------------------------------

        if (
            admin.admin_level ===
            "super_admin"
        ) {

            return res.status(403).json({

                success: false,

                error:
                    "Super administrator permissions cannot be modified."

            });

        }


        // ----------------------------------------------------
        // START TRANSACTION
        // ----------------------------------------------------

        await connection.beginTransaction();


        // ----------------------------------------------------
        // REMOVE EXISTING PERMISSIONS
        // ----------------------------------------------------

        await connection.query(
            `
            DELETE FROM admin_permission_assignments

            WHERE admin_access_id = ?
            `,
            [adminAccessId]
        );


        // ----------------------------------------------------
        // INSERT NEW PERMISSIONS
        // ----------------------------------------------------

        for (
            const permissionKey
            of permissions
        ) {

            const [[permission]] =
                await connection.query(
                    `
                    SELECT
                        id

                    FROM admin_permissions

                    WHERE permission_key = ?

                    LIMIT 1
                    `,
                    [permissionKey]
                );


            if (!permission) {

                throw new Error(
                    `Unknown permission: ${permissionKey}`
                );

            }


            await connection.query(
                `
                INSERT INTO admin_permission_assignments
                (
                    admin_access_id,
                    permission_id,
                    assigned_by
                )

                VALUES (?, ?, ?)
                `,
                [
                    adminAccessId,
                    permission.id,
                    req.user.id
                ]
            );

        }


        // ----------------------------------------------------
        // COMMIT
        // ----------------------------------------------------

        await connection.commit();


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.json({

            success: true,

            message:
                "Administrator permissions updated successfully.",

            administrator: {

                admin_access_id:
                    admin.admin_access_id,

                user_id:
                    admin.user_id,

                fullName:
                    admin.fullName,

                email:
                    admin.email,

                admin_level:
                    admin.admin_level

            },

            permissions

        });


    } catch (error) {

        // ----------------------------------------------------
        // ROLLBACK
        // ----------------------------------------------------

        try {

            await connection.rollback();

        } catch (rollbackError) {

            console.error(
                "ROLLBACK ERROR:",
                rollbackError
            );

        }


        console.error(
            "UPDATE ADMINISTRATOR PERMISSIONS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                error.message

        });


    } finally {

        connection.release();

    }

};

// ============================================================
// ADMIN - GET OWN PERMISSIONS
// ============================================================

exports.getMyAdminPermissions = async (req, res) => {

    try {

        const userId = req.user.id;


        // ----------------------------------------------------
        // GET ADMIN ACCESS
        // ----------------------------------------------------

        const [[admin]] =
            await pool.query(
                `
                SELECT
                    id,
                    user_id,
                    admin_level,
                    is_active
                FROM admin_access
                WHERE user_id = ?
                AND is_active = 1
                LIMIT 1
                `,
                [userId]
            );


        if (!admin) {

            return res.status(403).json({

                success: false,

                error:
                    "Administrator access required."

            });

        }


        // ----------------------------------------------------
        // SUPER ADMIN
        // ----------------------------------------------------

        if (
            admin.admin_level ===
            "super_admin"
        ) {

            return res.json({

                success: true,

                adminLevel:
                    "super_admin",

                permissions: [

                    "manage_users",
                    "manage_products",
                    "manage_orders",
                    "manage_bookings",
                    "manage_verifications",
                    "view_reports",
                    "view_revenue",
                    "manage_community",
                    "manage_messages",
                    "manage_settings"

                ]

            });

        }


        // ----------------------------------------------------
        // NORMAL ADMIN PERMISSIONS
        // ----------------------------------------------------

        const [permissions] =
            await pool.query(
                `
                SELECT
                    ap.permission_key,
                    ap.permission_name,
                    ap.description
                FROM admin_permission_assignments aap

                INNER JOIN admin_permissions ap
                    ON ap.id = aap.permission_id

                WHERE aap.admin_access_id = ?

                ORDER BY ap.id ASC
                `,
                [admin.id]
            );


        return res.json({

            success: true,

            adminLevel:
                admin.admin_level,

            permissions:
                permissions.map(
                    permission =>
                        permission.permission_key
                )

        });

    } catch (error) {

        console.error(
            "GET MY ADMIN PERMISSIONS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "Failed to load administrator permissions."

        });

    }

};

// ============================================================
// ADMIN - GET OWN PERMISSIONS
// ============================================================

exports.getMyPermissions = async (req, res) => {

    try {

        const userId = req.user.id;


        // ----------------------------------------------------
        // FIND ADMINISTRATOR ACCOUNT
        // ----------------------------------------------------

        const [[admin]] =
    await pool.query(
        `
        SELECT
            aa.id AS admin_access_id,
            aa.user_id,
            aa.admin_level,
            aa.is_active

        FROM admin_access aa

        WHERE aa.user_id = ?

        AND aa.is_active = 1

        LIMIT 1
        `,
        [userId]
    );


        if (!admin) {

            return res.status(403).json({

                success: false,

                error:
                    "Administrative account not found."

            });

        }


        // ----------------------------------------------------
        // SUPER ADMIN
        // ----------------------------------------------------

        if (
            admin.admin_level ===
            "super_admin"
        ) {

            const [permissions] =
                await pool.query(
                    `
                    SELECT
                        id,
                        permission_key,
                        permission_name,
                        description

                    FROM admin_permissions

                    ORDER BY id ASC
                    `
                );


            return res.json({

                success: true,

                adminLevel:
                    "super_admin",

                adminAccessId:
    admin.admin_access_id,

                permissions

            });

        }


        // ----------------------------------------------------
        // NORMAL ADMIN
        // ----------------------------------------------------

        const [permissions] =
            await pool.query(
                `
                SELECT

                    ap.id,

                    ap.permission_key,

                    ap.permission_name,

                    ap.description

                FROM admin_permission_assignments apa

                INNER JOIN admin_permissions ap
                    ON ap.id = apa.permission_id

                WHERE apa.admin_access_id = ?

                ORDER BY ap.id ASC
                `,
                [
    admin.admin_access_id
]
            );


        return res.json({

    success: true,

    adminLevel:
        "admin",

    adminAccountId:
        admin.admin_account_id,

    adminAccessId:
        admin.admin_access_id,

    permissions

});


    } catch (error) {

        console.error(
            "GET MY PERMISSIONS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Failed to load administrator permissions."

        });

    }

};