const express = require("express");
const app = express();
const cors = require("cors");
const secp = require("ethereum-cryptography/secp256k1");
const {toHex} = require("ethereum-cryptography/utils");
const {keccak256} = require("ethereum-cryptography/keccak");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "044abacb53f9abb5857e2a37f3a4a098235dcedbb8de42b74f9e933eb9c426f0b1b6be24a6e141c013c5acb9c3f738622492b02d8b7d07e22ead3f01db25076ace": 100,
  "0411edd79e2c623a7bb70eeb5ab7439a94c926963704c53f7266c244f6b2ef3f6bec6013bac1dac5fbb6f677c9bf7ea3ab778e2211c317140e7e711ecc672b0afe": 50,
  "0446e8ee834595ae3733af7729e396d30f2286c7c6469a1dcbc0b4603357139e7f909e2bb42f79855a135356309414b896ec9e77df947d0f255862db3ecca7655d": 75,
};

let seenKeys = [];

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {

  const { signature, recoveryBit, message } = req.body;

  if (!seenKeys.includes(message.messageKey)) {
    seenKeys.push(message.messageKey);
    setTimeout(() => {
      const now = new Date();
      const elapsedTime = now - message.date;
      if (elapsedTime > 1000) {
        res.status(400).send({message: "Message too old"});
      }
      let signatureNum = Uint8Array.from(signature.split(',').map(Number));
      const sender = toHex(secp.recoverPublicKey(keccak256(Uint8Array.from(message)), signatureNum, recoveryBit));
      if (secp.verify(signatureNum, keccak256(Uint8Array.from(message)), sender)) {
        setInitialBalance(sender);
        setInitialBalance(message.recipient);
        if (balances[sender] < message.amount) {
          res.status(400).send({ message: "Not enough funds!" });
        } else {
          balances[sender] -= message.amount;
          balances[message.recipient] += message.amount;
          res.send({ balance: balances[sender] });
        }
      }
    });
  } else {
    res.status(400).send({ message: "Message already sent" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
