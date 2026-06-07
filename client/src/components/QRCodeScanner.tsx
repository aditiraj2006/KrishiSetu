import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { AlertTriangle, Camera, FlipHorizontal, StopCircle, Upload, FileImage, Loader2, HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProductByBatch } from "@/hooks/useProducts";
import { getAuthHeaders } from "@/lib/authHeaders";

export function QRCodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBatchId, setScannedBatchId] = useState<string>("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<
    "idle" | "pending" | "granted" | "denied" | "notfound"
  >("idle");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // New states for image upload
  const [isDecodingImage, setIsDecodingImage] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const { data: product, isLoading, error } = useProductByBatch(scannedBatchId);

  // Start camera and enumerate devices only when scanning starts
  const startScanning = async () => {
    setScanError(null);
    setScannedBatchId("");
    setUploadedImagePreview(null);
    setCameraStatus("pending");
    setIsScanning(true);

    try {
      // Ask for camera permission and enumerate devices
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus("granted");

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setAvailableCameras(videoDevices);

      // Set default camera (prefer rear camera if available)
      if (videoDevices.length > 0) {
        const rearCamera = videoDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear"),
        );
        setSelectedCamera(rearCamera ? rearCamera.deviceId : videoDevices[0].deviceId);
      } else {
        setCameraStatus("notfound");
        setIsScanning(false);
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraStatus("denied");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraStatus("notfound");
      } else {
        setCameraStatus("denied");
      }
      setIsScanning(false);
    }
  };

  // Scanning logic moved to useEffect
  useEffect(() => {
    if (!isScanning || cameraStatus !== "granted" || !selectedCamera || !videoRef.current) return;

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
      .decodeFromVideoDevice(selectedCamera, videoRef.current, (result, err) => {
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
          const urlMatch = trimmedText.match(/\/product\/([a-f0-9-]+)$/i);
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
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((error) => {
        toast({
          title: "Camera Error",
          description: "Unable to access camera. Please ensure camera permissions are granted.",
          variant: "destructive",
        });
        setScanError("Unable to access camera. Please ensure camera permissions are granted.");
        setCameraStatus("denied");
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
    const currentIndex = availableCameras.findIndex((cam) => cam.deviceId === selectedCamera);
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

  // Decode QR code from an uploaded file
  const decodeFile = (file: File) => {
    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setScanError("Unsupported file format. Please upload PNG, JPG, JPEG, or WEBP.");
      toast({
        title: "Unsupported Format",
        description: "Please upload a PNG, JPG, JPEG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    setScanError(null);
    setScannedBatchId("");
    setUploadedImagePreview(null);
    setIsDecodingImage(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedImagePreview(dataUrl);

      const img = new Image();
      img.onload = async () => {
        try {
          const codeReader = new BrowserQRCodeReader();
          const result = await codeReader.decodeFromImageElement(img);
          const text = result.getText();

          if (!text || text.trim() === "") {
            setScanError("Uploaded QR code does not contain a batch ID.");
            toast({
              title: "Invalid QR Code",
              description: "Uploaded QR code does not contain a batch ID.",
              variant: "destructive",
            });
            setIsDecodingImage(false);
            return;
          }

          // Extract batch ID
          const trimmedText = text.trim();
          let batchId = trimmedText;

          const urlMatch = trimmedText.match(/\/product\/([a-f0-9-]+)$/i);
          if (urlMatch) {
            batchId = urlMatch[1];
          } else if (trimmedText.includes("/product/")) {
            const parts = trimmedText.split("/product/");
            if (parts.length > 1) {
              batchId = parts[1].split("/")[0];
            }
          }

          if (!batchId || batchId === trimmedText) {
            batchId = trimmedText;
          }

          setScannedBatchId(batchId);
          setScanError(null);
        } catch (err: any) {
          console.error("Decoding error:", err);
          setScanError("No QR code detected in the uploaded image. Please try another image.");
          toast({
            title: "No QR Code Detected",
            description: "No QR code was found in the uploaded image. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsDecodingImage(false);
        }
      };
      img.onerror = () => {
        setScanError("Failed to load image file.");
        toast({
          title: "Image Load Error",
          description: "Could not load the image file. Please ensure it is a valid image.",
          variant: "destructive",
        });
        setIsDecodingImage(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setScanError("Failed to read image file.");
      toast({
        title: "File Read Error",
        description: "Failed to read the file from your device.",
        variant: "destructive",
      });
      setIsDecodingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      decodeFile(e.dataTransfer.files[0]);
    }
  };

  // Navigate to product details when product is found
  useEffect(() => {
    async function saveScannedProduct() {
      if (user && user.role === "consumer" && product) {
        try {
          // Get geolocation
          let coordinates = null;
          if ("geolocation" in navigator) {
            try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 5000,
                });
              });
              coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
            } catch (geoError) {
              console.warn("Geolocation failed:", geoError);
            }
          }

          const response = await fetch("/api/scans", {
            method: "POST",
            headers: await getAuthHeaders({
              "Content-Type": "application/json",
            }),
            body: JSON.stringify({
              productId: product.id,
              userId: user.id,
              coordinates: coordinates,
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
      if (error.message?.includes("not found") || error.message?.includes("404")) {
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
        <div className="text-center text-muted-foreground mb-4">Checking camera permissions...</div>
      )}
      {cameraStatus === "notfound" && (
        <div className="text-center text-red-600 mb-4">No camera found on this device.</div>
      )}

      {/* Only show scanner UI if scanning and camera is granted */}
      {isScanning && cameraStatus === "granted" ? (
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
                  Stop Scanner
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
      ) : (
        /* Dual Verification UI: Camera Scan OR Image Upload */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Card 1: Camera Scanner */}
          <Card className="shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-all duration-300">
            {cameraStatus === "denied" ? (
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full space-y-4">
                <div className="p-4 bg-red-100 dark:bg-red-950/30 rounded-full text-red-600">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Camera Access Denied</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Camera access was denied. Please enable camera permissions in your browser settings to scan QR codes.
                </p>
                <a href="https://support.google.com/chrome/answer/2693767" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium transition-colors">
                  <HelpCircle className="w-4 h-4" />
                  How to enable camera
                </a>
                <div className="pt-2 w-full">
                  <Button
                    onClick={startScanning}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center gap-2 py-5 text-base font-medium rounded-xl"
                    data-testid="button-try-again-camera"
                  >
                    <Camera className="w-5 h-5" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full space-y-4">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <Camera className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Scan with Camera</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Scan the QR code printed on the product packaging in real-time using your device webcam.
                </p>
                <div className="pt-2 w-full">
                  <Button
                    onClick={startScanning}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center gap-2 py-5 text-base font-medium rounded-xl"
                    data-testid="button-start-camera"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera Scan
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* OR separator for desktop / mobile */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-background border border-border text-xs font-semibold text-muted-foreground z-10 shadow-sm">
            OR
          </div>
          <div className="md:hidden flex items-center justify-center my-2 text-xs font-semibold text-muted-foreground">
            <span className="w-full h-px bg-border mr-3"></span>
            OR
            <span className="w-full h-px bg-border ml-3"></span>
          </div>

          {/* Card 2: Upload Image */}
          <Card className="shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full space-y-4">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Upload QR Image</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Select or drag & drop a screenshot, photo, or downloaded image containing a product QR code.
              </p>
              
              <div className="w-full pt-2">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 transition-colors duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[110px] ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onClick={() => document.getElementById("qr-file-input")?.click()}
                >
                  <input
                    type="file"
                    id="qr-file-input"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => {
                      if (e.target.files?.[0]) decodeFile(e.target.files[0]);
                    }}
                  />
                  {isDecodingImage ? (
                    <div className="flex flex-col items-center space-y-2 py-4">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-xs text-muted-foreground font-medium">Processing QR Image...</p>
                    </div>
                  ) : uploadedImagePreview ? (
                    <div className="flex flex-col items-center space-y-2 py-2">
                      <div className="relative w-12 h-12 rounded overflow-hidden border border-border">
                        <img src={uploadedImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-green-600 font-medium">Image Loaded. Checking...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1 py-4">
                      <FileImage className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-primary font-medium hover:underline">Choose file</span>
                      <span className="text-[10px] text-muted-foreground">or drag & drop here</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error display outside option cards */}
      {!isScanning && scanError && (
        <div className="flex items-center justify-center text-red-600 text-sm py-2 px-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl gap-2 max-w-md mx-auto">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-center">{scanError}</span>
        </div>
      )}

      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-medium mb-2">Instructions:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>For camera scanning: hold steady in good lighting.</li>
              <li>For file upload: support PNG, JPG, JPEG, WEBP formats.</li>
              <li>Ensure the QR code is flat, undamaged, and clearly visible.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
