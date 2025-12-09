import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-950">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
                {/* Note: The Header title will need to be dynamic. 
            For now, we place the Header in the Layout, but realistically 
            each page might want to control its title or we use a context.
            For simplicity, I'll pass a generic title or let the page render the header if needed.
            However, to match the design (Sticky Header), it's good in Layout.
            I'll make it generic "Dashboard" for now, or move it to page level if needed.
            Actually, looking at the design, the header title changes "Meta Ads", "Check-in".
            So it's better to having the Header inside the Layout but updateable, OR 
            just put the Header in the Page itself if we want full control.
            
            Let's put the Header here with a default, but individual pages might override or we use a Client Component context.
            Easiest approach for MVP: Render Header in Layout, but pages can't easily change it without Context.
            
            Alternative: The Layout ONLY handles the Sidebar and the Main Content Container. 
            The Header is part of the Page or a separate component included in every page.
            BUT, to keep the layout consistent (scroll behavior), top bar usually stays.
            
            Let's stick to: Layout has Sidebar. 
            The `children` (Page) will render the Header + Content.
            This gives maximum flexibility for the "Title".
        */}
                {children}
            </div>
        </div>
    );
}
