import { NavigationHeader } from '@/components/NavigationHeader';
import { QRCodeScanner } from '@/components/QRCodeScanner';

export default function QRScannerPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <NavigationHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground">QR Code Scanner</h2>
          <p className="text-muted-foreground mt-1">Scan KrishiSetu QR codes to view product information and traceability</p>
        </div>

        <QRCodeScanner />
      </main>
    </div>
  );
}
