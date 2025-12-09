import { login, signup, signInWithGoogle } from './actions'

export default async function LoginPage(props: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const searchParams = await props.searchParams;

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img
                            src="/logos/milennials_branco.png"
                            alt="Millennials Logo"
                            className="h-24 w-auto object-contain"
                        />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
                        Acesso ao Dashboard
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Entre com sua conta para continuar
                    </p>
                </div>

                {searchParams?.message && (
                    <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{searchParams.message}</span>
                    </div>
                )}

                {searchParams?.error && (
                    <div className="bg-red-950 border border-red-900 text-red-200 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{searchParams.error}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6">
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-t-md border-0 bg-zinc-900 py-1.5 text-white ring-1 ring-inset ring-zinc-800 placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-3"
                                placeholder="Seu email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-b-md border-0 bg-zinc-900 py-1.5 text-white ring-1 ring-inset ring-zinc-800 placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-3"
                                placeholder="Sua senha"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between space-x-4">
                        <button
                            formAction={login}
                            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Entrar
                        </button>
                        <button
                            formAction={signup}
                            className="group relative flex w-full justify-center rounded-md bg-zinc-800 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600"
                        >
                            Cadastrar
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-950 px-2 text-slate-400">Ou continue com</span>
                        </div>
                    </div>

                    <button
                        formAction={signInWithGoogle}
                        formNoValidate
                        className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24292F]"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </button>

                </form>
            </div>
        </div>
    )
}
