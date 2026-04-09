import { useState } from 'react'
import server from './server'
import * as secp from 'ethereum-cryptography/secp256k1'
import { toHex, hexToBytes } from 'ethereum-cryptography/utils'
import { keccak256 } from 'ethereum-cryptography/keccak'

function Transfer ({ address, setBalance, privateKey  }) {
  const [sendAmount, setSendAmount] = useState('')
  const [recipientPrivateKey, setRecipientPrivateKey] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')

  const setValue = setter => evt => setter(evt.target.value)

  function onRecipientChange (evt) {
    const pKey = evt.target.value
    setRecipientPrivateKey(pKey)

    if (pKey) {
      try {
        const publicKey = secp.getPublicKey(hexToBytes(pKey), true)
        setRecipientAddress(toHex(publicKey))
      } catch {
        setRecipientAddress('Invalid Key')
      }
    } else {
      setRecipientAddress('')
    }
  }

  async function transfer (evt) {
    evt.preventDefault()

    // STEP 1: Create a message from the transaction details and hash it
    const message = `${sendAmount}${recipientAddress}`
    const messageHash = keccak256(Uint8Array.from(Buffer.from(message)))

    // STEP 2: Sign the hash with the sender's private key
    const [signature, recoveryBit] = await secp.sign(
      messageHash,
      hexToBytes(privateKey),
      { recovered: true }
    )

    try {
      const {
        data: { balance }
      } = await server.post(`send`, {
        // STEP 3: Send signature instead of sender's address
        signature: toHex(signature),
        recoveryBit,
        messageHash: toHex(messageHash),
        amount: parseInt(sendAmount),
        recipient: recipientAddress
      })
      setBalance(balance)
    } catch (ex) {
      alert(ex.response.data.message)
    }
  }

  return (
    <form className='container transfer' onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder='1, 2, 3...'
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient Private Key
        <input
          placeholder="Enter recipient's private key"
          value={recipientPrivateKey}
          onChange={onRecipientChange}
        ></input>
      </label>

      {recipientAddress === 'Invalid Key' && (
        <div style={{ fontSize: '12px', margin: '6px 0', color: 'red' }}>
          Invalid private key
        </div>
      )}

      <input type='submit' className='button' value='Transfer' />
    </form>
  )
}

export default Transfer
