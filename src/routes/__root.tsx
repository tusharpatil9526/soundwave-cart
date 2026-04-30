import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SoundCart — Premium Headphones Store" },
      { name: "description", content: "Shop premium headphones from Sony, Bose, JBL, Sennheiser, Apple, Boat & more. Studio-grade sound, free delivery." },
      { name: "author", content: "SoundCart" },
      { property: "og:title", content: "SoundCart — Premium Headphones Store" },
      { property: "og:description", content: "Shop premium headphones from Sony, Bose, JBL, Sennheiser, Apple, Boat & more. Studio-grade sound, free delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@SoundCart" },
      { name: "twitter:title", content: "SoundCart — Premium Headphones Store" },
      { name: "twitter:description", content: "Shop premium headphones from Sony, Bose, JBL, Sennheiser, Apple, Boat & more. Studio-grade sound, free delivery." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bfcc0d00-0dfc-42d0-8a7d-45b7967aa6e5/id-preview-cbde0a2c--c0a7e197-0bae-479b-800a-1c3c41b2c2b0.lovable.app-1777468054166.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bfcc0d00-0dfc-42d0-8a7d-45b7967aa6e5/id-preview-cbde0a2c--c0a7e197-0bae-479b-800a-1c3c41b2c2b0.lovable.app-1777468054166.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Layout>
        <Outlet />
      </Layout>
    </AuthProvider>
  );
}
