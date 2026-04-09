import server from './server'
import * as secp from 'ethereum-cryptography/secp256k1'
// You must import hexToBytes to convert the string input
import { toHex, hexToBytes } from 'ethereum-cryptography/utils'

function Wallet ({
  address,
  setAddress,
  balance,
  setBalance,
  privateKey,
  setPrivateKey
}) {
  async function onChange (evt) {
    const pKey = evt.target.value
    setPrivateKey(pKey)

    if (pKey) {
      try {
        // STEP 1: Convert the hex string from the input into Bytes
        // This is what the library actually needs for math
        const pKeyBytes = hexToBytes(pKey)

        // STEP 2: Derive the Public Key bytes from the Private Key bytes
        const publicKey = secp.getPublicKey(pKeyBytes, true)

        // STEP 3: Convert the public key bytes back to a Hex string
        const derivedAddress = toHex(publicKey)

        setAddress(derivedAddress)

        // STEP 4: Fetch balance using the string version of the address
        const {
          data: { balance }
        } = await server.get(`balance/${derivedAddress}`)

        setBalance(balance)
      } catch (error) {
        // If the key is incomplete or invalid, we show the error status
        setAddress('Invalid Key')
        setBalance(0)
      }
    } else {
      setBalance(0)
      setAddress('')
    }
  }

  return (
    <div className='container wallet'>
      <h1>Your Wallet</h1>

      <label>
        Private Key
        <input
          placeholder='Type a private key'
          value={privateKey}
          onChange={onChange}
        ></input>
      </label>

      <div
        className='address-display'
        style={{ fontSize: '12px', margin: '10px 0', color: '#666' }}
      >
        Address: {address}
      </div>

      <div className='balance'>Balance: {balance}</div>
    </div>
  )
}

export default Wallet
