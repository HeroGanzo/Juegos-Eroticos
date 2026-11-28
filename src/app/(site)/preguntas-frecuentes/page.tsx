import type { Metadata } from "next";
import { FaQuestion } from "react-icons/fa";
import { PageHeader } from "@/components/Bits";
import { getSettings } from "@/lib/settings";
import { baseMetadata, siteBaseUrl, jsonLd, faqPageJsonLd } from "@/lib/seo";
import { containerCls } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS, FAQ_PAGE } from "@/lib/faq";
import { FaqList } from "@/components/Faq";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return baseMetadata({
    title: FAQ_PAGE.title,
    description: FAQ_PAGE.description,
    path: FAQ_PAGE.path,
    image: settings.heroImage || undefined,
  });
}

export default async function FaqPage() {
  const settings = await getSettings();
  const base = await siteBaseUrl();
  const schema = jsonLd({ "@context": "https://schema.org", "@graph": [faqPageJsonLd(FAQ_ITEMS)] });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} key="schema-faq" />
      <PageHeader title={FAQ_PAGE.title} icon={<FaQuestion />} subtitle={FAQ_PAGE.description} />
      <div className={cn(containerCls, "py-10")}>
        <section className="max-w-3xl mx-auto">
          <FaqList items={FAQ_ITEMS} />
        </section>
      </div>
    </>
  );
}
