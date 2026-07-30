import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Sheriff Pepe - The Original Meme of Robinhood Chain",
  description: "Crypto trading made simple",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="overflow-x-hidden">
      <body className={`${inter.variable} font-sans antialiased overflow-x-hidden`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}