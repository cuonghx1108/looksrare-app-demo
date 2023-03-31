import clientPromise from "../../../../lib/mongodb";

export default async function handler(req, res) {
  const { address } = req.query
  
  try {
    const client = await clientPromise;
    const db = client.db("nft-marketplaces");

    const nonce = await db.collection("nonces").findOne({ address })
    res.json(nonce.nonce || 0)
  } catch (error) {
    console.error(error)
  }
}