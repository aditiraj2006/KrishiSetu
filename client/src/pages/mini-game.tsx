import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Sprout,
  Trophy,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Truck,
  QrCode,
  ShieldCheck,
  Star,
  Award,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NavigationHeader } from "@/components/NavigationHeader";

interface CropItem {
  id: number;
  type: "wheat" | "apple" | "tomato" | "rotten" | "pest";
  name: string;
  icon: string;
  points: number;
  x: number;
  y: number;
}

interface BatchInspection {
  id: number;
  cropName: string;
  purity: number;
  moisture: number;
  isOrganic: boolean;
  correctGrade: "Grade A+" | "Grade A" | "Reject";
}

export default function MiniGamePage() {
  const [stage, setStage] = useState<"intro" | "stage1" | "stage2" | "stage3" | "summary">("intro");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  // Stage 1 State: Harvest Catch
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [timeLeftStage1, setTimeLeftStage1] = useState(20);
  const [harvestScore, setHarvestScore] = useState(0);

  // Stage 2 State: Quality Inspection
  const [inspectionIndex, setInspectionIndex] = useState(0);
  const [inspectionScore, setInspectionScore] = useState(0);
  const [inspections] = useState<BatchInspection[]>([
    { id: 1, cropName: "Organic Shimla Apples", purity: 98, moisture: 12, isOrganic: true, correctGrade: "Grade A+" },
    { id: 2, cropName: "Punjab Durum Wheat", purity: 85, moisture: 19, isOrganic: false, correctGrade: "Grade A" },
    { id: 3, cropName: "Blight-Affected Tomatoes", purity: 45, moisture: 40, isOrganic: false, correctGrade: "Reject" },
    { id: 4, cropName: "Premium Basmati Rice", purity: 99, moisture: 11, isOrganic: true, correctGrade: "Grade A+" },
    { id: 5, cropName: "Overripe Sugarcane", purity: 60, moisture: 30, isOrganic: false, correctGrade: "Reject" },
  ]);

  // Stage 3 State: Truck Dispatch Logistics
  const [truckPos, setTruckPos] = useState(10); // percentage 10% to 90%
  const [obstacles, setObstacles] = useState<{ id: number; pos: number; label: string }[]>([
    { id: 1, pos: 30, label: "Unpaved Road" },
    { id: 2, pos: 55, label: "Traffic Jam" },
    { id: 3, pos: 75, label: "Rainstorm" },
  ]);
  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const [logisticsScore, setLogisticsScore] = useState(0);

  // Start Harvest Stage
  const startStage1 = () => {
    setStage("stage1");
    setScore(0);
    setHarvestScore(0);
    setTimeLeftStage1(20);
    setCrops([]);
  };

  // Stage 1 Loop
  useEffect(() => {
    if (stage !== "stage1") return;

    const timer = setInterval(() => {
      setTimeLeftStage1((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStage("stage2");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const cropSpawner = setInterval(() => {
      const types: CropItem["type"][] = ["wheat", "apple", "tomato", "rotten", "pest"];
      const selectedType = types[Math.floor(Math.random() * types.length)];

      let icon = "🌾";
      let name = "Wheat";
      let points = 10;

      if (selectedType === "apple") {
        icon = "🍎";
        name = "Apple";
        points = 15;
      } else if (selectedType === "tomato") {
        icon = "🍅";
        name = "Tomato";
        points = 12;
      } else if (selectedType === "rotten") {
        icon = "🤢";
        name = "Rotten Crop";
        points = -15;
      } else if (selectedType === "pest") {
        icon = "🐛";
        name = "Pest";
        points = -20;
      }

      const newCrop: CropItem = {
        id: Date.now() + Math.random(),
        type: selectedType,
        name,
        icon,
        points,
        x: Math.floor(Math.random() * 80) + 10,
        y: Math.floor(Math.random() * 70) + 15,
      };

      setCrops((prev) => [...prev.slice(-7), newCrop]);
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(cropSpawner);
    };
  }, [stage]);

  const handleHarvestClick = (crop: CropItem) => {
    if (crop.points > 0) {
      setCombo((prev) => prev + 1);
      const earned = crop.points + combo * 2;
      setHarvestScore((prev) => prev + earned);
      setScore((prev) => prev + earned);
    } else {
      setCombo(0);
      setHarvestScore((prev) => Math.max(0, prev + crop.points));
      setScore((prev) => Math.max(0, prev + crop.points));
    }
    setCrops((prev) => prev.filter((c) => c.id !== crop.id));
  };

  // Stage 2 Logic: Quality Inspection
  const handleInspectionChoice = (choice: "Grade A+" | "Grade A" | "Reject") => {
    const current = inspections[inspectionIndex];
    if (choice === current.correctGrade) {
      setInspectionScore((prev) => prev + 50);
      setScore((prev) => prev + 50);
    }

    if (inspectionIndex + 1 < inspections.length) {
      setInspectionIndex((prev) => prev + 1);
    } else {
      setStage("stage3");
    }
  };

  // Stage 3 Logic: Delivery
  const handleAccelerateTruck = () => {
    setDeliveryProgress((prev) => {
      const next = prev + 12;
      if (next >= 100) {
        setLogisticsScore(150);
        setScore((prevScore) => prevScore + 150);
        setStage("summary");
        return 100;
      }
      return next;
    });
  };

  const resetGame = () => {
    setStage("intro");
    setScore(0);
    setCombo(0);
    setHarvestScore(0);
    setInspectionIndex(0);
    setInspectionScore(0);
    setDeliveryProgress(0);
    setLogisticsScore(0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30 text-sm font-semibold px-3 py-1">
            🌾 KrishiSetu Mini-Game
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Supply Chain Quest: Farm to Table 🚜
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm md:text-base">
            Master crop harvesting, AI-powered quality inspection, and transparent logistics delivery!
          </p>
        </div>

        {/* Game Stats Header */}
        {stage !== "intro" && stage !== "summary" && (
          <Card className="mb-6 bg-card border-primary/20 shadow-md">
            <CardContent className="py-4 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                <span className="text-xl font-bold">Score: {score}</span>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Combo: x{combo}
                </span>
                <span className="capitalize font-semibold text-primary">
                  Stage: {stage === "stage1" ? "1. Harvest" : stage === "stage2" ? "2. Inspection" : "3. Logistics"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STAGE INTRO */}
        {stage === "intro" && (
          <Card className="max-w-2xl mx-auto shadow-xl border-primary/30">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Sprout className="w-7 h-7 text-emerald-600" />
                Welcome to Krishi Quest!
              </CardTitle>
              <CardDescription>
                Test your skills in 3 fast-paced agricultural stages to earn your Certified Supply Chain Expert Badge!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-muted/40 text-center">
                  <div className="text-3xl mb-2">🌾</div>
                  <h4 className="font-bold text-sm">1. Harvest Rush</h4>
                  <p className="text-xs text-muted-foreground mt-1">Tap fresh crops & avoid pests!</p>
                </div>
                <div className="p-4 rounded-xl border bg-muted/40 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <h4 className="font-bold text-sm">2. Quality Grading</h4>
                  <p className="text-xs text-muted-foreground mt-1">Grade crop purity & assign QR tags.</p>
                </div>
                <div className="p-4 rounded-xl border bg-muted/40 text-center">
                  <div className="text-3xl mb-2">🚚</div>
                  <h4 className="font-bold text-sm">3. Dispatch Express</h4>
                  <p className="text-xs text-muted-foreground mt-1">Navigate obstacles & deliver on time!</p>
                </div>
              </div>

              <Button onClick={startStage1} className="w-full text-base py-6 font-bold gap-2">
                Start Quest <ArrowRight className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STAGE 1: HARVEST RUSH */}
        {stage === "stage1" && (
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>🌾 Stage 1: Crop Harvest Rush</span>
                </CardTitle>
                <CardDescription>Tap healthy crops for points. Avoid rotten crops and pests!</CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1 font-mono font-bold">
                ⏳ {timeLeftStage1}s
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-80 bg-gradient-to-b from-emerald-900/10 to-amber-900/10 border-2 border-dashed border-emerald-500/30 rounded-xl overflow-hidden cursor-crosshair">
                {crops.map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => handleHarvestClick(crop)}
                    style={{ left: `${crop.x}%`, top: `${crop.y}%` }}
                    className="absolute text-4xl transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform active:scale-90 animate-bounce"
                    aria-label={crop.name}
                  >
                    {crop.icon}
                  </button>
                ))}
                {crops.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Crops sprouting... Get ready!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* STAGE 2: QUALITY INSPECTION */}
        {stage === "stage2" && (
          <Card className="max-w-xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                Stage 2: AI Quality & Grade Inspector
              </CardTitle>
              <CardDescription>
                Batch {inspectionIndex + 1} of {inspections.length}: Inspect specs and assign correct quality status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-xl bg-card border shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-foreground">
                    {inspections[inspectionIndex].cropName}
                  </h3>
                  {inspections[inspectionIndex].isOrganic && (
                    <Badge className="bg-emerald-600 text-white">Certified Organic</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground block text-xs">Purity Score</span>
                    <span className="text-lg font-bold text-foreground">
                      {inspections[inspectionIndex].purity}%
                    </span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground block text-xs">Moisture Content</span>
                    <span className="text-lg font-bold text-foreground">
                      {inspections[inspectionIndex].moisture}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-center text-muted-foreground">Select Correct Grade:</p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => handleInspectionChoice("Grade A+")}
                    variant="outline"
                    className="py-6 font-bold border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    Grade A+
                  </Button>
                  <Button
                    onClick={() => handleInspectionChoice("Grade A")}
                    variant="outline"
                    className="py-6 font-bold border-blue-500/40 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  >
                    Grade A
                  </Button>
                  <Button
                    onClick={() => handleInspectionChoice("Reject")}
                    variant="outline"
                    className="py-6 font-bold border-destructive/40 hover:bg-destructive/10 text-destructive"
                  >
                    Reject Batch
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STAGE 3: LOGISTICS DISPATCH */}
        {stage === "stage3" && (
          <Card className="max-w-xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Truck className="w-6 h-6 text-primary" />
                Stage 3: Supply Chain Express Dispatch
              </CardTitle>
              <CardDescription>Repeatedly tap Dispatch Truck to navigate past obstacles and reach consumers!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Farm Warehouse</span>
                  <span>Distributor Hub</span>
                  <span>Retail Store</span>
                </div>
                <Progress value={deliveryProgress} className="h-4" />
              </div>

              <div className="p-8 rounded-xl bg-muted/50 border flex flex-col items-center justify-center gap-4">
                <div className="text-5xl animate-bounce">🚚💨</div>
                <Button onClick={handleAccelerateTruck} size="lg" className="w-full font-extrabold text-base py-6">
                  Accelerate Supply Truck 🚚
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* GAME SUMMARY */}
        {stage === "summary" && (
          <Card className="max-w-xl mx-auto shadow-2xl border-primary/30">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-10 h-10" />
              </div>
              <CardTitle className="text-2xl font-black">Quest Completed!</CardTitle>
              <CardDescription>You successfully navigated the KrishiSetu agricultural supply chain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-card border text-center space-y-2">
                <span className="text-sm text-muted-foreground font-medium">Final Score</span>
                <div className="text-4xl font-extrabold text-primary">{score} Pts</div>
                <Badge className="bg-emerald-600 text-white mt-2">
                  <Star className="w-3 h-3 mr-1 fill-current" /> Certified Agri-Logistics Master
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground block">Harvest</span>
                  <span className="font-bold text-sm">{harvestScore} pts</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground block">Inspection</span>
                  <span className="font-bold text-sm">{inspectionScore} pts</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground block">Logistics</span>
                  <span className="font-bold text-sm">{logisticsScore} pts</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={resetGame} variant="outline" className="flex-1 gap-2">
                  <RotateCcw className="w-4 h-4" /> Play Again
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full gap-2">
                    Back to Dashboard <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
