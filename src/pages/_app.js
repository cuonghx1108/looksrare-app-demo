import dynamic from 'next/dynamic'

import { ChakraProvider } from '@chakra-ui/react'
import { WagmiConfig, createClient, configureChains } from 'wagmi'
import { getDefaultProvider } from 'ethers'
import { extendTheme } from '@chakra-ui/react';
import { StepsTheme as Steps } from 'chakra-ui-steps';
import { publicProvider } from 'wagmi/providers/public'

import '@/styles/globals.css'
import { InjectedConnector } from 'wagmi/connectors/injected'

const guSandboxChain = {
  id: 99999,
  name: 'G.U.Sandbox',
  network: 'G.U.Sandbox',
  nativeCurrency: { name: 'Sther', symbol: 'STH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sandbox1.japanopenchain.org:8545/'] },
  },
  testnet: true
}


const { chains, provider } = configureChains([guSandboxChain],   [publicProvider()],
)

const client = createClient({
  autoConnect: true,
  provider,
  connectors: [new InjectedConnector({ chains })],
})

const Layout = dynamic(
  () => import('../components/Layout'),
  { ssr: false }
)

const theme = extendTheme({
  components: {
    Steps,
  },
});

export default function App({ Component, pageProps }) {
  return <>
    <ChakraProvider theme={theme}>
      <WagmiConfig client={client}>
        <Layout>
          < Component {...pageProps} />
        </Layout>
      </WagmiConfig>
    </ChakraProvider>
  </>
}
