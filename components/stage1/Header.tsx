"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import UserMenu from "./UserMenu"

const NAV_ITEMS = [
  { label: "Start", href: "/start" },
  { label: "Generate", href: "/gen-image" },
  { label: "Results", href: "/results" },
  { label: "Contact Us", href: "/feedback" },
]

export default function FunctionalHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b border-white/10 bg-black/70 backdrop-blur-md relative z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-wide text-white">
          Rizzify
        </Link>
        <nav className="hidden gap-8 text-sm font-medium text-white/80 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={isActive ? "text-white" : "transition-colors hover:text-white"}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="relative z-50">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
