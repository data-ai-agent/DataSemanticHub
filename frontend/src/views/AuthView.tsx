import { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Loader2, AlertCircle, X, Mail, Lock, Building } from 'lucide-react';
import { authService, LoginReq, RegisterReq, type ErrorResponse } from '../services/auth';
import { setAuthInfo } from '../utils/authUtils';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'sso';

interface AuthViewProps {
    onContinue?: () => void;
}

const AuthView = ({ onContinue }: AuthViewProps) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<(ErrorResponse & { title?: string }) | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [success, setSuccess] = useState(false);

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

    // 验证状态
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showValidation, setShowValidation] = useState(false);
    const [emailError, setEmailError] = useState<string>('');

    // 邮箱格式验证
    const validateEmail = (email: string): boolean => {
        if (!email) return false;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null); // Clear error on change

        // 实时验证邮箱格式
        if (field === 'email') {
            if (!value) {
                setEmailError('');
            } else if (!validateEmail(value)) {
                setEmailError('请输入有效的邮箱地址，例如：user@company.com');
            } else {
                setEmailError('');
            }
        }
    };

    const handleInputBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleModeChange = (newMode: AuthMode) => {
        if (newMode === mode || isTransitioning) return;
        setIsTransitioning(true);
        setError(null);
        setSuccess(false);
        setTouched({});
        setShowValidation(false);
        setEmailError('');
        setTimeout(() => {
            setMode(newMode);
            setIsTransitioning(false);
        }, 150);
    };

    const handleError = (err: unknown) => {
        if (err && typeof err === 'object') {
            setError(err as (ErrorResponse & { title?: string }));
        } else if (err instanceof Error) {
            setError({
                title: mode === 'login' ? '登录失败' : '注册失败',
                message: err.message,
            });
        } else {
            setError({
                title: mode === 'login' ? '登录失败' : '注册失败',
                message: '未知错误，请稍后重试',
            });
        }
    };

    const validateForm = (): boolean => {
        const newTouched: Record<string, boolean> = {};
        let isValid = true;

        // 必填字段验证
        if (!formData.email.trim()) {
            newTouched.email = true;
            isValid = false;
        } else if (!validateEmail(formData.email)) {
            setEmailError('请输入有效的邮箱地址，例如：user@company.com');
            isValid = false;
        }

        if (!formData.password && mode !== 'forgot-password') {
            newTouched.password = true;
            isValid = false;
        }

        if (mode === 'register') {
            if (!formData.firstName.trim()) {
                newTouched.firstName = true;
                isValid = false;
            }
            if (!formData.lastName.trim()) {
                newTouched.lastName = true;
                isValid = false;
            }
            if (!formData.confirmPassword) {
                newTouched.confirmPassword = true;
                isValid = false;
            }
        }

        setTouched(newTouched);

        if (!isValid && !emailError) {
            setError({
                title: mode === 'login' ? '登录失败' : '注册失败',
                message: '请填写所有必填项',
            });
        }

        return isValid;
    };

    const handleAuthSuccess = (token: string, userInfo: any) => {
        setAuthInfo(token, userInfo);
        if (onContinue) {
            onContinue();
        }
    };

    const handleSubmit = async () => {
        setShowValidation(true);
        if (!validateForm()) {
            return;
        }

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
                    setError({
                        title: '注册失败',
                        message: '两次输入的密码不一致',
                        solution: '请确保两次输入的密码完全相同',
                    });
                    setIsLoading(false);
                    return;
                }
                if (!formData.agreeTerms) {
                    setError({
                        title: '注册失败',
                        message: '请同意服务条款',
                        solution: '您需要同意服务条款和隐私政策才能继续',
                    });
                    setIsLoading(false);
                    return;
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
                handleAuthSuccess(resp.token, {
                    id: resp.id,
                    first_name: resp.first_name,
                    last_name: resp.last_name,
                    email: resp.email
                });
            }
        } catch (err) {
            handleError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setShowValidation(true);

        if (!formData.email.trim()) {
            setError({
                message: '请输入您的邮箱地址',
            });
            return;
        }

        if (!validateEmail(formData.email)) {
            setEmailError('请输入有效的邮箱地址，例如：user@company.com');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            // TODO: 调用忘记密码API
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSuccess(true);
            setError({
                message: `密码重置链接已发送至 ${formData.email}，请查收邮件。`,
            });
        } catch (err) {
            handleError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSSO = async () => {
        setError(null);
        setIsLoading(true);

        try {
            // TODO: 调用SSO登录API
            await new Promise(resolve => setTimeout(resolve, 1000));
            window.location.href = `/sso/login?domain=${formData.organization}`;
        } catch (err) {
            handleError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getInputState = (field: string) => {
        const value = formData[field as keyof typeof formData];
        const isEmpty = !value || (typeof value === 'string' && !value.trim());
        const isRequired = ['email', 'password', 'firstName', 'lastName', 'confirmPassword'].includes(field);

        return {
            showRequired: showValidation && isRequired && isEmpty
        };
    };

    const getTitleAndSubtitle = () => {
        switch (mode) {
            case 'login':
                return { title: '欢迎回来', subtitle: '登录访问您的工作台' };
            case 'register':
                return { title: '创建账户', subtitle: '开启数据治理之旅' };
            case 'forgot-password':
                return { title: '重置密码', subtitle: '输入您的邮箱以接收重置链接' };
            case 'sso':
                return { title: '企业SSO登录', subtitle: '使用您企业的单点登录系统' };
            default:
                return { title: '', subtitle: '' };
        }
    };

    const getSubmitButtonText = () => {
        if (mode === 'forgot-password') return '发送重置链接';
        if (mode === 'sso') return '继续使用SSO登录';
        if (mode === 'register') return '创建账户';
        return '登录';
    };

    const { title, subtitle } = getTitleAndSubtitle();

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 animate-gradient" style={{ '--auth-ink': '#0f172a', '--auth-accent': '#3b82f6', '--auth-accent-2': '#0ea5e9' } as React.CSSProperties}>
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(15, 23, 42) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            {/* Accent gradient overlay */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/5 to-transparent rounded-full blur-3xl" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-12 lg:px-8">
                <div className="grid w-full gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                    {/* Left Section - Branding & Value Props */}
                    <section className="flex flex-col gap-10 animate-slide-in-left">
                        {/* Logo/Brand */}
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 text-blue-600">
                                <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
                                    <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.1" />
                                    <path d="M12 20L18 26L28 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-2xl font-bold text-slate-900">DataSemanticHub</span>
                            </div>
                        </div>

                        {/* Main Heading */}
                        <div className="space-y-6">
                            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-slate-900 tracking-tight">
                                企业级数据语义
                                <br />
                                <span className="text-blue-600">治理平台</span>
                            </h1>
                            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                                构建统一的数据语义标准，让数据资产更可信、可追溯、可治理
                            </p>
                        </div>

                        {/* Feature List */}
                        <div className="space-y-4">
                            {[
                                { icon: '🎯', title: '统一语义标准', desc: '字段级语义裁决，消除口径歧义' },
                                { icon: '📊', title: '版本化管理', desc: '全链路可追溯的语义演进历史' },
                                { icon: '🔒', title: '合规与安全', desc: '自动审计，满足企业治理要求' },
                                { icon: '⚡', title: '智能服务', desc: '支撑高质量的数据服务与应用' },
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-4 p-4 rounded-xl bg-white/60 border border-slate-200/60 shadow-sm hover:shadow-md hover:bg-white transition-all duration-300 animate-fade-in-up"
                                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                                >
                                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                                        <p className="text-sm text-slate-600">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-6 items-center pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                                <span>ISO 27001 认证</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span>120+ 企业信赖</span>
                            </div>
                        </div>
                    </section>

                    {/* Right Section - Auth Form */}
                    <section className="flex items-center justify-center lg:justify-end animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                        <div className="w-full max-w-md">
                            {/* Form Card */}
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 lg:p-10">
                                {/* Mode Switcher - Only show for login/register */}
                                {(mode === 'login' || mode === 'register') && (
                                    <div className="mb-8">
                                        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => handleModeChange('login')}
                                                disabled={isTransitioning}
                                                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${mode === 'login'
                                                        ? 'bg-white text-slate-900 shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                登录
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleModeChange('register')}
                                                disabled={isTransitioning}
                                                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${mode === 'register'
                                                        ? 'bg-white text-slate-900 shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                注册
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Form Content */}
                                <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                                    <div className="space-y-6">
                                        {/* Title */}
                                        <div className="text-center space-y-2">
                                            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                                            <p className="text-sm text-slate-600">{subtitle}</p>
                                        </div>

                                        {/* Form */}
                                        <form className="space-y-5" noValidate onSubmit={(e) => {
                                            e.preventDefault();
                                            if (mode === 'forgot-password') {
                                                handleForgotPassword();
                                            } else if (mode === 'sso') {
                                                handleSSO();
                                            } else {
                                                handleSubmit();
                                            }
                                        }}>
                                            {mode === 'login' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-slate-700">邮箱地址</label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="name@company.com"
                                                                value={formData.email}
                                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                                disabled={isLoading}
                                                                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${emailError ? 'border-red-300' : 'border-slate-300'
                                                                    }`}
                                                            />
                                                        </div>
                                                        {emailError && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{emailError}</p>}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-slate-700">密码</label>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input
                                                                type="password"
                                                                placeholder="输入您的密码"
                                                                value={formData.password}
                                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                                disabled={isLoading}
                                                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm">
                                                        <label className="flex items-center gap-2">
                                                            <input type="checkbox" checked={formData.rememberMe} onChange={(e) => handleInputChange('rememberMe', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                                                            <span className="text-slate-600">记住我</span>
                                                        </label>
                                                        <button type="button" onClick={() => handleModeChange('forgot-password')} className="text-blue-600 hover:text-blue-700 font-medium">忘记密码？</button>
                                                    </div>
                                                </>
                                            )}

                                            {mode === 'register' && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-slate-700">姓氏</label>
                                                            <input type="text" placeholder="张" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} disabled={isLoading} className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-slate-700">名字</label>
                                                            <input type="text" placeholder="三" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} disabled={isLoading} className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-slate-700">工作邮箱</label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input type="text" placeholder="name@company.com" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} disabled={isLoading} className={`w-full pl-10 pr-4 py-3 rounded-lg border ${emailError ? 'border-red-300' : 'border-slate-300'} bg-white`} />
                                                        </div>
                                                        {emailError && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{emailError}</p>}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-slate-700">密码</label>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input type="password" placeholder="至少8个字符" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} disabled={isLoading} className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 bg-white" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-slate-700">确认密码</label>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input type="password" placeholder="再次输入密码" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} disabled={isLoading} className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 bg-white" />
                                                        </div>
                                                    </div>

                                                    <label className="flex items-start gap-3 text-sm">
                                                        <input type="checkbox" checked={formData.agreeTerms} onChange={(e) => handleInputChange('agreeTerms', e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600" />
                                                        <span className="text-slate-600">我已阅读并同意<button type="button" className="text-blue-600 hover:underline mx-1">服务条款</button>和<button type="button" className="text-blue-600 hover:underline mx-1">隐私政策</button></span>
                                                    </label>
                                                </>
                                            )}

                                            {mode === 'forgot-password' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-slate-700">邮箱地址</label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input type="text" placeholder="name@company.com" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} disabled={isLoading} className={`w-full pl-10 pr-4 py-3 rounded-lg border ${emailError ? 'border-red-300' : 'border-slate-300'} bg-white`} />
                                                        </div>
                                                        {emailError && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{emailError}</p>}
                                                    </div>

                                                    <div className="text-sm text-slate-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
                                                        <p>我们将向您的邮箱发送密码重置链接，请按照邮件中的说明操作。</p>
                                                    </div>

                                                    <button type="button" onClick={() => handleModeChange('login')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">← 返回登录</button>
                                                </>
                                            )}

                                            {mode === 'sso' && (
                                                <>
                                                    <div className="text-center py-4">
                                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Building className="w-8 h-8 text-blue-600" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-slate-700">企业域名</label>
                                                        <div className="relative">
                                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input type="text" placeholder="company.com" value={formData.organization} onChange={(e) => handleInputChange('organization', e.target.value)} disabled={isLoading} className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 bg-white" />
                                                        </div>
                                                    </div>

                                                    <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                        <p className="font-medium mb-1">支持的SSO提供商：</p>
                                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                                            <li>Azure AD / Microsoft Entra ID</li>
                                                            <li>Okta, Google Workspace</li>
                                                            <li>其他SAML 2.0兼容提供商</li>
                                                        </ul>
                                                    </div>

                                                    <button type="button" onClick={() => handleModeChange('login')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">← 返回登录</button>
                                                </>
                                            )}

                                            {error && !success && (
                                                <div className="p-3.5 bg-red-50/80 border border-red-100 rounded-xl backdrop-blur-sm">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                                                            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-red-900">{error.message}</p>
                                                        </div>
                                                        <button type="button" onClick={() => setError(null)} className="flex-shrink-0 p-0.5 text-red-400 hover:text-red-600 rounded hover:bg-red-100/50"><X className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            )}

                                            {success && error && (
                                                <div className="p-3.5 bg-green-50/80 border border-green-100 rounded-xl backdrop-blur-sm">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-green-900">{error.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={isLoading || success}
                                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-600/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>{getSubmitButtonText()}</span><ArrowRight className="w-5 h-5" /></>}
                                            </button>
                                        </form>

                                        {(mode === 'login' || mode === 'register') && (
                                            <>
                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-500">或</span></div>
                                                </div>

                                                <button type="button" onClick={() => handleModeChange('sso')} className="w-full py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                                                    <Building className="w-5 h-5" />
                                                    <span>企业 SSO 登录</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="mt-6 text-center text-sm text-slate-600">受信任的企业级数据治理解决方案</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AuthView;
