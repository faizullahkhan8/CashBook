<?php
// ====================================================================
// Zada Pharmacy Cash Counter - REST API Router (PHP + Hostinger MySQL)
// ====================================================================

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$pdo = get_db();
$cfg = get_config();

function send_json($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function get_json_body() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?: [];
}

function get_auth_user() {
    global $cfg;
    $headers = getallheaders();
    $auth = '';
    foreach ($headers as $k => $v) {
        if (strtolower($k) === 'authorization') {
            $auth = $v;
            break;
        }
    }
    if (!$auth && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!$auth || !preg_match('/Bearer\s+(.+)$/i', $auth, $m)) {
        send_json(['error' => 'Authentication required. Please log in.'], 401);
    }

    $token = $m[1];
    $user = jwt_decode($token, $cfg['jwt_secret']);
    if (!$user) {
        send_json(['error' => 'Invalid or expired session. Please log in again.'], 401);
    }
    return $user;
}

function require_admin($user) {
    if (empty($user['role']) || $user['role'] !== 'admin') {
        send_json(['error' => 'Forbidden. Administrator privileges required.'], 403);
    }
}

// Parse request path
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^.*?/api/#', '', $uri);
$path = trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Health Check
if ($path === 'health') {
    send_json([
        'status' => 'ok',
        'service' => 'Zada Pharmacy POS Cash Counter API',
        'database' => 'MySQL (Hostinger)',
        'timestamp' => date('c'),
    ]);
}

// ====================================================================
// AUTHENTICATION ROUTES
// ====================================================================

// POST /api/auth/login
if ($path === 'auth/login' && $method === 'POST') {
    $body = get_json_body();
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    if (!$username || !$password) {
        send_json(['error' => 'Username and password are required'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        send_json(['error' => 'Invalid username or password'], 401);
    }

    if ($user['status'] !== 'active') {
        send_json(['error' => 'This account has been deactivated. Contact Administrator.'], 403);
    }

    $payload = [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'full_name' => $user['full_name'],
        'role' => $user['role'],
    ];

    $token = jwt_encode($payload, $cfg['jwt_secret']);
    send_json(['token' => $token, 'user' => $payload]);
}

// GET /api/auth/me
if ($path === 'auth/me' && $method === 'GET') {
    $authUser = get_auth_user();
    $stmt = $pdo->prepare('SELECT id, username, full_name, role, status, created_at FROM users WHERE id = ?');
    $stmt->execute([$authUser['id']]);
    $user = $stmt->fetch();
    if (!$user) send_json(['error' => 'User not found'], 404);
    send_json(['user' => $user]);
}

// GET /api/auth/users (Admin only)
if ($path === 'auth/users' && $method === 'GET') {
    $authUser = get_auth_user();
    require_admin($authUser);
    $stmt = $pdo->query('SELECT id, username, full_name, role, status, created_at FROM users ORDER BY id ASC');
    send_json(['users' => $stmt->fetchAll()]);
}

// POST /api/auth/users (Admin only)
if ($path === 'auth/users' && $method === 'POST') {
    $authUser = get_auth_user();
    require_admin($authUser);
    $body = get_json_body();
    $username = trim($body['username'] ?? '');
    $full_name = trim($body['full_name'] ?? '');
    $password = $body['password'] ?? '';
    $role = ($body['role'] ?? '') === 'admin' ? 'admin' : 'cashier';

    if (!$username || !$full_name || !$password) {
        send_json(['error' => 'Username, full name, and password are required'], 400);
    }
    if (strlen($password) < 6) {
        send_json(['error' => 'Password must be at least 6 characters'], 400);
    }

    $check = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $check->execute([$username]);
    if ($check->fetch()) {
        send_json(['error' => 'Username already exists'], 400);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $ins = $pdo->prepare('INSERT INTO users (username, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, "active")');
    $ins->execute([$username, $hash, $full_name, $role]);

    send_json([
        'success' => true,
        'user' => [
            'id' => (int)$pdo->lastInsertId(),
            'username' => $username,
            'full_name' => $full_name,
            'role' => $role,
            'status' => 'active',
        ],
    ], 201);
}

// PATCH /api/auth/users/{id}/status (Admin only)
if (preg_match('#^auth/users/(\d+)/status$#', $path, $m) && $method === 'PATCH') {
    $authUser = get_auth_user();
    require_admin($authUser);
    $targetId = (int)$m[1];
    if ($targetId === (int)$authUser['id']) {
        send_json(['error' => 'You cannot deactivate your own account'], 400);
    }
    $body = get_json_body();
    $status = ($body['status'] ?? '') === 'active' ? 'active' : 'inactive';
    $pdo->prepare('UPDATE users SET status = ? WHERE id = ?')->execute([$status, $targetId]);
    send_json(['success' => true, 'status' => $status]);
}

// POST /api/auth/change-password
if ($path === 'auth/change-password' && $method === 'POST') {
    $authUser = get_auth_user();
    $body = get_json_body();
    $curr = $body['current_password'] ?? '';
    $next = $body['new_password'] ?? '';
    if (!$curr || !$next) send_json(['error' => 'Current and new password required'], 400);
    if (strlen($next) < 6) send_json(['error' => 'New password must be at least 6 characters'], 400);

    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$authUser['id']]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($curr, $user['password_hash'])) {
        send_json(['error' => 'Current password is incorrect'], 400);
    }

    $newHash = password_hash($next, PASSWORD_BCRYPT);
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$newHash, $authUser['id']]);
    send_json(['success' => true, 'message' => 'Password updated successfully']);
}

// ====================================================================
// SHIFTS ROUTES
// ====================================================================

// Helper function to calculate shift summary
function compute_shift_summary($pdo, $shiftId = null) {
    if (!$shiftId) {
        $sStmt = $pdo->query("SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1");
        $shift = $sStmt->fetch();
    } else {
        $sStmt = $pdo->prepare("SELECT * FROM shifts WHERE id = ?");
        $sStmt->execute([$shiftId]);
        $shift = $sStmt->fetch();
    }

    if (!$shift) {
        $sStmt = $pdo->query("SELECT * FROM shifts ORDER BY id DESC LIMIT 1");
        $shift = $sStmt->fetch();
    }

    $targetShiftId = (int)$shift['id'];
    $openingFloat = (float)($shift['opening_float'] ?? 0);

    // Ledger queries
    $lStmt = $pdo->prepare("SELECT amount, payment_method FROM ledger_entries WHERE shift_id = ?");
    $lStmt->execute([$targetShiftId]);
    $entries = $lStmt->fetchAll();

    $cashInflow = 0.0;
    $cardCollections = 0.0;
    $qrCollections = 0.0;
    $cashCount = 0;
    $cardCount = 0;
    $qrCount = 0;

    foreach ($entries as $e) {
        $amt = (float)$e['amount'];
        $m = $e['payment_method'];
        if ($m === 'CASH') {
            $cashInflow += $amt;
            $cashCount++;
        } elseif ($m === 'QR_CODE') {
            $qrCollections += $amt;
            $qrCount++;
        } else {
            $cardCollections += $amt;
            $cardCount++;
        }
    }

    $onlineCollections = $cardCollections + $qrCollections;
    $onlineCount = $cardCount + $qrCount;
    $totalRevenue = $cashInflow + $onlineCollections;
    $totalCount = $cashCount + $onlineCount;

    // Short items query
    $shStmt = $pdo->prepare("SELECT amount, spent_amount, bill_amount, status FROM short_items WHERE shift_id = ?");
    $shStmt->execute([$targetShiftId]);
    $items = $shStmt->fetchAll();

    $pendingCount = 0;
    $pendingAmount = 0.0;
    $spentAmount = 0.0;

    foreach ($items as $item) {
        if ($item['status'] === 'PENDING') {
            $pendingCount++;
            $pendingAmount += (float)$item['amount'];
        } elseif ($item['status'] === 'RETURNED') {
            $spentAmount += (float)$item['spent_amount'];
        }
    }

    $totalShortDeduction = $spentAmount + $pendingAmount;
    $expectedDrawerCash = $openingFloat + $cashInflow - $totalShortDeduction;

    $cashShare = $totalRevenue > 0 ? round(($cashInflow / $totalRevenue) * 100, 1) : 0;
    $onlineShare = $totalRevenue > 0 ? round(($onlineCollections / $totalRevenue) * 100, 1) : 0;

    return [
        'shift' => [
            'id' => (int)$shift['id'],
            'shift_code' => $shift['shift_code'],
            'register_station' => $shift['register_station'],
            'cashier_name' => $shift['cashier_name'],
            'shift_type' => $shift['shift_type'],
            'employee_1' => $shift['employee_1'],
            'employee_2' => $shift['employee_2'],
            'opening_float' => $openingFloat,
            'opened_at' => $shift['opened_at'],
            'closed_at' => $shift['closed_at'],
            'status' => $shift['status'],
        ],
        'totalRevenue' => round($totalRevenue, 2),
        'cashInflow' => round($cashInflow, 2),
        'onlineCollections' => round($onlineCollections, 2),
        'cardCollections' => round($cardCollections, 2),
        'qrCollections' => round($qrCollections, 2),
        'cashCount' => $cashCount,
        'onlineCount' => $onlineCount,
        'cardCount' => $cardCount,
        'qrCount' => $qrCount,
        'totalCount' => $totalCount,
        'openingFloat' => $openingFloat,
        'expectedDrawerCash' => round($expectedDrawerCash, 2),
        'cashShare' => $cashShare,
        'onlineShare' => $onlineShare,
        'pendingShortItemsCount' => $pendingCount,
        'totalSpentOnShortItems' => round($spentAmount, 2),
        'totalPendingShortItemsAmount' => round($pendingAmount, 2),
        'totalShortItemsDeduction' => round($totalShortDeduction, 2),
    ];
}

// GET /api/shifts/active
if ($path === 'shifts/active' && $method === 'GET') {
    get_auth_user();
    $stmt = $pdo->query("SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1");
    $shift = $stmt->fetch();
    if (!$shift) {
        $code = 'SHF-' . date('Ymd-His');
        $pdo->prepare("INSERT INTO shifts (shift_code, shift_type, employee_1, employee_2, cashier_name, opening_float, opened_at, status) VALUES (?, 'Day', 'Staff', 'Staff', 'Staff', 0, NOW(), 'OPEN')")->execute([$code]);
        $shift = $pdo->query("SELECT * FROM shifts WHERE id = " . $pdo->lastInsertId())->fetch();
    }
    send_json([
        'id' => (int)$shift['id'],
        'shift_code' => $shift['shift_code'],
        'register_station' => $shift['register_station'],
        'cashier_name' => $shift['cashier_name'],
        'shift_type' => $shift['shift_type'],
        'employee_1' => $shift['employee_1'],
        'employee_2' => $shift['employee_2'],
        'opening_float' => (float)$shift['opening_float'],
        'opened_at' => $shift['opened_at'],
        'closed_at' => $shift['closed_at'],
        'status' => $shift['status'],
    ]);
}

// POST /api/shifts/opening-float
if ($path === 'shifts/opening-float' && $method === 'POST') {
    get_auth_user();
    $body = get_json_body();
    $shiftId = (int)($body['shiftId'] ?? 0);
    $amount = (float)($body['amount'] ?? 0);
    $pdo->prepare('UPDATE shifts SET opening_float = ? WHERE id = ?')->execute([$amount, $shiftId]);
    send_json(['success' => true, 'opening_float' => $amount]);
}

// POST /api/shifts/staff
if ($path === 'shifts/staff' && $method === 'POST') {
    get_auth_user();
    $body = get_json_body();
    $sStmt = $pdo->query("SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1");
    $active = $sStmt->fetch();
    if ($active) {
        $shiftType = $body['shift_type'] ?? $active['shift_type'];
        $emp1 = $body['employee_1'] ?? $active['employee_1'];
        $emp2 = $body['employee_2'] ?? $active['employee_2'];
        $cashier = "$emp1 & $emp2";

        $pdo->prepare('UPDATE shifts SET shift_type = ?, employee_1 = ?, employee_2 = ?, cashier_name = ? WHERE id = ?')
            ->execute([$shiftType, $emp1, $emp2, $cashier, $active['id']]);

        $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('active_shift_type', ?) ON DUPLICATE KEY UPDATE setting_value = ?")
            ->execute([$shiftType, $shiftType]);

        if (!empty($body['save_as_default'])) {
            $prefix = $shiftType === 'Night' ? 'night' : 'day';
            $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?")
                ->execute(["{$prefix}_employee_1", $emp1, $emp1]);
            $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?")
                ->execute(["{$prefix}_employee_2", $emp2, $emp2]);
        }
    }
    send_json(['success' => true]);
}

// GET /api/shifts/summary
if ($path === 'shifts/summary' && $method === 'GET') {
    get_auth_user();
    $shiftId = isset($_GET['shiftId']) ? (int)$_GET['shiftId'] : null;
    send_json(compute_shift_summary($pdo, $shiftId));
}

// ====================================================================
// LEDGER ENTRIES ROUTES
// ====================================================================

// GET /api/ledger/next-invoice
if ($path === 'ledger/next-invoice' && $method === 'GET') {
    get_auth_user();
    $year = date('Y');
    $count = $pdo->query("SELECT COUNT(*) FROM ledger_entries")->fetchColumn();
    $next = (int)$count + 1;
    send_json(['invoice_number' => "INV-$year-" . str_pad((string)$next, 4, '0', STR_PAD_LEFT)]);
}

// GET /api/ledger/recent
if ($path === 'ledger/recent' && $method === 'GET') {
    get_auth_user();
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $shiftId = isset($_GET['shiftId']) ? (int)$_GET['shiftId'] : null;
    if (!$shiftId) {
        $shiftId = (int)$pdo->query("SELECT id FROM shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1")->fetchColumn();
    }
    $stmt = $pdo->prepare("SELECT * FROM ledger_entries WHERE shift_id = ? ORDER BY id DESC LIMIT $limit");
    $stmt->execute([$shiftId]);
    send_json($stmt->fetchAll());
}

// GET /api/ledger/all
if ($path === 'ledger/all' && $method === 'GET') {
    get_auth_user();
    $sql = "SELECT * FROM ledger_entries WHERE 1=1";
    $params = [];

    if (!empty($_GET['shiftId'])) {
        $sql .= " AND shift_id = ?";
        $params[] = (int)$_GET['shiftId'];
    }
    if (!empty($_GET['shiftType']) && $_GET['shiftType'] !== 'ALL') {
        $sql .= " AND shift_type = ?";
        $params[] = $_GET['shiftType'];
    }
    if (!empty($_GET['method']) && $_GET['method'] !== 'ALL') {
        $sql .= " AND payment_method = ?";
        $params[] = $_GET['method'];
    }
    if (!empty($_GET['customerType']) && $_GET['customerType'] !== 'ALL') {
        $sql .= " AND customer_type = ?";
        $params[] = $_GET['customerType'];
    }
    if (!empty($_GET['search'])) {
        $s = '%' . $_GET['search'] . '%';
        $sql .= " AND (invoice_number LIKE ? OR notes LIKE ? OR customer_type LIKE ? OR employee_1 LIKE ? OR employee_2 LIKE ?)";
        $params = array_merge($params, [$s, $s, $s, $s, $s]);
    }

    $sql .= " ORDER BY id DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    send_json($stmt->fetchAll());
}

// POST /api/ledger/entry
if ($path === 'ledger/entry' && $method === 'POST') {
    get_auth_user();
    $data = get_json_body();
    $sStmt = $pdo->query("SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1");
    $shift = $sStmt->fetch();
    if (!$shift) {
        send_json(['error' => 'No active shift open'], 400);
    }

    $year = date('Y');
    $count = $pdo->query("SELECT COUNT(*) FROM ledger_entries")->fetchColumn();
    $inv = !empty($data['invoice_number']) ? $data['invoice_number'] : ("INV-$year-" . str_pad((string)($count + 1), 4, '0', STR_PAD_LEFT));

    $amount = round((float)($data['amount'] ?? 0), 2);
    $method = $data['payment_method'] === 'QR_CODE' ? 'QR_CODE' : (($data['payment_method'] === 'CARD' || $data['payment_method'] === 'ONLINE') ? 'CARD' : 'CASH');

    $ins = $pdo->prepare("
        INSERT INTO ledger_entries (
            shift_id, shift_type, employee_1, employee_2, invoice_number,
            customer_type, amount, payment_method, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $ins->execute([
        (int)$shift['id'],
        $data['shift_type'] ?? $shift['shift_type'],
        $data['employee_1'] ?? $shift['employee_1'],
        $data['employee_2'] ?? $shift['employee_2'],
        $inv,
        $data['customer_type'] ?? 'Walk-in Customer',
        $amount,
        $method,
        $data['notes'] ?? '',
    ]);

    $newId = (int)$pdo->lastInsertId();
    $entry = $pdo->query("SELECT * FROM ledger_entries WHERE id = $newId")->fetch();
    $summary = compute_shift_summary($pdo, $shift['id']);
    $nextInv = "INV-$year-" . str_pad((string)($count + 2), 4, '0', STR_PAD_LEFT);

    send_json([
        'entry' => $entry,
        'nextInvoice' => $nextInv,
        'summary' => $summary,
    ]);
}

// PUT /api/ledger/entry/{id}
if (preg_match('#^ledger/entry/(\d+)$#', $path, $m) && $method === 'PUT') {
    get_auth_user();
    $id = (int)$m[1];
    $data = get_json_body();
    $amount = (float)($data['amount'] ?? 0);
    $method = $data['payment_method'] === 'QR_CODE' ? 'QR_CODE' : (($data['payment_method'] === 'CARD' || $data['payment_method'] === 'ONLINE') ? 'CARD' : 'CASH');

    $pdo->prepare("
        UPDATE ledger_entries SET customer_type = ?, amount = ?, payment_method = ?, notes = ? WHERE id = ?
    ")->execute([
        $data['customer_type'] ?? 'Walk-in Customer',
        $amount,
        $method,
        $data['notes'] ?? '',
        $id
    ]);

    $entry = $pdo->query("SELECT * FROM ledger_entries WHERE id = $id")->fetch();
    send_json($entry);
}

// DELETE /api/ledger/entry/{id}
if (preg_match('#^ledger/entry/(\d+)$#', $path, $m) && $method === 'DELETE') {
    get_auth_user();
    $id = (int)$m[1];
    $pdo->prepare("DELETE FROM ledger_entries WHERE id = ?")->execute([$id]);
    send_json(['success' => true, 'deletedId' => $id]);
}

// ====================================================================
// SHORT ITEMS ROUTES
// ====================================================================

// GET /api/short-items
if ($path === 'short-items' && $method === 'GET') {
    get_auth_user();
    $shiftId = $_GET['shiftId'] ?? null;
    if ($shiftId === 'ALL') {
        $stmt = $pdo->query("SELECT * FROM short_items ORDER BY id DESC");
    } else {
        $targetId = $shiftId ? (int)$shiftId : (int)$pdo->query("SELECT id FROM shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1")->fetchColumn();
        $stmt = $pdo->prepare("SELECT * FROM short_items WHERE shift_id = ? ORDER BY id DESC");
        $stmt->execute([$targetId]);
    }
    send_json($stmt->fetchAll());
}

// POST /api/short-items
if ($path === 'short-items' && $method === 'POST') {
    get_auth_user();
    $data = get_json_body();
    $shiftId = (int)$pdo->query("SELECT id FROM shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1")->fetchColumn();
    $amount = (float)($data['amount'] ?? 0);

    $ins = $pdo->prepare("
        INSERT INTO short_items (shift_id, amount, given_to, notes, status, returned_amount, spent_amount, bill_amount, reference_no, pharmacy, created_at)
        VALUES (?, ?, ?, ?, 'PENDING', 0, 0, 0, '', '', NOW())
    ");
    $ins->execute([$shiftId, $amount, $data['given_to'] ?? '', $data['notes'] ?? '']);
    $newId = (int)$pdo->lastInsertId();
    send_json($pdo->query("SELECT * FROM short_items WHERE id = $newId")->fetch());
}

// POST /api/short-items/{id}/return
if (preg_match('#^short-items/(\d+)/return$#', $path, $m) && $method === 'POST') {
    get_auth_user();
    $id = (int)$m[1];
    $data = get_json_body();
    $item = $pdo->query("SELECT * FROM short_items WHERE id = $id")->fetch();
    if (!$item) send_json(['error' => 'Short item not found'], 404);

    $billAmount = (float)($data['bill_amount'] ?? 0);
    $origAmount = (float)$item['amount'];
    if ($billAmount > $origAmount) send_json(['error' => 'Bill amount cannot exceed given amount'], 400);

    $returnedAmount = $origAmount - $billAmount;
    $ref = $data['reference_no'] ?? '';
    $pharmacy = $data['pharmacy'] ?? '';

    $up = $pdo->prepare("
        UPDATE short_items SET status = 'RETURNED', returned_amount = ?, spent_amount = ?, bill_amount = ?, reference_no = ?, pharmacy = ?, returned_at = NOW()
        WHERE id = ?
    ");
    $up->execute([$returnedAmount, $billAmount, $billAmount, $ref, $pharmacy, $id]);
    send_json($pdo->query("SELECT * FROM short_items WHERE id = $id")->fetch());
}

// DELETE /api/short-items/{id}
if (preg_match('#^short-items/(\d+)$#', $path, $m) && $method === 'DELETE') {
    get_auth_user();
    $id = (int)$m[1];
    $pdo->prepare("DELETE FROM short_items WHERE id = ?")->execute([$id]);
    send_json(['success' => true]);
}

// ====================================================================
// SHIFT CLOSINGS ROUTES
// ====================================================================

// GET /api/closings
if ($path === 'closings' && $method === 'GET') {
    get_auth_user();
    $type = $_GET['shiftType'] ?? 'ALL';
    if ($type !== 'ALL') {
        $stmt = $pdo->prepare("SELECT * FROM shift_closings WHERE shift_type = ? ORDER BY id DESC");
        $stmt->execute([$type]);
    } else {
        $stmt = $pdo->query("SELECT * FROM shift_closings ORDER BY id DESC");
    }
    send_json($stmt->fetchAll());
}

// GET /api/closings/{id}
if (preg_match('#^closings/(\d+)$#', $path, $m) && $method === 'GET') {
    get_auth_user();
    $id = (int)$m[1];
    $stmt = $pdo->prepare("SELECT * FROM shift_closings WHERE id = ?");
    $stmt->execute([$id]);
    $c = $stmt->fetch();
    if (!$c) send_json(['error' => 'Closing not found'], 404);
    send_json($c);
}

// POST /api/closings (Save Closing & Open New Shift)
if ($path === 'closings' && $method === 'POST') {
    get_auth_user();
    $data = get_json_body();
    $shiftId = (int)$data['shift_id'];

    $count = (int)$pdo->query("SELECT COUNT(*) FROM shift_closings")->fetchColumn();
    $closingCode = 'CLS-' . (1001 + $count);

    $ins = $pdo->prepare("
        INSERT INTO shift_closings (
            closing_code, shift_id, shift_type, employee_1, employee_2, cashier_name,
            opening_float, cash_sales, online_sales, total_revenue, expected_drawer_cash,
            counted_cash, variance, status, denominations_json, audit_notes, closed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $ins->execute([
        $closingCode,
        $shiftId,
        $data['shift_type'] ?? 'Day',
        $data['employee_1'] ?? '',
        $data['employee_2'] ?? '',
        $data['cashier_name'] ?? ($data['employee_1'] . ' & ' . $data['employee_2']),
        (float)($data['opening_float'] ?? 0),
        (float)($data['cash_sales'] ?? 0),
        (float)($data['online_sales'] ?? 0),
        (float)($data['total_revenue'] ?? 0),
        (float)($data['expected_drawer_cash'] ?? 0),
        (float)($data['counted_cash'] ?? 0),
        (float)($data['variance'] ?? 0),
        $data['status'] ?? 'Balanced',
        is_string($data['denominations_json'] ?? '') ? $data['denominations_json'] : json_encode($data['denominations_json'] ?? []),
        $data['audit_notes'] ?? '',
    ]);

    $newClosingId = (int)$pdo->lastInsertId();
    $newClosing = $pdo->query("SELECT * FROM shift_closings WHERE id = $newClosingId")->fetch();

    // Close the current shift
    $pdo->prepare("UPDATE shifts SET status = 'CLOSED', closed_at = NOW() WHERE id = ?")->execute([$shiftId]);

    // Open next shift
    $nextType = $data['next_shift_type'] ?? $data['shift_type'] ?? 'Day';
    $nextEmp1 = $data['next_employee_1'] ?? $data['employee_1'];
    $nextEmp2 = $data['next_employee_2'] ?? $data['employee_2'];
    $newOpeningFloat = !empty($data['carryOverFloatAsNewShift']) ? (float)$data['counted_cash'] : 0.0;
    $newShiftCode = 'SHF-' . date('Ymd-His');

    $sIns = $pdo->prepare("
        INSERT INTO shifts (shift_code, register_station, shift_type, employee_1, employee_2, cashier_name, opening_float, opened_at, status)
        VALUES (?, 'Register 01', ?, ?, ?, ?, ?, NOW(), 'OPEN')
    ");
    $sIns->execute([$newShiftCode, $nextType, $nextEmp1, $nextEmp2, "$nextEmp1 & $nextEmp2", $newOpeningFloat]);
    $newShift = $pdo->query("SELECT * FROM shifts WHERE id = " . $pdo->lastInsertId())->fetch();

    send_json([
        'closing' => $newClosing,
        'newShift' => $newShift,
    ]);
}

// POST /api/closings/{id}/void
if (preg_match('#^closings/(\d+)/void$#', $path, $m) && $method === 'POST') {
    get_auth_user();
    $id = (int)$m[1];
    $data = get_json_body();
    $reason = trim($data['reason'] ?? '');
    if (!$reason) send_json(['error' => 'Void reason is required'], 400);

    $up = $pdo->prepare("UPDATE shift_closings SET is_void = 1, status = 'VOID', void_reason = ?, voided_at = NOW(), updated_at = NOW() WHERE id = ?");
    $up->execute([$reason, $id]);
    send_json($pdo->query("SELECT * FROM shift_closings WHERE id = $id")->fetch());
}

// ====================================================================
// EMPLOYEES & SETTINGS ROUTES
// ====================================================================

// GET /api/employees
if ($path === 'employees' && $method === 'GET') {
    get_auth_user();
    send_json($pdo->query("SELECT * FROM employees ORDER BY id ASC")->fetchAll());
}

// POST /api/employees
if ($path === 'employees' && $method === 'POST') {
    get_auth_user();
    $data = get_json_body();
    if (!empty($data['id'])) {
        $pdo->prepare("UPDATE employees SET name = ?, assigned_shift = ?, role = ? WHERE id = ?")
            ->execute([$data['name'], $data['assigned_shift'] ?? 'Day', $data['role'] ?? 'Counter Staff', (int)$data['id']]);
    } else {
        $pdo->prepare("INSERT INTO employees (name, assigned_shift, role) VALUES (?, ?, ?)")
            ->execute([$data['name'], $data['assigned_shift'] ?? 'Day', $data['role'] ?? 'Counter Staff']);
    }
    send_json(['success' => true]);
}

// DELETE /api/employees/{id}
if (preg_match('#^employees/(\d+)$#', $path, $m) && $method === 'DELETE') {
    get_auth_user();
    $id = (int)$m[1];
    $pdo->prepare("DELETE FROM employees WHERE id = ?")->execute([$id]);
    send_json(['success' => true, 'id' => $id]);
}

// GET /api/settings
if ($path === 'settings' && $method === 'GET') {
    get_auth_user();
    $rows = $pdo->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
    $out = [];
    foreach ($rows as $r) {
        $out[$r['setting_key']] = $r['setting_value'];
    }
    send_json($out);
}

// POST /api/settings
if ($path === 'settings' && $method === 'POST') {
    get_auth_user();
    $data = get_json_body();
    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    foreach ($data as $k => $v) {
        $val = is_array($v) ? json_encode($v) : (string)$v;
        $stmt->execute([$k, $val, $val]);
    }
    send_json(['success' => true]);
}

send_json(['error' => 'API endpoint not found: ' . $path], 404);
