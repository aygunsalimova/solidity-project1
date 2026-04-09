## Project 1: Build a Web App using ECDSA

This project is an example of using a client and server to facilitate transfers between different addresses. Since there is just a single server on the back-end handling transfers, this is clearly very centralized. We won't worry about distributed consensus for this project.

However, something that we would like to incorporate is Public Key Cryptography. By using Elliptic Curve Digital Signatures we can make it so the server only allows transfers that have been signed for by the person who owns the associated address.


## Setup Instructions

### Client

The client folder contains a [React app](https://reactjs.org/) using [Vite](https://vitejs.dev/). To get started, follow these steps:

1. Open up a terminal in the `/client` folder
2. Run `npm install` to install all the dependencies
3. Run `npm run dev` to start the application
4. Now you should be able to visit the app at http://localhost:5173/

### Server

The server folder contains a Node.js server using [Express](https://expressjs.com/). To run the server, follow these steps:

1. Open a terminal within the `/server` folder
2. Run `npm install` to install all the dependencies
3. Run `node index` to start the server

> 💡 Run `npm i -g nodemon` and then use `nodemon index` instead of `node index` to automatically restart the server on any changes!

The application should connect to the default server port (3042) automatically.

---

## 🏁 Your Goal: Set Up a Secure ECDSA-based Web Application

Only read this section **AFTER** you've followed the **Setup Instructions** above!

This project begins with a client that is allowed to transfer any funds from any account to another account. That's not very secure. By applying digital signatures we can require that only the user with the appropriate private key can create a signature that will allow them to move funds from one account to the other. Then, the server can verify the signature to move funds from one account to another.

Your project is considered **done** when you have built the following features in a secure way:

- Incorporate public key cryptography so transfers can only be completed with a valid signature
- The person sending the transaction should have to verify that they own the private key corresponding to the address that is sending funds

> 🤔 While you're working through this project consider the security implications of your implementation decisions. What if someone intercepted a valid signature — would they be able to replay that transfer by sending it back to the server?

---

## Recommended Approach

### Phase 1 — Get the App Running

- Clone the project and run `npm install` in both `/client` and `/server`
- Start the client at http://localhost:5173/ and start the server with `nodemon index`
- Confirm that typing `0x1`, `0x2`, or `0x3` in the wallet input shows a balance
- Confirm that you can send amounts between accounts and balances update in real time
- Confirm that balances persist after a page reload (they live on the server, not the client)

### Phase 2 — Replace Placeholder Addresses with Real Public Keys

At this point anyone can move funds from any account — there is no ownership. We need to fix that using the [Ethereum Cryptography library](https://www.npmjs.com/package/ethereum-cryptography/v/1.2.0).

Install it in both folders:

```
cd client && npm i ethereum-cryptography@1.2.0
cd server && npm i ethereum-cryptography@1.2.0
```

Use the script below (or the one in `/server/script/generate.js`) to generate real private/public key pairs:

```js
const secp = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");

const privateKey = secp.utils.randomPrivateKey();
console.log("private key:", toHex(privateKey));

const publicKey = secp.getPublicKey(privateKey);
console.log("public key:", toHex(publicKey));
```

Replace `0x1`, `0x2`, `0x3` in `server/index.js` with the generated public keys, and use the corresponding private keys to sign transactions from the client.

### Phase 3 — Sign Transactions (No Private Keys on the Client!)

Asking users to paste a private key directly into a web app is a big security risk. The final step is to send a **signed transaction** to the server instead. The server then recovers the public key from the signature and validates it against the `balances` object — no private key ever leaves the client.

In `server/index.js` you will want to:
- Receive a signature from the client
- Recover the public address from the signature
- Validate the recovered address against the `balances` object

> Hint: https://github.com/paulmillr/noble-secp256k1 is a great library to leverage for this phase.

---

## 🐛 Issues I Faced & How I Solved Them

### Issue 1: Balance Not Showing After Updating Public Keys in the Server

**What happened:**
After replacing `0x1`, `0x2`, `0x3` in `server/index.js` with real generated public keys, typing those keys into the wallet input always showed a balance of `0`.

**Root cause:**
The keys in the `balances` object are **compressed** public keys (66 hex characters, starting with `02` or `03`). The server does a plain string lookup — `balances[address]` — so the input must match the stored key *exactly*. Any format difference or typo returns `0` (the default fallback).

**How I solved it:**
Copied the exact compressed public key strings from `server/index.js` and pasted them directly into the wallet input. The app was working correctly the whole time; the issue was simply a mismatch between what was stored and what was being entered.

**Lesson learned:**
When you update `balances` to use real public keys, always copy the strings exactly as they appear. The lookup is a strict string match — even a single character difference will silently return `0`.

---

### Issue 2: Wallet Showing the Wrong Public Key When Deriving from a Private Key

**What happened:**
After updating `Wallet.jsx` to derive a public key from a private key input, the UI displayed a very long key starting with `04` (130 hex characters). This never matched the keys in the server's `balances` object, so the balance always showed `0`.

**Root cause:**
`secp.getPublicKey(privateKeyBytes)` returns an **uncompressed** public key by default — 65 bytes (130 hex characters), prefixed with `04`. The server stores **compressed** public keys — 33 bytes (66 hex characters), prefixed with `02` or `03`. Because the two strings are different, the server lookup always failed.

**How I solved it:**
Pass `true` as the second argument to `getPublicKey` to get the compressed format:

```js
// ❌ Before — uncompressed key (130 hex chars, starts with 04)
const publicKey = secp.getPublicKey(pKeyBytes)

// ✅ After — compressed key (66 hex chars, starts with 02 or 03)
const publicKey = secp.getPublicKey(pKeyBytes, true)
```

This made the derived key match the format stored on the server, and balances displayed correctly.

**Lesson learned:**
Always make sure the public key format on the **client** matches the format stored on the **server**. The `ethereum-cryptography` secp256k1 library defaults to uncompressed keys. If your server uses compressed keys, always pass `true` as the second argument to `getPublicKey`.

---

