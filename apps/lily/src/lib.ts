export async function exportPublicKey(key: CryptoKey) {
	const exported = await crypto.subtle.exportKey("spki", key);
	const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
	return `-----BEGIN PUBLIC KEY-----\n${base64}\n-----END PUBLIC KEY-----`;
}

export async function exportPrivateKey(key: CryptoKey) {
	const exported = await crypto.subtle.exportKey("pkcs8", key);
	const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
	return `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`;
}

export async function hmac(secret: string, message: string) {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const msgData = encoder.encode(message);

	const key = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign("HMAC", key, msgData);
	const hashArray = Array.from(new Uint8Array(signature)); // convert buffer to byte array
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(""); // convert bytes to hex string

	return hashHex;
}

export async function generateKeyPair() {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: "RSA-OAEP",
			modulusLength: 2048, // Can be 1024, 2048, or 4096
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-256",
		},
		true, // Whether the key is extractable
		["encrypt", "decrypt"], // Key usages
	);
	return keyPair;
}

export async function importPrivateKey(pem: string) {
	const base64 = pem.replace(
		/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\\n/g,
		"",
	);
	const binaryDer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
	return await crypto.subtle.importKey(
		"pkcs8",
		binaryDer.buffer,
		{
			name: "RSA-OAEP",
			hash: "SHA-256",
		},
		true,
		["decrypt"],
	);
}

export async function importPublicKey(pem: string) {
	const base64 = pem.replace(
		/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\\n/g,
		"",
	);
	const binaryDer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
	return await crypto.subtle.importKey(
		"spki",
		binaryDer.buffer,
		{
			name: "RSA-OAEP",
			hash: "SHA-256",
		},
		true,
		["encrypt"],
	);
}

export async function decryptData(
	privateKey: CryptoKey,
	encryptedData: string,
) {
	const encrypted = hexToBuffer(encryptedData);
	const decrypted = await crypto.subtle.decrypt(
		{
			name: "RSA-OAEP",
		},
		privateKey,
		encrypted,
	);
	return new TextDecoder().decode(decrypted);
}

export async function encryptData(publicKey: CryptoKey, data: string) {
	const encoded = new TextEncoder().encode(data);
	const encrypted = await crypto.subtle.encrypt(
		{
			name: "RSA-OAEP",
		},
		publicKey,
		encoded,
	);
	// array buffer to string to console.log

	return Array.from(new Uint8Array(encrypted))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function hexToBuffer(hexString: string) {
	const bytes = new Uint8Array(hexString.length / 2);
	for (let i = 0, j = 0; i < hexString.length; i += 2, j++) {
		bytes[j] = parseInt(hexString.substring(i, i + 2), 16);
	}
	return bytes.buffer;
}
