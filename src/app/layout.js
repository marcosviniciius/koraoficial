import { Inter, Shrikhand } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import Analytics from "@/components/Analytics";
import { ImageModalProvider } from "@/context/ImageModalContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const shrikhand = Shrikhand({
  weight: "400",
  variable: "--font-shrikhand",
  subsets: ["latin"],
});

export const metadata = {
  title: "Kora | E-commerce Esportivo",
  description: "As melhores camisas de time na sua casa.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${shrikhand.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <ImageModalProvider>
            <Analytics />
            {children}
            <CartDrawer />
          </ImageModalProvider>
        </CartProvider>
      </body>
    </html>
  );
}
