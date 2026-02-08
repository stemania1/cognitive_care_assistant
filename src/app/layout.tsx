import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AlertProvider } from "./components/AlertCenter";
import { GlobalAlertButton } from "./components/GlobalAlertButton";
import { StructuredData } from "./components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cognitive-care-assistant.vercel.app'),
  title: {
    default: "Cognitive Care Assistant | Health Monitoring for Dementia Patients | 2025 Congressional App Challenge Winner",
    template: "%s | Cognitive Care Assistant"
  },
  description: "Cognitive Care Assistant - Winner of the 2025 Congressional App Challenge. A comprehensive health-monitoring platform designed to improve daily life for dementia patients and caregivers. Features EMG sensors, thermal monitoring, daily assessments, medication reminders, and more.",
  keywords: [
    "cognitive care assistant",
    "Cognitive Care Assistant",
    "dementia care",
    "dementia health monitoring",
    "cognitive health",
    "health monitoring for dementia",
    "elderly care technology",
    "caregiver support app",
    "EMG sensor monitoring",
    "thermal monitoring dementia",
    "medication reminders dementia",
    "Congressional App Challenge winner",
    "Florida District 17",
    "Corbin Craig",
    "Connor Craig",
    "Pine View School",
    "dementia patient care",
    "memory care technology",
    "assisted living technology"
  ],
  authors: [{ name: "Corbin Craig and Connor Craig" }],
  creator: "Corbin Craig and Connor Craig",
  publisher: "Cognitive Care Assistant",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Cognitive Care Assistant",
    title: "Cognitive Care Assistant | Health Monitoring for Dementia Patients | 2025 Congressional App Challenge Winner",
    description: "Cognitive Care Assistant - Winner of the 2025 Congressional App Challenge. A comprehensive health-monitoring platform designed to improve daily life for dementia patients and caregivers.",
    images: [
      {
        url: "/digital_brain.png",
        width: 1200,
        height: 630,
        alt: "Cognitive Care Assistant - Health Monitoring for Dementia Patients",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cognitive Care Assistant | Health Monitoring for Dementia Patients | 2025 Congressional App Challenge Winner",
    description: "Cognitive Care Assistant - Winner of the 2025 Congressional App Challenge. A comprehensive health-monitoring platform for dementia patients and caregivers.",
    images: ["/digital_brain.png"],
    creator: "@CognitiveCare",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: "your-verification-code",
  },
  alternates: {
    canonical: "/",
  },
  category: "healthcare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Cognitive Care Assistant",
    "alternateName": "Cognitive Care Assistant App",
    "description": "Cognitive Care Assistant - A comprehensive health-monitoring platform designed to improve daily life for dementia patients and caregivers. Winner of the 2025 Congressional App Challenge for Florida's District 17.",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://cognitive-care-assistant.vercel.app",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "award": "Winner of the 2025 Congressional App Challenge - Florida District 17",
    "creator": [
      {
        "@type": "Person",
        "name": "Corbin Craig",
        "affiliation": {
          "@type": "EducationalOrganization",
          "name": "Pine View School"
        }
      },
      {
        "@type": "Person",
        "name": "Connor Craig",
        "affiliation": {
          "@type": "EducationalOrganization",
          "name": "Pine View School"
        }
      }
    ],
    "featureList": [
      "EMG sensor monitoring",
      "Thermal sensor monitoring",
      "Daily health assessments",
      "Medication reminders",
      "Photo album",
      "Memory games",
      "Sleep behavior tracking"
    ],
    "keywords": "cognitive care assistant, dementia care, health monitoring, elderly care, caregiver support"
  };

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <StructuredData data={organizationStructuredData} />
          <AlertProvider>
            {children}
            <GlobalAlertButton />
          </AlertProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
