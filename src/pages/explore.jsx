import {
  Box,
  SimpleGrid,
  Text,
  Button,
  useToast
} from '@chakra-ui/react';
import useSWR from 'swr'
import { addressesByNetwork } from '@cuonghx.gu-tech/looksrare-sdk';
import { ethers } from 'ethers';
import exchangeAbi from "../../abi/exchange";
import { useAccount, useNetwork, useSigner } from 'wagmi';
import { useState } from 'react';
import NFTViewer from '@/components/NFTViewer';

export default function Explore() {
  const fetcher = (...args) => fetch(...args).then(res => res.json())
  const { data: orders, isLoading } = useSWR(`/api/orders`, fetcher)
  const [loading, setLoading] = useState({});

  const { chain } = useNetwork()
  const toast = useToast()
  const { data: signer } = useSigner()
  const { address } = useAccount();

  const buy = async (makerAskOrder) => {
    try {
      setLoading({ [makerAskOrder._id]: true} )
      const takerBidOrder = {
        isOrderAsk: false,
        taker: address,
        price: makerAskOrder.price,
        tokenId: makerAskOrder.tokenId,
        minPercentageToAsk: 0,
        params: [],
      }
      const addresses = addressesByNetwork[chain.id];
      const looksRareExchange = new ethers.Contract(addresses.EXCHANGE, exchangeAbi, signer)

      const tx = await looksRareExchange.matchAskWithTakerBidUsingETHAndWETH(takerBidOrder, makerAskOrder, { value: takerBidOrder.price });
      await tx.wait()

      toast({
        title: "Success",
        status: "success"
      })

      setLoading({ [makerAskOrder._id]: false} )
    } catch (error) {
      setLoading({ [makerAskOrder._id]: false} )
      console.error(error)
    }
  }
  if (isLoading) {
    return <Text>Loading...</Text>
  }

  return <Box>
    <SimpleGrid columns={3} spacing={10}>
      {orders.map((order) => {
        return <Box key={order._id} bg="#ecf0f1" padding={3} borderRadius="5px">
            <SimpleGrid columns={2} spacing={10}>
      <Box>
      <Text>Collection: {order.collection}</Text>
          <Text>TokenId: {order.tokenId}</Text>
    </Box>
      <Box>          <NFTViewer nft={{ collection: order.collection, tokenId: order.tokenId }}/>
</Box>

</SimpleGrid>

          <Button colorScheme='teal'onClick={() => buy(order)} isLoading={loading[order._id]}>Buy</Button>
        </Box>
      })}
    </SimpleGrid>
  </Box>
}