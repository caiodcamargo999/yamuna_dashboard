"use client";

import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface SkeletonProps {
    className?: string;
    style?: CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-800/50",
                className
            )}
            style={style}
        />
    );
}

// Pre-built Skeleton components for common patterns

export function SkeletonKPICard() {
    return (
        <div className="p-4 rounded-xl border bg-slate-900 border-slate-800 h-[110px] flex flex-col justify-between">
            <Skeleton className="h-3 w-24" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-2 w-16" />
            </div>
        </div>
    );
}

export function SkeletonKPIRow({ cards = 2 }: { cards?: number }) {
    return (
        <div className="relative">
            <div className="absolute -top-3 left-6 z-10 bg-slate-700 rounded-full p-1.5 animate-pulse">
                <div className="w-4 h-4" />
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-${cards} gap-4`}>
                {Array.from({ length: cards }).map((_, i) => (
                    <SkeletonKPICard key={i} />
                ))}
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <Skeleton className="h-5 w-40" />
            </div>
            {/* Table Header */}
            <div className="bg-slate-950 px-4 py-3 flex gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16 ml-auto" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-800">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="px-4 py-3 flex gap-4 items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-12 ml-auto" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SkeletonSummaryCards({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-7 w-28" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonFunnel() {
    return (
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="min-h-[300px] flex items-center justify-center gap-2">
                {[100, 85, 70, 55, 40, 30].map((height, i) => (
                    <Skeleton
                        key={i}
                        className="w-16"
                        style={{ height: `${height}%`, minHeight: 60 }}
                    />
                ))}
            </div>
        </div>
    );
}

// Full page skeleton for dashboard
export function DashboardSkeleton() {
    return (
        <div className="p-4 lg:p-8 space-y-6 animate-in fade-in duration-300">
            {/* Filter indicator */}
            <Skeleton className="h-3 w-48 -mt-4 mb-4" />

            {/* KPI Rows */}
            <div className="space-y-8">
                {/* Row 1: 2 cards */}
                <SkeletonKPIRow cards={2} />
                {/* Row 2: 4 cards */}
                <SkeletonKPIRow cards={4} />
                {/* Row 3: 2 cards */}
                <SkeletonKPIRow cards={2} />
                {/* Row 4: 3 cards */}
                <SkeletonKPIRow cards={3} />
            </div>

            {/* Funnel + Side cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SkeletonFunnel />
                <div className="space-y-6">
                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <Skeleton className="h-5 w-40 mb-4" />
                        <div className="space-y-4">
                            <div>
                                <Skeleton className="h-3 w-16 mb-2" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <div>
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-6 w-28" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// GA4 Pages Skeleton
export function GA4PageSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-300">
            <SkeletonSummaryCards count={4} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonTable rows={8} />
                <SkeletonTable rows={8} />
            </div>
            <SkeletonTable rows={5} />
        </div>
    );
}

// Source/Medium Page Skeleton
export function SourceMediumSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-300">
            <SkeletonSummaryCards count={5} />
            <SkeletonTable rows={12} />
        </div>
    );
}

// Products/RFM Page Skeleton
export function ProductsTableSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-300">
            {/* Search/Filter bar */}
            <div className="flex gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <SkeletonTable rows={15} />
        </div>
    );
}

// Meta Ads Grid Skeleton
export function MetaAdsGridSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-300">
            {/* Header with filters */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
            {/* Grid of creative cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <Skeleton className="aspect-square w-full" />
                        <div className="p-3 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Funnel Page Skeleton
export function FunnelPageSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-300">
            <SkeletonSummaryCards count={4} />
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <Skeleton className="h-5 w-40 mb-6" />
                <div className="flex items-end justify-center gap-4 h-[350px]">
                    {[100, 80, 60, 45, 35, 25].map((h, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Skeleton
                                className="w-20"
                                style={{ height: `${h * 3}px` }}
                            />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
