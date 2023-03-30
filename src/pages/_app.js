import dynamic from 'next/dynamic'

import { ChakraProvider } from '@chakra-ui/react'
import { WagmiConfig, createClient } from 'wagmi'
import { getDefaultProvider } from 'ethers'

import '@/styles/globals.css'

const client = createClient({
  autoConnect: true,
  provider: getDefaultProvider(),
})

const Layout = dynamic(
  () => import('../components/Layout'),
  { ssr: false }
)


export default function App({ Component, pageProps }) {
  return <>
    <ChakraProvider>
      <WagmiConfig client={client}>
        <Layout>
          < Component {...pageProps} />
        </Layout>
      </WagmiConfig>
    </ChakraProvider>
  </>
}
