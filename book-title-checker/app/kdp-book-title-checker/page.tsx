import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { getPage } from "@/lib/pages";

const page = getPage("/kdp-book-title-checker");

export const metadata: Metadata = {
  title: { absolute: page.title },
  description: page.description,
  alternates: { canonical: page.slug },
  openGraph: { title: page.title, description: page.description, url: page.slug },
};

export default function Page() {
  return <LandingPage page={page} />;
}
