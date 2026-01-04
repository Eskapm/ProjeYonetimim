import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Lock, User, Mail, Eye, EyeOff, MapPin, Globe, Building } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import logoUrl from "@assets/ESKA LOGO TASARIMI_1761497797352.png";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  // Register state
  const [showRegister, setShowRegister] = useState(false);
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [registerCompanyName, setRegisterCompanyName] = useState("");
  const [registerCountry, setRegisterCountry] = useState("");
  const [registerCity, setRegisterCity] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterPasswordConfirm, setShowRegisterPasswordConfirm] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // Load remembered username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setLoginUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Clear login error when inputs change
  useEffect(() => {
    setLoginError("");
  }, [loginUsername, loginPassword]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    // Save or remove username based on remember me
    if (rememberMe) {
      localStorage.setItem("rememberedUsername", loginUsername);
    } else {
      localStorage.removeItem("rememberedUsername");
    }
    
    loginMutation.mutate(
      { username: loginUsername, password: loginPassword },
      {
        onError: () => {
          setLoginError("Kullanıcı adı veya şifre hatalı");
        }
      }
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");

    if (registerPassword !== registerPasswordConfirm) {
      setRegisterError("Şifreler eşleşmiyor");
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError("Şifre en az 6 karakter olmalıdır");
      return;
    }

    registerMutation.mutate(
      {
        username: registerEmail,
        password: registerPassword,
        fullName: registerFullName,
        email: registerEmail,
        companyName: registerCompanyName || undefined,
        country: registerCountry,
        city: registerCity,
      },
      {
        onSuccess: () => {
          setShowRegister(false);
          setLoginUsername(registerEmail);
          setRegisterFullName("");
          setRegisterEmail("");
          setRegisterPassword("");
          setRegisterPasswordConfirm("");
          setRegisterCompanyName("");
          setRegisterCountry("");
          setRegisterCity("");
        },
        onError: (error: Error) => {
          setRegisterError(error.message || "Kayıt oluşturulamadı");
        }
      }
    );
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sol taraf - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center mb-8">
            <img src={logoUrl} alt="ESKA Logo" className="h-[13.5rem] w-auto object-contain" />
            <p className="text-lg font-medium text-foreground mt-4">İnşaat Proje Yönetim Sistemi</p>
          </div>

          {!showRegister ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Giriş Yap</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md" data-testid="text-login-error">
                      {loginError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Kullanıcı Adı</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="Kullanıcı adınızı girin"
                        className="pl-10"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        required
                        data-testid="input-login-username"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Şifrenizi girin"
                        className="pl-10 pr-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        data-testid="input-login-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="button-toggle-password-visibility"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      data-testid="checkbox-remember-me"
                    />
                    <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                      Beni hatırla
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login-submit"
                  >
                    {loginMutation.isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </Button>
                </form>
                
                <div className="mt-4 text-center space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="text-sm text-muted-foreground hover:text-primary h-auto p-0 font-normal underline-offset-4 hover:underline"
                        data-testid="button-forgot-password"
                      >
                        Şifremi Unuttum
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          Şifre Sıfırlama
                        </DialogTitle>
                        <DialogDescription className="pt-4 space-y-4">
                          <p>
                            Şifrenizi sıfırlamak için sistem yöneticisi ile iletişime geçin.
                          </p>
                          <div className="bg-muted p-4 rounded-lg space-y-2">
                            <p className="font-medium text-foreground">İletişim Bilgileri:</p>
                            <p className="text-sm">E-posta: info@eskayapi.com</p>
                            <p className="text-sm">Telefon: +90 XXX XXX XX XX</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            E-posta ile otomatik şifre sıfırlama özelliği yakında eklenecektir.
                          </p>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                  
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowRegister(true)}
                      data-testid="button-show-register"
                    >
                      Kayıt Ol
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Kayıt Ol</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  {registerError && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md" data-testid="text-register-error">
                      {registerError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="register-fullname">Ad Soyad <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-fullname"
                        type="text"
                        placeholder="Adınızı ve soyadınızı girin"
                        className="pl-10"
                        value={registerFullName}
                        onChange={(e) => setRegisterFullName(e.target.value)}
                        required
                        data-testid="input-register-fullname"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-Posta <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="E-posta adresinizi girin"
                        className="pl-10"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        data-testid="input-register-email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Şifre <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Şifrenizi girin"
                        className="pl-10 pr-10"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        data-testid="input-register-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="button-toggle-register-password"
                      >
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password-confirm">Şifre (Tekrar) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password-confirm"
                        type={showRegisterPasswordConfirm ? "text" : "password"}
                        placeholder="Şifrenizi tekrar girin"
                        className="pl-10 pr-10"
                        value={registerPasswordConfirm}
                        onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                        required
                        data-testid="input-register-password-confirm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPasswordConfirm(!showRegisterPasswordConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="button-toggle-register-password-confirm"
                      >
                        {showRegisterPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-company">Firma Adı</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-company"
                        type="text"
                        placeholder="Firma adını girin (opsiyonel)"
                        className="pl-10"
                        value={registerCompanyName}
                        onChange={(e) => setRegisterCompanyName(e.target.value)}
                        data-testid="input-register-company"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-country">Ülke <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-country"
                        type="text"
                        placeholder="Ülkenizi girin"
                        className="pl-10"
                        value={registerCountry}
                        onChange={(e) => setRegisterCountry(e.target.value)}
                        required
                        data-testid="input-register-country"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-city">Şehir <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-city"
                        type="text"
                        placeholder="Şehrinizi girin"
                        className="pl-10"
                        value={registerCity}
                        onChange={(e) => setRegisterCity(e.target.value)}
                        required
                        data-testid="input-register-city"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-register-submit"
                  >
                    {registerMutation.isPending ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
                  </Button>
                </form>
                
                <div className="mt-4 text-center">
                  <Button 
                    variant="ghost" 
                    className="text-sm text-muted-foreground hover:text-primary"
                    onClick={() => setShowRegister(false)}
                    data-testid="button-back-to-login"
                  >
                    Zaten hesabınız var mı? Giriş Yap
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sağ taraf - Hero */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-lg space-y-6 text-center">
          <div className="flex justify-center">
            <Building2 className="h-24 w-24 text-primary" />
          </div>
          <h2 className="text-4xl font-bold">İnşaat Projeleri Yönetimi</h2>
          <div className="space-y-4 text-muted-foreground">
            <p className="text-lg">
              Eska Yapı Mühendislik İnşaat için özel olarak tasarlanmış kapsamlı proje yönetim
              sistemi.
            </p>
            <ul className="space-y-2 text-left">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Proje takibi ve maliyet analizi
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Fatura ve gelir-gider yönetimi
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Şantiye defteri ve puantaj kayıtları
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Türk vergi sistemi entegrasyonu
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Mobil ve masaüstü erişim
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
