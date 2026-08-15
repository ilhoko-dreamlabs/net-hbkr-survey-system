import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://survey.hbkr.net"),
  title: "AI Positioning Survey | HBKR",
  description:
    "Domain × AI Depth × Role × Production Maturity로 현재의 AI 활용 포지션을 구조화합니다.",
  openGraph: {
    title: "AI Positioning Survey | HBKR",
    description: "AI 활용 역량의 모양과 현재 포지션을 발견하는 5분 설문",
    type: "website",
    locale: "ko_KR",
    url: "https://survey.hbkr.net",
    siteName: "HBKR",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Positioning Survey | HBKR",
    description: "AI 캐릭터와 다음 7일의 실행 퀘스트를 발견하는 5분 설문",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2f0ea",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
