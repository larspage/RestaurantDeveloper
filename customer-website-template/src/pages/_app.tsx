import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { CartProvider } from '@/context/CartContext'
import ShoppingCart from '@/components/ShoppingCart'
import CartButton from '@/components/CartButton'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Component {...pageProps} />
      <CartButton />
      <ShoppingCart />
    </CartProvider>
  )
} 