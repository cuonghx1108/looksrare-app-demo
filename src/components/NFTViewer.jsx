import { useProvider } from "wagmi";
import { NftProvider, useNft } from "use-nft"
import { Image, Box, VStack } from "@chakra-ui/react";

function Nft({ nft }) {
  const { loading, error, nft: data } = useNft(
    nft.collection,
    nft.tokenId
  )


  if (loading) {
      return "Loading"
  }
  
  if (error) {
    return "Error"
  }
  return <VStack
  spacing={4}
  align='stretch'
>
    <Box>

    <Image src={data.image} />

  </Box>
  <Box>
    Name: {data.name}
  </Box>
  <Box >
    Description: {data.description}
  </Box>
</VStack>
}
  
export default function NFTViewer({ nft }) {
  const provider = useProvider()
  return <NftProvider fetcher={["ethers", { provider }]}><Nft nft={nft} /></NftProvider>
}