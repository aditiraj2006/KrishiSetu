import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Copy, Check } from "lucide-react";
import type { Product } from "@shared/schema";
import { QRCodeCanvas } from "qrcode.react";

interface QRCodeGeneratorProps {
  product: Product;
}

export function QRCodeGenerator({ product }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const qrValue = product.qrCode || `/product/${product.batchId || product.id}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const canvas = document.getElementById("product-qr-canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `QR-${product.batchId || 'product'}.png`;
      link.click();
    }
  };

  // Prevent rendering if the value is too long for a QR code
  if (qrValue.length > 300) {
    return (
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            QR Code
          </h3>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-red-500">QR code data too long to encode.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-border">
      <CardHeader>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          QR Code
        </h3>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
          <QRCodeCanvas
            id="product-qr-canvas"
            value={qrValue}
            size={192}
            includeMargin={true}
            level="H"
          />
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <div data-testid="text-batch-id">
            <span className="font-medium">Batch ID:</span> {product.batchId}
          </div>
          <div data-testid="text-blockchain-hash">
            <span className="font-medium">Blockchain:</span>{" "}
            {product.blockchainHash?.slice(0, 12)}...
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-copy-link"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
