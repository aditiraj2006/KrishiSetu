import { AlertCircle, Home } from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-background font-sans">
      <NavigationHeader />
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2 items-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">404 Page Not Found</h1>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/dashboard">
              <Button className="mt-6 w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
