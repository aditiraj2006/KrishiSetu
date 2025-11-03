import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProductByBatch } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import {
  Camera,
  StopCircle,
  AlertTriangle,
  FlipHorizontal,
} from "lucide-react";
import { useLocation } from "wouter";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

export function QRCodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBatchId, setScannedBatchId] = useState<string>("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<
    "idle" | "pending" | "granted" | "denied" | "notfound"
  >("idle");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: product, isLoading, error } = useProductByBatch(scannedBatchId);

  // Start camera and enumerate devices only when scanning starts
  const startScanning = async () => {
    setScanError(null);
    setScannedBatchId("");
    setCameraStatus("pending");
    setIsScanning(true);

    try {
      // Ask for camera permission and enumerate devices
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus("granted");

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setAvailableCameras(videoDevices);

      // Set default camera (prefer rear camera if available)
      if (videoDevices.length > 0) {
        const rearCamera = videoDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear")
        );
        setSelectedCamera(
          rearCamera ? rearCamera.deviceId : videoDevices[0].deviceId
        );
      } else {
        setCameraStatus("notfound");
        setIsScanning(false);
      }
    } catch (err: any) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setCameraStatus("denied");
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        setCameraStatus("notfound");
      } else {
        setCameraStatus("denied");
      }
      setIsScanning(false);
    }
  };

  // Scanning logic moved to useEffect
  useEffect(() => {
    if (
      !isScanning ||
      cameraStatus !== "granted" ||
      !selectedCamera ||
      !videoRef.current
    )
      return;

    codeReaderRef.current = new BrowserQRCodeReader();

    scanTimeoutRef.current = setTimeout(() => {
      stopScanning();
      setScanError("No QR code detected. Please try again.");
      toast({
        title: "No QR Code Detected",
        description: "No QR code was found. Please try again.",
        variant: "destructive",
      });
    }, 20000);

    codeReaderRef.current
      .decodeFromVideoDevice(
        selectedCamera,
        videoRef.current,
        (result, err) => {
          if (result) {
            clearTimeout(scanTimeoutRef.current!);
            const text = result.getText();
            if (!text || text.trim() === "") {
              setScanError("Scanned QR code does not contain a batch ID.");
              toast({
                title: "Invalid QR Code",
                description: "Scanned QR code does not contain a batch ID.",
                variant: "destructive",
              });
              stopScanning();
              return;
            }

            // Extract batch ID from URL format: /product/{batchId}
            const trimmedText = text.trim();
            let batchId = trimmedText;

            // Check if it's a full URL and extract the batch ID
            const urlMatch = trimmedText.match(/\/product\/([a-f0-9\-]+)$/i);
            if (urlMatch) {
              batchId = urlMatch[1];
            } else if (trimmedText.includes("/product/")) {
              // Handle partial URLs
              const parts = trimmedText.split("/product/");
              if (parts.length > 1) {
                batchId = parts[1].split("/")[0]; // Take only the batch ID part
              }
            }

            if (!batchId || batchId === trimmedText) {
              // If we couldn't extract a batch ID, assume the scanned text is the batch ID
              batchId = trimmedText;
            }

            setScannedBatchId(batchId);
            setScanError(null);
            stopScanning();
          }
        }
      )
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((error) => {
        toast({
          title: "Camera Error",
          description:
            "Unable to access camera. Please ensure camera permissions are granted.",
          variant: "destructive",
        });
        setScanError(
          "Unable to access camera. Please ensure camera permissions are granted."
        );
        setIsScanning(false);
        console.error("Camera error:", error);
      });

    toast({
      title: "Camera Started",
      description: "Point your camera at a KrishiSetu QR code",
    });

    // Cleanup on unmount or stop
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          videoRef.current.srcObject = null;
        } catch (e) {
          console.error("Error stopping video tracks:", e);
        }
      }
      if (codeReaderRef.current) {
        codeReaderRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [isScanning, selectedCamera, cameraStatus, toast]);

  // Switch between front and rear cameras (only when scanning)
  const switchCamera = () => {
    if (!isScanning || availableCameras.length < 2) return;
    const currentIndex = availableCameras.findIndex(
      (cam) => cam.deviceId === selectedCamera
    );
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    setSelectedCamera(availableCameras[nextIndex].deviceId);
  };

  // Stop camera and scanning
  const stopScanning = () => {
    setIsScanning(false);
    setCameraStatus("idle");
    setAvailableCameras([]);
    setSelectedCamera("");

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }

    // Force stop all video tracks and clear video
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      } catch (e) {
        console.error("Error stopping video tracks:", e);
      }
    }

    if (codeReaderRef.current) {
      codeReaderRef.current = null;
    }
  };

  // Navigate to product details when product is found
  useEffect(() => {
    async function saveScannedProduct() {
      if (user && user.role === "consumer" && product) {
        try {
          const response = await fetch("/api/scans", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "firebase-uid": user.firebaseUid,
            },
            body: JSON.stringify({
              productId: product.id,
              userId: user.id,
              timestamp: new Date(),
            }),
          });
          if (!response.ok) {
            throw new Error("Failed to save scanned product");
          }
        } catch (error) {
          console.error("Error saving scanned product:", error);
        }
      }
    }

    if (product && !isLoading && !error) {
      saveScannedProduct();
      navigate(`/product/${product.id}`);
      toast({
        title: "Product Found!",
        description: `${product.name} - ${product.batchId}`,
      });
    } else if (error && scannedBatchId) {
      if (
        error.message?.includes("not found") ||
        error.message?.includes("404")
      ) {
        setScanError(`No product found with batch ID: ${scannedBatchId}`);
        toast({
          title: "Product Not Found",
          description: `No product found with batch ID: ${scannedBatchId}`,
          variant: "destructive",
        });
      } else {
        setScanError(`Error looking up product: ${error.message}`);
        toast({
          title: "Lookup Error",
          description: "There was an error looking up the product information.",
          variant: "destructive",
        });
      }
      setScannedBatchId("");
    }
    // eslint-disable-next-line
  }, [product, isLoading, error, navigate, toast, scannedBatchId, user]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Camera permission messages */}
      {cameraStatus === "pending" && (
        <div className="text-center text-muted-foreground mb-4">
          Checking camera permissions...
        </div>
      )}
      {cameraStatus === "denied" && (
        <div className="text-center text-red-600 mb-4">
          Camera access denied. Please allow camera permission in your browser
          settings.
        </div>
      )}
      {cameraStatus === "notfound" && (
        <div className="text-center text-red-600 mb-4">
          No camera found on this device.
        </div>
      )}

      {/* Only show scanner UI if scanning and camera is granted */}
      {isScanning && cameraStatus === "granted" && (
        <Card className="shadow-sm border border-border">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div
                className="relative bg-muted rounded-lg overflow-hidden"
                style={{ aspectRatio: "4/3" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  data-testid="video-camera"
                />
                {/* Scanning overlay */}
                <div className="absolute inset-0 border-2 border-accent rounded-lg">
                  <div className="absolute inset-4 border border-accent/50 rounded-lg">
                    <div className="scan-line absolute top-0 left-0 right-0 h-0.5 bg-accent"></div>
                  </div>
                </div>
                {/* Corner brackets */}
                <div className="absolute top-8 left-8 w-6 h-6 border-l-2 border-t-2 border-accent"></div>
                <div className="absolute top-8 right-8 w-6 h-6 border-r-2 border-t-2 border-accent"></div>
                <div className="absolute bottom-8 left-8 w-6 h-6 border-l-2 border-b-2 border-accent"></div>
                <div className="absolute bottom-8 right-8 w-6 h-6 border-r-2 border-b-2 border-accent"></div>
              </div>
              {scanError && (
                <div className="flex items-center justify-center text-red-600 text-sm mt-2 gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {scanError}
                </div>
              )}
              <div className="flex justify-center gap-3">
                <Button
                  onClick={stopScanning}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-stop-camera"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop
                </Button>
                {availableCameras.length > 1 && (
                  <Button
                    onClick={switchCamera}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    Switch Camera
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show Start Camera button when not scanning */}
      {!isScanning && (
        <Card className="shadow-sm border border-border">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Camera is ready to scan QR codes
              </p>
              <p className="text-xs text-muted-foreground">
                Position the QR code within the frame to scan
              </p>
              <Button
                onClick={startScanning}
                className="bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-2 mt-4"
                data-testid="button-start-camera"
              >
                <Camera className="w-4 h-4" />
                Start Camera
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-medium mb-2">Scanning Instructions:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Hold your device steady</li>
              <li>Position the QR code within the frame</li>
              <li>Ensure good lighting</li>
              <li>Keep the QR code flat and undamaged</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
