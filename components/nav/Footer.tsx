import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/about',    label: 'About'    },
  { href: '/faq',      label: 'FAQ'      },
  { href: '/contact',  label: 'Contact'  },
  { href: '/privacy',  label: 'Privacy'  },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      role="contentinfo"
      className="border-t border-border bg-background"
    >
      {/* Extra bottom padding so content clears the mobile bottom nav */}
      <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 md:pb-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Brand — quiet, no gradient */}
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span
              aria-hidden="true"
              className="inline-flex size-7 items-center justify-center rounded-lg border border-ink/10 bg-mist"
            >
              <svg
                className="size-4 text-[--color-orange]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            Lost &amp; Found
          </p>

          {/* Links */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1" role="list">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            &copy; {year} Lost &amp; Found. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
