import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$pageId")({
  component: GenericPage,
});

function GenericPage() {
  const { pageId } = Route.useParams();
  
  const titles: Record<string, string> = {
    about: "About Us",
    careers: "Careers",
    press: "Press & Media",
    blog: "Sellora Blog",
    help: "Help Center",
    trust: "Trust & Safety",
    tips: "Selling Tips",
    contact: "Contact Us",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    cookies: "Cookie Policy"
  };

  const title = titles[pageId] || "Page Not Found";

  if (!titles[pageId]) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-20 min-h-[60vh]">
        <div className="max-w-md text-center">
          <h1 className="font-display text-6xl font-bold text-muted">404</h1>
          <h2 className="mt-4 font-display text-2xl font-bold">Page not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 min-h-[60vh] max-w-4xl">
      <div className="rounded-3xl bg-card p-10 border border-border/40 shadow-soft">
        <h1 className="font-display text-4xl font-extrabold mb-6 text-foreground">{title}</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
          <p className="text-xl font-medium text-foreground mb-6">
            Welcome to the {title} page. This section is currently being updated.
          </p>
          <p className="mb-4">
            Sellora is the next-generation marketplace, and we are constantly expanding our platform. 
            We are working hard to bring you comprehensive and detailed information regarding our {title.toLowerCase()}.
          </p>
          <p>
            Please check back soon. If you need immediate assistance, feel free to reach out to our support team at <strong>support@sellora.com</strong> or call us at <strong>1-800-SELLORA</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
