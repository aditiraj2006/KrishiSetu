import { NavigationHeader } from "@/components/NavigationHeader";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { QrCode, ScanLine } from "lucide-react";

export default function QRScannerPage() {
  return (
    <div className="min-h-screen bg-background font-sans relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute top-[60%] -left-[10%] w-[30%] h-[40%] rounded-full bg-primary/5 blur-[80px]" />
      </div>

      <NavigationHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 text-primary">
            <ScanLine className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight flex items-center justify-center gap-2">
            Scan Product QR
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Position the KrishiSetu QR code within the frame to view verified product origin and complete blockchain traceability.
          </p>
        </div>

        <div className="bg-card/60 backdrop-blur-md rounded-3xl border border-border/50 shadow-xl overflow-hidden relative">
          <div className="p-6 md:p-8">
            <QRCodeScanner />
          </div>
        </div>
      </main>
    </div>
  );
}
