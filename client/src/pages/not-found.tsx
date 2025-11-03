import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <NavigationHeader />
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Developers forget to add the page !!!!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
