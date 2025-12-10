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
    LogOut,
    Users,
    Globe,
    Share2,
} from "lucide-react";
import { signout } from "@/app/login/actions";
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
        title: "Google Ads",
        href: "/google-ads",
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
    {
        title: "RFM - Clientes",
        href: "/rfm",
        icon: Users,
    },
    {
        title: "Público-alvo (GA4)",
        href: "/publico-alvo",
        icon: Globe,
    },
    {
        title: "Origem/Mídia (GA4)",
        href: "/origem-midia",
        icon: Share2,
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
                    "fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:block border-r border-slate-900",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="h-24 flex items-center px-6 border-b border-slate-800">
                        <div className="relative w-48 h-16">
                            <img
                                alt="Yamuna Logo"
                                className="w-auto h-10 object-contain"
                                src="/logos/yamuna_logo.png"
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
                    <div className="p-4 border-t border-slate-800 space-y-1">
                        <Link
                            href="/settings"
                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                            <Settings size={20} />
                            Configurações
                        </Link>

                        <form action={signout}>
                            <button type="submit" className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors">
                                <LogOut size={20} />
                                Sair
                            </button>
                        </form>

                        <div className="pt-4 mt-4 border-t border-slate-800 text-center">
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
                                Powered by
                            </p>
                            <p className="text-xs text-slate-500 font-bold mt-0.5">
                                MILENNIALS
                            </p>
                        </div>
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
