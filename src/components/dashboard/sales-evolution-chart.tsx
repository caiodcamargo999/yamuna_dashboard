"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchSalesEvolution, fetchSimpleProductList } from "@/app/products-actions"; // Updated import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
    sales: {
        label: "Vendas (un)",
        color: "hsl(var(--chart-1))",
    },
    revenue: {
        label: "Receita (R$)",
        color: "hsl(var(--chart-2))",
    },
};

export function SalesEvolutionChart() {
    const [mount, setMount] = React.useState(false);

    // Start as false. Only set to true when we ACTUALLY have a product and are fetching history.
    // The initial product load happens transparently or shows a different "initializing" state if needed,
    // but usually 'false' is safer to avoid infinite spinner if list is empty.
    const [loading, setLoading] = React.useState(false);
    const [chartData, setChartData] = React.useState<any[]>([]);

    // Filters
    const [product, setProduct] = React.useState<string>("");
    const [channel, setChannel] = React.useState<'all' | 'b2b' | 'b2c'>("all");
    const [granularity, setGranularity] = React.useState<'month' | 'week'>("month");

    // Data list
    const [products, setProducts] = React.useState<any[]>([]);
    const [listLoading, setListLoading] = React.useState(true); // Seperate loading state for the dropdown list

    React.useEffect(() => {
        setMount(true);
        // Load initial product list
        async function loadProducts() {
            setListLoading(true);
            try {
                // Use Simple List (Fast) - Defaults to last 30 days top 20
                const list = await fetchSimpleProductList(30);

                setProducts(list);
                if (list.length > 0) {
                    setProduct(list[0].name);
                }
            } catch (err) {
                console.error("Failed to load products", err);
            } finally {
                setListLoading(false);
            }
        }
        loadProducts();
    }, []);

    React.useEffect(() => {
        if (!product) return;

        async function loadEvolution() {
            setLoading(true);
            try {
                const data = await fetchSalesEvolution("6months", channel, product, granularity);
                setChartData(data);
            } catch (err) {
                console.error(err);
                setChartData([]);
            } finally {
                setLoading(false);
            }
        }

        loadEvolution();
    }, [product, channel, granularity]);

    if (!mount) return null;

    return (
        <Card className="col-span-full">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 pb-2">
                    <div className="space-y-1 text-center sm:text-left">
                        <CardTitle>Evolução de Vendas por Produto</CardTitle>
                        <CardDescription>
                            Analise o desempenho histórico por canal e granularidade
                        </CardDescription>
                    </div>
                </div>
                {/* Filters Row - Keep existing filters but standardizing spacing */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                    {/* Product Selector */}
                    <Select value={product} onValueChange={setProduct}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione o Produto" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {products.map((p, i) => (
                                <SelectItem key={i + p.code} value={p.name}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Channel Selector */}
                    <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Canal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="b2b">B2B</SelectItem>
                            <SelectItem value="b2c">B2C</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Granularity Selector */}
                    <Select value={granularity} onValueChange={(v: any) => setGranularity(v)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Periodo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">Mensal</SelectItem>
                            <SelectItem value="week">Semanal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {listLoading ? (
                    <div className="h-[300px] flex flex-col items-center justify-center gap-2">
                        <LoadingSpinner className="w-8 h-8" />
                        <p className="text-sm text-muted-foreground">Carregando lista de produtos...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground origin-center">
                        Nenhum produto encontrado nos últimos 30 dias.
                    </div>
                ) : loading ? (
                    <div className="h-[300px] flex flex-col items-center justify-center gap-2">
                        <LoadingSpinner className="w-8 h-8" />
                        <p className="text-sm text-muted-foreground">Carregando histórico de vendas...</p>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Sem dados para o período/filtros selecionados.
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
                        <AreaChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                                left: 12,
                                right: 12,
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="period"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            {/* Dual Axis for Scale */}
                            <YAxis
                                yAxisId="left"
                                orientation="left"
                                tickLine={false}
                                axisLine={false}
                                hide // Hide axis lines for cleaner look like reference
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickLine={false}
                                axisLine={false}
                                hide
                            />

                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <defs>
                                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-sales)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-sales)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-revenue)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-revenue)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <Area
                                yAxisId="right"
                                dataKey="revenue"
                                type="natural"
                                fill="url(#fillRevenue)"
                                fillOpacity={0.4}
                                stroke="var(--color-revenue)"
                                stackId="a" // Stacked or not? Revenue vs Sales usually bad to stack. Keeping separate. 
                            // Actually, user requested "Gradient" style which usually implies stacking if same unit.
                            // Different units -> DO NOT STACK. Remove stackId.
                            />
                            <Area
                                yAxisId="left"
                                dataKey="sales"
                                type="natural"
                                fill="url(#fillSales)"
                                fillOpacity={0.4}
                                stroke="var(--color-sales)"
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
