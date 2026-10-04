<?php
// Pure PHP JWT implementation using HMAC-SHA256 (Zero external dependencies)

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode($payload, $secret, $exp_seconds = 604800) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + $exp_seconds;

    $b64Header = base64url_encode($header);
    $b64Payload = base64url_encode(json_encode($payload));

    $signature = hash_hmac('sha256', "$b64Header.$b64Payload", $secret, true);
    $b64Signature = base64url_encode($signature);

    return "$b64Header.$b64Payload.$b64Signature";
}

function jwt_decode($token, $secret) {
    if (!$token) return false;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;

    list($b64Header, $b64Payload, $b64Signature) = $parts;

    $signature = hash_hmac('sha256', "$b64Header.$b64Payload", $secret, true);
    $validSignature = base64url_encode($signature);

    if (!hash_equals($validSignature, $b64Signature)) {
        return false;
    }

    $payload = json_decode(base64url_decode($b64Payload), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return false;
    }

    return $payload;
}
