import { useState, type CSSProperties } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { authService, LoginReq, RegisterReq } from '../services/auth'; // Import service

type AuthMode = 'login' | 'register';

interface AuthViewProps {
    onContinue?: () => void;
}

const AuthView = ({ onContinue }: AuthViewProps) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        organization: '',
        password: '',
        confirmPassword: '',
        rememberMe: false,
        agreeTerms: false
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null); // Clear error on change
    };

    const handleAuthSuccess = (token: string, userInfo: any) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userInfo));
        if (onContinue) {
            onContinue();
        }
    };

    const handleSubmit = async () => {
        setError(null);
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const req: LoginReq = {
                    email: formData.email,
                    password: formData.password,
                    remember_me: formData.rememberMe
                };
                const resp = await authService.login(req);
                handleAuthSuccess(resp.token, resp.user_info);
            } else {
                // Register validation
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                if (!formData.agreeTerms) {
                    throw new Error("Please agree to the terms");
                }

                const req: RegisterReq = {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    organization: formData.organization,
                    password: formData.password,
                    confirm_password: formData.confirmPassword,
                    agree_terms: formData.agreeTerms
                };
                const resp = await authService.register(req);
                // Register returns token too, so we can auto-login
                handleAuthSuccess(resp.token, {
                    id: resp.id,
                    first_name: resp.first_name,
                    last_name: resp.last_name,
                    email: resp.email
                });
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass =
        'w-full rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-[var(--auth-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)] disabled:opacity-50';

    const themeStyle = {
        '--auth-ink': '#1f2a2e',
        '--auth-cream': '#f7f2e9',
        '--auth-accent': '#e08a52',
        '--auth-accent-2': '#2b8f83',
        '--auth-card': 'rgba(255, 255, 255, 0.82)',
        background:
            'radial-gradient(1200px circle at 8% -10%, rgba(224, 138, 82, 0.24) 0%, transparent 55%),' +
            'radial-gradient(900px circle at 88% 8%, rgba(43, 143, 131, 0.2) 0%, transparent 45%),' +
            'linear-gradient(120deg, #f7f2e9 0%, #f1f6f4 45%, #f6efe6 100%)',
        fontFamily: '"Archivo", "Space Grotesk", "Trebuchet MS", sans-serif',
    } as CSSProperties;

    return (
        <div className="relative min-h-screen overflow-hidden text-[var(--auth-ink)]" style={themeStyle}>
            <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#e7b48f]/50 blur-3xl" />
            <div className="absolute -bottom-28 right-10 h-72 w-72 rounded-full bg-[#a6d7cf]/60 blur-3xl" />
            <div className="absolute left-1/2 top-24 h-36 w-36 -translate-x-1/2 rounded-[48%] bg-white/40 blur-2xl" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
                <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="flex flex-col justify-center gap-8 animate-fade-in">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                            <Sparkles size={14} className="text-[var(--auth-accent)]" />
                            DataSemanticHub
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                                以语义为核心的数据语义治理平台。
                            </h1>
                            <p className="max-w-xl text-base text-slate-600">
                                让任何找数、问数、用数，都有唯一、可信、可追溯的语义基础。
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                '字段级语义裁决：口径统一',
                                '语义版本化管理：可追溯',
                                '质量与安全协同治理：可审计',
                                '支撑数据服务与业务应用：可靠使用',
                            ].map((item, index) => (
                                <div
                                    key={item}
                                    className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/50 p-4 shadow-sm backdrop-blur animate-fade-in-up"
                                    style={{ animationDelay: `${index * 70 + 120}ms`, animationFillMode: 'both' }}
                                >
                                    <CheckCircle2 size={18} className="mt-0.5 text-[var(--auth-accent-2)]" />
                                    <p className="text-sm text-slate-600">{item}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1">
                                <ShieldCheck size={14} className="text-[var(--auth-accent-2)]" />
                                面向合规的审计流程
                            </div>
                            <div className="rounded-full border border-white/60 bg-white/60 px-3 py-1">
                                120+ 团队已接入
                            </div>
                        </div>
                    </section>

                    <section
                        className="animate-fade-in-up lg:justify-self-end"
                        style={{ animationDelay: '120ms', animationFillMode: 'both' }}
                    >
                        <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-[var(--auth-card)] p-8 shadow-2xl backdrop-blur">
                            <div className="flex items-center justify-between rounded-full bg-white/70 p-1 text-sm">
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setError(null); }}
                                    className={`flex-1 rounded-full px-4 py-2 font-semibold transition ${mode === 'login'
                                            ? 'bg-[var(--auth-ink)] text-white shadow'
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    登录
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMode('register'); setError(null); }}
                                    className={`flex-1 rounded-full px-4 py-2 font-semibold transition ${mode === 'register'
                                            ? 'bg-[var(--auth-ink)] text-white shadow'
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    注册
                                </button>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        {mode === 'login' ? '欢迎回来。' : '开始创建你的工作台。'}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {mode === 'login'
                                            ? '登录以继续构建你的语义层。'
                                            : '注册账号，让协作与发布更高效。'}
                                    </p>
                                </div>

                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                                    {mode === 'register' && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <input
                                                className={inputClass}
                                                placeholder="名"
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                disabled={isLoading}
                                            />
                                            <input
                                                className={inputClass}
                                                placeholder="姓"
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    )}

                                    <input
                                        className={inputClass}
                                        type="email"
                                        placeholder="工作邮箱"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        disabled={isLoading}
                                        required
                                    />
                                    {mode === 'register' && (
                                        <input
                                            className={inputClass}
                                            placeholder="团队或公司"
                                            value={formData.organization}
                                            onChange={(e) => handleInputChange('organization', e.target.value)}
                                            disabled={isLoading}
                                        />
                                    )}
                                    <input
                                        className={inputClass}
                                        type="password"
                                        placeholder="密码"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        disabled={isLoading}
                                        required
                                    />
                                    {mode === 'register' && (
                                        <input
                                            className={inputClass}
                                            type="password"
                                            placeholder="确认密码"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                    )}

                                    {mode === 'login' ? (
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300"
                                                    checked={formData.rememberMe}
                                                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                                                    disabled={isLoading}
                                                />
                                                记住我
                                            </label>
                                            <button type="button" className="font-semibold text-[var(--auth-accent-2)]">
                                                忘记密码？
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex items-start gap-2 text-xs text-slate-500 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300"
                                                checked={formData.agreeTerms}
                                                onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                                                disabled={isLoading}
                                            />
                                            我同意服务条款与隐私政策。
                                        </label>
                                    )}

                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded-lg animate-fade-in">
                                            <AlertCircle size={16} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--auth-accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/60 transition hover:brightness-105 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                处理中...
                                            </>
                                        ) : (
                                            <>
                                                {mode === 'login' ? '登录' : '注册账号'}
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                                    >
                                        使用单点登录
                                    </button>
                                </form>

                                <p className="text-center text-xs text-slate-500">
                                    {mode === 'login' ? '需要开通权限？' : '已经有账号？'}{' '}
                                    <button
                                        type="button"
                                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                                        className="font-semibold text-[var(--auth-accent-2)]"
                                    >
                                        {mode === 'login' ? '申请开通' : '去登录'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AuthView;
