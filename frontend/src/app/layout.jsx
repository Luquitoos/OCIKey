import { Blinker, Golos_Text } from "next/font/google";
import "./globals.css";

const blinker = Blinker({
  variable: "--font-blinker",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const golosText = Golos_Text({
  variable: "--font-golos-text",
  subsets: ["latin"],
});

export const metadata = {
  title: "OCI | Controle de Gabaritos",
  description:
    "Leia gabaritos automaticamente. Organize alunos, provas, escolas e notas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className={`${golosText.variable} ${blinker.variable}`}>
        {children}
      </body>
    </html>
  );
}
