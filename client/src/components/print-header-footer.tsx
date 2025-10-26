import logoUrl from "@assets/ESKA LOGO TASARIMI_1761497797352.png";

export function PrintHeaderFooter() {
  return (
    <>
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block fixed top-0 left-0 right-0 h-24 bg-white border-b-2 border-primary z-50 px-8">
        <div className="h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={logoUrl} 
              alt="ESKA Logo" 
              className="h-16 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-primary">ESKA YAPI MÜHENDİSLİK</h1>
              <p className="text-xs text-muted-foreground">İnşaat Proje Yönetim Sistemi</p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{new Date().toLocaleDateString('tr-TR', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}</p>
          </div>
        </div>
      </div>

      {/* Print Footer - Only visible when printing */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-300 z-50 px-8">
        <div className="h-full flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center">
            ESKA YAPI MÜHENDİSLİK İNŞAAT EMLAK TURİZM VE TİCARET LTD. ŞTİ.
            <span className="mx-2">|</span>
            İnşaat Proje Yönetim Sistemi
          </p>
        </div>
      </div>
    </>
  );
}
