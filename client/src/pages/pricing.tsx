import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, Zap, Building2 } from "lucide-react";

interface PlanFeature {
  name: string;
  starter: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const features: PlanFeature[] = [
  { name: "Proje Sayısı", starter: "3 proje", pro: "Sınırsız", enterprise: "Sınırsız" },
  { name: "Kullanıcı Sayısı", starter: "1 kullanıcı", pro: "5 kullanıcı", enterprise: "Sınırsız" },
  { name: "Gelir/Gider Takibi", starter: true, pro: true, enterprise: true },
  { name: "Şantiye Defteri", starter: true, pro: true, enterprise: true },
  { name: "Puantaj Yönetimi", starter: true, pro: true, enterprise: true },
  { name: "Fatura Yönetimi", starter: true, pro: true, enterprise: true },
  { name: "Hakediş Modülü", starter: false, pro: true, enterprise: true },
  { name: "Sözleşme Yönetimi", starter: false, pro: true, enterprise: true },
  { name: "Ödeme Planları", starter: false, pro: true, enterprise: true },
  { name: "Döküman Yönetimi", starter: false, pro: true, enterprise: true },
  { name: "Nakit Akış Tahmini", starter: false, pro: true, enterprise: true },
  { name: "Excel Export", starter: "Temel", pro: "Gelişmiş", enterprise: "Gelişmiş" },
  { name: "Raporlar", starter: "Temel", pro: "Gelişmiş", enterprise: "Gelişmiş + Özel" },
  { name: "Bütçe & Keşif", starter: false, pro: true, enterprise: true },
  { name: "Taşeron/Tedarikçi Yönetimi", starter: "10 kayıt", pro: "Sınırsız", enterprise: "Sınırsız" },
  { name: "Müşteri Yönetimi", starter: "10 kayıt", pro: "Sınırsız", enterprise: "Sınırsız" },
  { name: "API Erişimi", starter: false, pro: false, enterprise: true },
  { name: "Özel Entegrasyonlar", starter: false, pro: false, enterprise: true },
  { name: "Öncelikli Destek", starter: false, pro: true, enterprise: true },
  { name: "Özel Eğitim", starter: false, pro: false, enterprise: true },
  { name: "SLA Garantisi", starter: false, pro: false, enterprise: "99.9%" },
];

export default function Pricing() {
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-green-600" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground" />
      );
    }
    return <span className="text-sm font-medium">{value}</span>;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Abonelik Planları</h1>
        <p className="text-muted-foreground mt-2">
          İşletmenize en uygun planı seçin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-blue-600" />
              <CardTitle>Starter</CardTitle>
            </div>
            <CardDescription>
              Küçük inşaat firmaları için ideal başlangıç paketi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">₺499</span>
              <span className="text-muted-foreground">/ay</span>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">3 proje limiti</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Temel finansal takip</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Şantiye defteri</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">E-posta desteği</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" data-testid="button-select-starter">
              Planı Seç
            </Button>
          </CardFooter>
        </Card>

        <Card className="relative border-primary">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
            En Popüler
          </Badge>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <CardTitle>Pro</CardTitle>
            </div>
            <CardDescription>
              Büyüyen inşaat firmaları için kapsamlı çözüm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">₺1.499</span>
              <span className="text-muted-foreground">/ay</span>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Sınırsız proje</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">5 kullanıcı</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Hakediş ve sözleşme yönetimi</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Nakit akış tahmini</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Öncelikli destek</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" data-testid="button-select-pro">
              Planı Seç
            </Button>
          </CardFooter>
        </Card>

        <Card className="relative">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-orange-600" />
              <CardTitle>Enterprise</CardTitle>
            </div>
            <CardDescription>
              Büyük ölçekli kurumsal projeler için özel çözüm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">Özel</span>
              <span className="text-muted-foreground"> fiyat</span>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Sınırsız her şey</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">API erişimi</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Özel entegrasyonlar</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Özel eğitim ve danışmanlık</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">%99.9 SLA garantisi</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" data-testid="button-contact-enterprise">
              İletişime Geç
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Özellik Karşılaştırması</CardTitle>
          <CardDescription>
            Tüm planların detaylı özellik karşılaştırması
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Özellik</th>
                  <th className="text-center py-3 px-4 font-medium">Starter</th>
                  <th className="text-center py-3 px-4 font-medium">Pro</th>
                  <th className="text-center py-3 px-4 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 px-4 text-sm">{feature.name}</td>
                    <td className="py-3 px-4 text-center">
                      {renderFeatureValue(feature.starter)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderFeatureValue(feature.pro)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderFeatureValue(feature.enterprise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Sorularınız mı var?</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              İşletmeniz için en uygun planı seçmenize yardımcı olmak için bizimle iletişime geçin.
              Tüm planlarımız 14 günlük ücretsiz deneme süresi içermektedir.
            </p>
            <Button variant="outline" data-testid="button-contact-sales">
              Satış Ekibine Ulaşın
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
