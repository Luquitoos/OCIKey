import { Golos_Text, Blinker } from "next/font/google";
import "./globals.css";

const golosText = Golos_Text({
  variable: "--font-golos-text",
  subsets: ["latin"],
});

const blinker = Blinker({
  variable: "--font-blinker",
  subsets: ["latin"],
});

export const metadata = {
  title: "OCI | Controle de Gabaritos",
  description: "Leia gabaritos automaticamente. Organize alunos, provas, escolas e notas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${golosText.variable} ${blinker.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
