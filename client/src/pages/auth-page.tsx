import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building2, Lock, User, Mail, Eye, EyeOff, MapPin, Building, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/ESKA LOGO TASARIMI_1761497797352.png";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register state
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerCompanyName, setRegisterCompanyName] = useState("");
  const [registerCountry, setRegisterCountry] = useState("");
  const [registerCity, setRegisterCity] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: {
      fullName: string;
      email: string;
      password: string;
      confirmPassword: string;
      companyName?: string;
      country: string;
      city: string;
    }) => {
      return await apiRequest("POST", "/api/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.",
      });
      setIsRegistering(false);
      resetRegisterForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Kayıt sırasında bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const resetRegisterForm = () => {
    setRegisterFullName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterConfirmPassword("");
    setRegisterCompanyName("");
    setRegisterCountry("");
    setRegisterCity("");
  };

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: loginUsername,
      password: loginPassword,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Hata",
        description: "Şifreler eşleşmiyor",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      fullName: registerFullName,
      email: registerEmail,
      password: registerPassword,
      confirmPassword: registerConfirmPassword,
      companyName: registerCompanyName || undefined,
      country: registerCountry,
      city: registerCity,
    });
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

          {!isRegistering ? (
            <Card>
              <CardHeader>
                <CardTitle>Giriş Yap</CardTitle>
                <CardDescription>
                  Hesabınıza giriş yapmak için kullanıcı bilgilerinizi girin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        data-testid="button-toggle-login-password"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
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
                
                <div className="mt-4 flex flex-col items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsRegistering(true)}
                    data-testid="button-show-register"
                  >
                    Kayıt Ol
                  </Button>
                  
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
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Kayıt Ol</CardTitle>
                <CardDescription>
                  Yeni hesap oluşturmak için bilgilerinizi girin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-fullname">
                      Ad Soyad <span className="text-destructive">*</span>
                    </Label>
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
                    <Label htmlFor="register-email">
                      E-Posta <span className="text-destructive">*</span>
                    </Label>
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
                    <Label htmlFor="register-password">
                      Şifre <span className="text-destructive">*</span>
                    </Label>
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
                        minLength={6}
                        data-testid="input-register-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        data-testid="button-toggle-register-password"
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">
                      Şifre (Tekrar) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-confirm-password"
                        type={showRegisterConfirmPassword ? "text" : "password"}
                        placeholder="Şifrenizi tekrar girin"
                        className="pl-10 pr-10"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        data-testid="input-register-confirm-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                        data-testid="button-toggle-register-confirm-password"
                      >
                        {showRegisterConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-company">Firma Adı</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-company"
                        type="text"
                        placeholder="Firma adınızı girin (opsiyonel)"
                        className="pl-10"
                        value={registerCompanyName}
                        onChange={(e) => setRegisterCompanyName(e.target.value)}
                        data-testid="input-register-company"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-country">
                        Ülke <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-country"
                          type="text"
                          placeholder="Ülke"
                          className="pl-10"
                          value={registerCountry}
                          onChange={(e) => setRegisterCountry(e.target.value)}
                          required
                          data-testid="input-register-country"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-city">
                        Şehir <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-city"
                          type="text"
                          placeholder="Şehir"
                          className="pl-10"
                          value={registerCity}
                          onChange={(e) => setRegisterCity(e.target.value)}
                          required
                          data-testid="input-register-city"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-register-submit"
                  >
                    {registerMutation.isPending ? "Kayıt yapılıyor..." : "Kayıt Ol"}
                  </Button>
                </form>
                
                <div className="mt-4 text-center">
                  <Button 
                    variant="ghost" 
                    className="text-sm text-muted-foreground hover:text-primary h-auto p-0 font-normal underline-offset-4 hover:underline"
                    onClick={() => {
                      setIsRegistering(false);
                      resetRegisterForm();
                    }}
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
