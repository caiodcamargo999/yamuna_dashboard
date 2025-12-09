"use client";

import Image from "next/image";


import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Megaphone,
    Filter,
    DollarSign,
    Package,
    Settings,
    Menu,
} from "lucide-react";
import { useState } from "react";

const sidebarItems = [
    {
        title: "Check-in Loja Virtual",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Meta Ads - Criativos",
        href: "/meta-ads",
        icon: Megaphone,
    },
    {
        title: "Funil Loja Virtual",
        href: "/funnel",
        icon: Filter,
    },
    {
        title: "Indicadores Financeiros",
        href: "/finance",
        icon: DollarSign,
    },
    {
        title: "Curva ABC (Tiny)",
        href: "/products",
        icon: Package,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile Trigger */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                <Menu size={24} />
            </button>

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-800">
                        <div className="relative w-32 h-10">
                            <Image
                                src="/logo/yamuna_logo.png"
                                alt="Yamuna Logo"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 px-3 space-y-1">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-slate-800 text-white shadow-sm"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                    )}
                                >
                                    <Icon size={20} />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User / Bottom Section */}
                    <div className="p-4 border-t border-slate-800">
                        <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            <Settings size={20} />
                            Configurações
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
}
