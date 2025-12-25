import { cookies } from 'next/headers';
import { Sidebar } from "@/components/layout/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ... existing user parsing code ...
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const googleIdentity = user?.identities?.find((id: { provider: string;[key: string]: any }) => id.provider === 'google');
    const googleAvatar = googleIdentity?.identity_data?.avatar_url || googleIdentity?.identity_data?.picture;

    // Fetch real role AND tenant_id from DB - OPTIMIZED: Single query
    let dbRole = null;
    let initialTenantId = null;

    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single();
        if (profile) {
            dbRole = profile.role;
            initialTenantId = profile.tenant_id;
        }
    }

    const userData = user ? {
        name: user.user_metadata.full_name || user.user_metadata.name || 'Usuário',
        email: user.email || '',
        avatar: user.user_metadata.avatar_url || user.user_metadata.picture || googleAvatar || '',
        role: dbRole === 'super_admin' ? 'Super Admin' : (user.user_metadata.role || 'Cliente (Milennials)')
    } : {
        name: 'Yamuna',
        email: '',
        avatar: '',
        role: 'Cliente (Milennials)'
    };

    // --- TENANT CONTEXT LOGIC (OPTIMIZED) ---
    const cookieStore = await cookies();
    const impersonatedTenantId = cookieStore.get('active_tenant_id')?.value;
    const isSuperAdmin = dbRole === 'super_admin';

    let targetTenantIdOrSlug = impersonatedTenantId || initialTenantId;

    // If Super Admin has NO context, default to 'Yamuna' for now so they see something
    if (isSuperAdmin && !targetTenantIdOrSlug) {
        targetTenantIdOrSlug = 'yamuna';
    }

    // Default modules for fallback (prevents empty sidebar)
    let modules: string[] = ['dashboard', 'meta_ads', 'google_ads', 'tiny_erp', 'wake_commerce', 'finance', 'rfm', 'ga4'];
    let tenantName = "Yamuna";

    if (targetTenantIdOrSlug) {
        // Fetch modules for this tenant (non-blocking, with timeout)
        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetTenantIdOrSlug);

            const query = supabase.from('tenants').select('modules, name');

            if (isUuid) {
                query.eq('id', targetTenantIdOrSlug);
            } else {
                query.eq('slug', targetTenantIdOrSlug);
            }

            const { data: tenantData } = await query.single();

            if (tenantData) {
                if (tenantData.modules && Array.isArray(tenantData.modules) && tenantData.modules.length > 0) {
                    modules = tenantData.modules;
                }
                if (tenantData.name) {
                    tenantName = tenantData.name;
                }
            }
        } catch (e) {
            console.warn('[Layout] Failed to fetch modules, using default:', e);
            // Keep default modules
        }
    }

    return (
        <div className="min-h-screen bg-transparent">
            {/* 
               Sidebar is now FIXED (h-screen, sticky).
               We need to add padding-left to the main content to avoid overlap.
               Sidebar width is w-[260px] -> pl-[260px]
            */}
            <Sidebar user={userData} modules={modules} tenantName={tenantName} />

            <div className="lg:pl-[260px] w-full min-h-screen flex flex-col pt-16 lg:pt-0">
                {children}
            </div>
        </div>
    );
}
