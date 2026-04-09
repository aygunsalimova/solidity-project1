const express = require('express')
const app = express()
const cors = require('cors')
const port = 3043
const secp = require('ethereum-cryptography/secp256k1')
const { hextoBytes, toHex } = require('ethereum-cryptography/utils')

app.use(cors())
app.use(express.json())

const balances = {
  '03200f81cf220af050dd1ff25f57b8074ead94f30490839d9ab5477459b242c16e': 100,
  // 5528c1cc8cd8ef7bf61fe1fdb212ecfb052a563e22ecf1947cdb3b0520760f36
  '0319cf61449e6129e1df97549aae9015bb51a198b603115903172af918a1f1e0b5': 50,
  // 5c5c5c8fd5d2e082292fb11bc09688a536fd42ccfc355ef1755f94942ed41109
  '03ccd5ca6da11ea6d06824c6a83a800e5d1a9c780eaf1248a49804b6d64aa482d4': 75
  // 9e7a213ad67e1c8da6a6f65cf7d306b387053704960d765488d12474429c757f
}

app.get('/balance/:address', (req, res) => {
  const { address } = req.params
  const balance = balances[address] || 0
  res.send({ balance })
})

app.post('/send', (req, res) => {
  const { recipient, amount, messageHash, signature, recoveryBit } = req.body

  // STEP 1: Recover the sender's public key from the signature
  const senderPublicKey = secp.recoverPublicKey(
    hexToBytes(messageHash),
    hexToBytes(signature),
    recoveryBit,
    true
  )

  const sender = toHex(senderPublicKey)

  // STEP 2: Validate recipient exists
  if (balances[recipient] === undefined) {
    return res.status(400).send({ message: 'Recipient address not found!' })
  }

  // STEP 3: Validate sender exists and has enough funds
  setInitialBalance(sender)

  if (balances[sender] < amount) {
    res.status(400).send({ message: 'Not enough funds!' })
  } else {
    balances[sender] -= amount
    balances[recipient] += amount
    res.send({ balance: balances[sender] })
  }
})

app.listen(port, () => {
  console.log(`Listening on port ${port}!`)
})

function setInitialBalance (address) {
  if (!balances[address]) {
    balances[address] = 0
  }
}
