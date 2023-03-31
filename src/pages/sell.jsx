import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { Steps, Step, useSteps } from 'chakra-ui-steps';
import { Button, Wrap, WrapItem, Box,   FormErrorMessage,
  FormLabel,
  FormControl,
  Input,
  useToast,
  Text, } from '@chakra-ui/react';
import { useForm } from 'react-hook-form'
import { erc721ABI, useAccount, useContract, useNetwork, useProvider, useSigner } from 'wagmi';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { addressesByNetwork, signMakerOrder } from '@cuonghx.gu-tech/looksrare-sdk';
import useSWR from 'swr'
import orderValidatorAbi from "../../abi/order-validator"
import useSWRMutation from 'swr/mutation'

const inter = Inter({ subsets: ['latin'] })

const ChooseNFT = ({ nextStep, setNft }) => {
  const provider = useProvider();
  const { address } = useAccount();
  const toast = useToast()

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(values) {

    try {
      const erc721 = new ethers.Contract(values.collection, erc721ABI, provider)
      const owner = await erc721.ownerOf(values.tokenId)

      if (owner === address) {
        setNft(values)
        nextStep()
        return;
      }

      toast({
        title: "NFT is belong to you",
        status: "error"
      })
    } catch (error) {
      toast({
        title: "NFT is not exist",
        status: "error"
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={errors.collection}>
        <FormLabel htmlFor='collection'>Collection</FormLabel>
        <Input
          id='collection'
          placeholder='collection'
          {...register('collection', {
            required: 'This is required',
          })}
        />
        <FormErrorMessage>
          {errors.collection && errors.collection.message}
        </FormErrorMessage>

        <FormLabel htmlFor='tokenId'>TokenId</FormLabel>
        <Input
          id='tokenId'
          placeholder='tokenId'
          {...register('tokenId', {
            required: 'This is required',
          })}
        />
        <FormErrorMessage>
          {errors.tokenId && errors.tokenId.message}
        </FormErrorMessage>

      </FormControl>
      <Button mt={4} colorScheme='teal' isLoading={isSubmitting} type='submit'>
        Next
      </Button>
    </form>
  )
}

const ApproveNFT = ({ nextStep, prevStep, nft }) => {
  const toast = useToast()

  const { data: signer } = useSigner()
  const erc721 = useContract({ address: nft.collection, abi: erc721ABI, signerOrProvider: signer })
  const { chain } = useNetwork()
  const { address } = useAccount();
  const addresses = addressesByNetwork[chain.id];
  const [loading, setLoading] = useState(false);

  const approve = async () => {
    try {
      setLoading(true)
      let approved = await erc721.isApprovedForAll(address, addresses.TRANSFER_MANAGER_ERC721)

      if (!approved) {
        const tx = await erc721.setApprovalForAll(addresses.TRANSFER_MANAGER_ERC721, true)
        await tx.wait()
      }
      setLoading(false)
      nextStep()

    } catch (error) {
      setLoading(false)
      toast({
        title: "User is denied",
        status: "error"
      })
    }

  }

  return <Box>
    <Box>
      <Text>Collection: {nft.collection}</Text>
      <Text>TokenId: {nft.tokenId}</Text>
    </Box>
    <Button mt={4} colorScheme='teal' onClick={approve} isLoading={loading}>
      Approve
    </Button>
    <Button mt={4} onClick={prevStep}>
      Previous
    </Button>
  </Box>
}

const SellNFT = ({ reset, nft }) => {
  const fetcher = (...args) => fetch(...args).then(res => res.json())
  async function sendRequest(url, { arg }) {
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(arg)
    }).then(res => res.json())
  }

  const toast = useToast()
  const { address } = useAccount();
  const { chain } = useNetwork()
  const { data: nonce } = useSWR(`/api/nonces/${address}`, fetcher)
  const provider = useProvider();
  const { data: signer } = useSigner()
  const { trigger, isMutating } = useSWRMutation('/api/orders', sendRequest)

  const addresses = addressesByNetwork[chain.id];
  const now = Math.floor(Date.now() / 1000);

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (values) => {
    try {


      const makerOrder = {
        isOrderAsk: true,
        signer: address,
        collection: nft.collection,
        price: values.price, 
        tokenId: nft.tokenId,
        amount: "1",
        strategy: addresses.STRATEGY_STANDARD_SALE_DEPRECATED,
        currency: addresses.WETH,
        nonce: nonce, 
        startTime: now,
        endTime: now + 86400,
        minPercentageToAsk: 0,
        params: [],
      };

      // sign
      const signatureHash = await signMakerOrder(signer, chain.id, makerOrder);
      const { v,r,s } = ethers.utils.splitSignature(signatureHash);
      const order = { ...makerOrder, v, r, s}
    
      // check order
      const orderValidatorV1 = new ethers.Contract(addresses.ORDER_VALIDATOR_V1, orderValidatorAbi, provider);
      const valids = await orderValidatorV1.checkOrderValidity(order)

      if (!valids.every(s => s.toNumber() === 0)) {
        throw valids
      }
      // call api
      await trigger(order);
      toast({
        title: "Success",
        status: "success"
      })

    } catch (error) {
      console.error(error)
      toast({
        title: "User is denied",
        status: "error"
      })
    }

  }

  return <Box>
  <Box>
    <Text>Collection: {nft.collection}</Text>
    <Text>TokenId: {nft.tokenId}</Text>
    <Text>Nonce: {nonce}</Text>
  
    </Box>
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={errors.price}>
        <FormLabel htmlFor='price'>Price</FormLabel>
        <Input
          id='price'
          placeholder='price'
          {...register('price', {
            required: 'This is required',
          })}
        />
        <FormErrorMessage>
          {errors.price && errors.price.message}
        </FormErrorMessage>
      </FormControl>
      <Button mt={4} colorScheme='teal' type='submit' isLoading={isSubmitting}>
        Sell
      </Button>
    </form>
  
  <Button mt={4} onClick={reset}>
    Reset
  </Button>
</Box>
}

export default function Sell() {
  const [nft, setNft] = useState();
  const { nextStep, prevStep, reset, activeStep } = useSteps({
    initialStep: 0,
  });
  return (
    <div>
    <Steps activeStep={activeStep}>
      <Step label="Choose NFT" description="Fill your collection address and token id" />
      <Step label="Approve" description="Approve to exchange your NFT" />
      <Step label="Listing NFT" description="Listing your NFT into market" />
      </Steps>
      <Box>
        {activeStep === 0 && <ChooseNFT nextStep={nextStep} setNft={setNft} />}
        {activeStep === 1 && <ApproveNFT prevStep={prevStep} nextStep={nextStep} nft={nft} />}
        {activeStep === 2 && <SellNFT reset={reset} nft={nft} />}
      </Box>
  </div>
  )
}
