import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PDFDownloadButtonProps {
  filename?: string;
}

export function PDFDownloadButton({ filename = "rapor.pdf" }: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Get the entire document HTML
      const htmlContent = document.documentElement.outerHTML;
      
      // Send to server for PDF generation
      const response = await fetch('/api/reports/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlContent,
          filename: filename
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('PDF oluşturulamadı');
      }
      
      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Başarılı",
        description: "PDF başarıyla indirildi",
      });
      
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "Hata",
        description: "PDF indirilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      variant="outline"
      data-testid="button-download-pdf"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      {isGenerating ? "PDF Oluşturuluyor..." : "PDF İndir"}
    </Button>
  );
}
