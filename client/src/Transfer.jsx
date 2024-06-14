import {useState} from "react";
import server from "./server";
import * as secp from 'ethereum-cryptography/secp256k1';
import {keccak256} from "ethereum-cryptography/keccak";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  const generateRandomKey = () => {
    return secp.utils.randomPrivateKey();
  }

  async function transfer(evt) {
    evt.preventDefault();

    const newKey = generateRandomKey();

    const msg = {
      amount: parseInt(sendAmount),
      recipient,
      date: new Date(),
      messageKey: newKey}
    const hashedData = keccak256(Uint8Array.from(msg));
    let sig = await secp.sign(hashedData, privateKey, {recovered: true});
    const senderPublicKey = secp.getPublicKey(privateKey);
    const isValidSig = secp.verify(sig[0], hashedData, senderPublicKey);
    if (isValidSig) {
      try {
        const {
          data: { balance },
        } = await server.post(`send`, {
          signature: sig[0].toString(),
          recoveryBit: sig[1],
          message: msg
        });
        setBalance(balance);
      } catch (ex) {
        alert(ex.response.data.message);
      }
    }
  }
  
  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
