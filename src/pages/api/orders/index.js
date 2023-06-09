import clientPromise from "../../../../lib/mongodb";
export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const client = await clientPromise;
      const db = client.db("nft-marketplaces");
      const body = JSON.parse(req.body);
      const data = await db.collection("orders").insertOne(body)
      await db.collection("nonces").updateOne({ address: body.signer}, { $inc: { nonce: 1 }}, {upsert: true})
  
      res.json(data)
    } catch (error) {
      console.error(error)
    }
  }

  if (req.method === "GET") {
    const client = await clientPromise;
    const db = client.db("nft-marketplaces");
    const orders = await db.collection("orders").find().toArray()

    res.json(orders)
  }
}