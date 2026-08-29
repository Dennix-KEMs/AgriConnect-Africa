const express = require("express");

const router = express.Router();

const { protect } =
    require("../middleware/authMiddleware");

const { adminOnly } =
    require("../middleware/adminMiddleware");

const { superAdminOnly } =
    require("../middleware/superAdminOnly");

    const {
    requireAdminPermission
} = require("../middleware/adminPermission");

const adminController =
    require("../controllers/adminController");

router.get(
  "/stats",
  protect,
  adminOnly,
  requireAdminPermission("view_reports"),
  adminController.getDashboardStats
);

router.get(
    "/users",
    protect,
    adminOnly,
    requireAdminPermission("manage_users"),
    adminController.getAllUsers
);

router.get(
  "/users/report/pdf",
  protect,
  adminOnly,
  requireAdminPermission("manage_users"),
  adminController.exportUsersPDF
);

router.get(
    "/products",
    protect,
    adminOnly,
    requireAdminPermission("manage_products"),
    adminController.getAllProducts
);

router.get(
    "/orders",
    protect,
    adminOnly,
    requireAdminPermission("manage_orders"),
    adminController.getAllOrders
);


router.get(
    "/bookings",
    protect,
    adminOnly,
    requireAdminPermission("manage_bookings"),
    adminController.getAllBookings
);

router.get(
  "/reports/transactions/:id",
  protect,
  adminOnly,
  adminController.getTransactionDetails
);

router.delete(
  "/users/:id",
  protect,
  adminOnly,
  requireAdminPermission("manage_users"),
  adminController.deleteUser
);

router.delete(
  "/products/:id",
  protect,
  adminOnly,
  requireAdminPermission("manage_products"),
  adminController.deleteProduct
);

router.patch(
  "/users/:id/status",
  protect,
  adminOnly,
  requireAdminPermission("manage_users"),
  adminController.updateUserStatus
);

router.get(
  "/activity",
  protect,
  adminOnly,
  requireAdminPermission("view_reports"),
  adminController.getUserActivity
);

router.get(
  "/login-logs",
  protect,
  adminOnly,
  requireAdminPermission("view_reports"),
  adminController.getLoginLogs
);

router.get(
  "/reports/revenue",
  protect,
  adminOnly,
  requireAdminPermission("view_reports"),
  adminController.getRevenueReport
);

router.get(
  "/reports/top-products",
  protect,
  adminOnly,
  requireAdminPermission("view_reports"),
  adminController.getTopProducts
);

router.get(
  "/reports/seller-revenue",
  protect,
  adminOnly,
  requireAdminPermission("view_reports"),
  adminController.getSellerRevenue
);

router.get(
  "/reports/monthly-revenue",
  protect,
  adminOnly,
  requireAdminPermission("view_revenue"),
  adminController.getMonthlyRevenue
);

router.get(
  "/reports/order-status",
  protect,
  adminOnly,
  requireAdminPermission("view_reports"),
  adminController.getOrderStatusStats
);

router.get(
  "/reports/recent-transactions",
  protect,
  adminOnly,
  requireAdminPermission("view_reports"),
  adminController.getRecentTransactions
);

router.get(
  "/reports/export-transactions",
  protect,
  adminOnly,
  requireAdminPermission("view_reports"),
  adminController.exportTransactionsCSV
);

router.get(
    "/reports/export-transactions-pdf",
    protect,
    adminOnly,
    requireAdminPermission("view_reports"),
    adminController.exportTransactionsPDF
);

// ============================================================
// VERIFICATION CENTER
// ============================================================

router.get(
    "/verifications",
    protect,
    adminOnly,
    requireAdminPermission("manage_verifications"),
    adminController.getPendingVerifications
);


router.get(
    "/verifications/:id",
    protect,
    adminOnly,
    requireAdminPermission("manage_verifications"),
    adminController.getVerificationDetails
);


router.patch(
    "/verifications/:id/approve",
    protect,
    adminOnly,
    requireAdminPermission("manage_verifications"),
    adminController.approveVerification
);


router.patch(
    "/verifications/:id/reject",
    protect,
    adminOnly,
    requireAdminPermission("manage_verifications"),
    adminController.rejectVerification
);

// ============================================================
// SUPER ADMIN - ADMINISTRATOR MANAGEMENT
// ============================================================

router.get(
  "/administrators",
  protect,
  superAdminOnly,
  adminController.getAdministrators
);


router.post(
  "/administrators",
  protect,
  superAdminOnly,
  adminController.createAdministrator
);


router.patch(
  "/administrators/:id/status",
  protect,
  superAdminOnly,
  adminController.updateAdministratorStatus
);

// ============================================================
// ADMIN - OWN CREDENTIALS
// ============================================================

router.patch(
    "/account/password",
    protect,
    adminOnly,
    adminController.changeOwnPassword
);

// ============================================================
// SUPER ADMIN - ADMINISTRATOR CREDENTIALS
// ============================================================

router.patch(
    "/administrators/:id/password",
    protect,
    superAdminOnly,
    adminController.resetAdministratorPassword
);

// ============================================================
// ADMINISTRATOR PERMISSIONS
// ============================================================

router.get(
    "/administrator-permissions",
    protect,
    superAdminOnly,
    adminController.getAdminPermissions
);

router.get(
    "/administrators/:id/permissions",
    protect,
    superAdminOnly,
    adminController.getAdministratorPermissions
);


router.put(
    "/administrators/:id/permissions",
    protect,
    superAdminOnly,
    adminController.updateAdministratorPermissions
);

// ============================================================
// ADMIN - OWN PERMISSIONS
// ============================================================

router.get(
    "/my-permissions",
    protect,
    adminOnly,
    adminController.getMyAdminPermissions
);

// ============================================================
// ADMIN - OWN PERMISSIONS
// ============================================================

router.get(
    "/my-permissions",
    protect,
    adminOnly,
    adminController.getMyPermissions
);

console.log(
    "ADMIN ROUTER LOADED - administrator-permissions route registered"
);

module.exports = router;