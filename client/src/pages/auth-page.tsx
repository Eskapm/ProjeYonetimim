import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Lock, User } from "lucide-react";
import logoUrl from "@assets/ESKA LOGO TASARIMI_1761497797352.png";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    if (registerPassword !== confirmPassword) {
      return;
    }
    registerMutation.mutate({
      username: registerUsername,
      password: registerPassword,
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
            <img src={logoUrl} alt="ESKA Logo" className="h-[18rem] w-auto object-contain" />
            <p className="text-lg font-medium text-foreground mt-4">İnşaat Proje Yönetim Sistemi</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Kayıt Ol</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
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
                          type="password"
                          placeholder="Şifrenizi girin"
                          className="pl-10"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          data-testid="input-login-password"
                        />
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Kayıt Ol</CardTitle>
                  <CardDescription>
                    Yeni bir hesap oluşturmak için bilgilerinizi girin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Kullanıcı Adı</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="Kullanıcı adı seçin"
                          className="pl-10"
                          value={registerUsername}
                          onChange={(e) => setRegisterUsername(e.target.value)}
                          required
                          data-testid="input-register-username"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Şifre</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Güçlü bir şifre seçin"
                          className="pl-10"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          data-testid="input-register-password"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Şifre Tekrar</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Şifrenizi tekrar girin"
                          className="pl-10"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          data-testid="input-confirm-password"
                        />
                      </div>
                      {confirmPassword && registerPassword !== confirmPassword && (
                        <p className="text-sm text-destructive">Şifreler eşleşmiyor</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        registerMutation.isPending ||
                        registerPassword !== confirmPassword ||
                        !registerPassword
                      }
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "Kayıt yapılıyor..." : "Kayıt Ol"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
