import eskaLogo from "@assets/ESKA LOGO TASARIMI_1761521113587.png";
import { format } from "date-fns";

interface PrintHeaderProps {
  documentTitle: string;
  documentNumber?: string;
  additionalInfo?: React.ReactNode;
}

export function PrintHeader({ documentTitle, documentNumber, additionalInfo }: PrintHeaderProps) {
  return (
    <div className="hidden print:block print-header-wrapper print-first-page-only">
      {/* Logo - Centered and Large */}
      <div className="text-center mb-4">
        <img 
          src={eskaLogo} 
          alt="Eska Yapı Logo" 
          className="print-logo"
          style={{ height: '80px', width: 'auto', margin: '0 auto', display: 'block' }}
        />
      </div>

      {/* Firma ve İletişim Bilgileri - Two Column Layout */}
      <div className="grid grid-cols-2 gap-6 mb-6 pb-4 border-b-2 border-black text-xs">
        {/* Sol Kolon - Firma Bilgileri */}
        <div>
          <h3 className="font-bold mb-2 text-sm">Firma Bilgileri</h3>
          <p className="leading-tight mb-1">
            <strong>Mersis No:</strong> 0380 1336 6500 0001
          </p>
          <p className="leading-tight mb-1">
            <strong>Vergi Dairesi:</strong> Fethiye V.D. - 3801336650
          </p>
          <p className="leading-tight mb-1">
            <strong>Adres:</strong> Foça Mahallesi 967 (FCA) Sok.<br />
            Nilüfer Sit. No:30-5 İç Kapı No:2<br />
            Fethiye / MUĞLA
          </p>
          <p className="leading-tight font-semibold mt-2">
            Eska Yapı Mühendislik İnşaat Emlak<br />
            Turizm ve Ticaret Limited Şirketi
          </p>
        </div>

        {/* Sağ Kolon - İletişim Bilgileri ve Belge Bilgisi - Sağa Yaslanmış */}
        <div className="text-right">
          <h3 className="font-bold mb-2 text-sm">İletişim Bilgileri</h3>
          <p className="leading-tight mb-1">
            <strong>E-mail:</strong> enginkayserili@gmail.com
          </p>
          <p className="leading-tight mb-1">
            <strong>Tel:</strong> 0 505 821 54 79
          </p>
          
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="font-semibold mb-1">Belge Bilgisi</p>
            <p className="leading-tight">
              <strong>Tarih:</strong> {format(new Date(), "dd/MM/yyyy")}
            </p>
            {documentNumber && (
              <p className="leading-tight">
                <strong>{documentTitle} No:</strong> {documentNumber}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <h2 className="text-center text-base font-bold mb-4 uppercase">
        {documentTitle}
      </h2>
      
      {additionalInfo && (
        <div className="mb-4 text-xs w-full">
          {additionalInfo}
        </div>
      )}
    </div>
  );
}
