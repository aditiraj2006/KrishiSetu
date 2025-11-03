// components/PaymentProofModal.tsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export function PaymentProofModal({ isOpen, onClose, imageUrl }: PaymentProofModalProps) {
    const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imageUrl.split("/").pop() || "payment-proof";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to download image.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Payment Proof</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleDownload}
                className="px-2"
                >
                <Download className="w-4 h-4 mr-1" />
                Download
             </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center p-6 bg-gray-100">
          <img 
            src={imageUrl} 
            alt="Payment proof" 
            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
            style={{ 
              imageOrientation: 'from-image' 
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}