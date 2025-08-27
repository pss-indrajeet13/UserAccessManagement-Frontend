import { useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FirebaseRulesValidator() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const validateFirebaseRules = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const db = getFirestore(app);
      
      // Test read access to users collection
      console.log("Testing Firebase access...");
      const usersCollection = collection(db, 'users');
      await getDocs(usersCollection);
      
      // Test read access to activities collection
      const activitiesCollection = collection(db, 'activities');
      await getDocs(activitiesCollection);
      
      setValidationResult({
        success: true,
        message: "✅ Firebase access is working!",
        details: "Successfully connected to Firestore database with proper permissions."
      });
      
      console.log("✅ Firebase validation successful!");
      
    } catch (error: any) {
      console.error("❌ Firebase validation failed:", error);
      
      if (error?.code === 'permission-denied') {
        setValidationResult({
          success: false,
          message: "❌ Permission Denied",
          details: "Firestore security rules are blocking access. Please update the rules in Firebase Console."
        });
      } else {
        setValidationResult({
          success: false,
          message: "❌ Connection Failed",
          details: `Error: ${error?.message || 'Unknown error'}`
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <span className="material-icons mr-2">verified</span>
          Firebase Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-blue-700">
          Test your Firebase connection and security rules to make sure everything is working properly.
        </div>
        
        <Button 
          onClick={validateFirebaseRules}
          disabled={isValidating}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isValidating ? (
            <>
              <span className="material-icons animate-spin mr-2 text-sm">sync</span>
              Testing Connection...
            </>
          ) : (
            <>
              <span className="material-icons mr-2 text-sm">play_arrow</span>
              Test Firebase Connection
            </>
          )}
        </Button>

        {validationResult && (
          <Alert className={validationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <span className={`material-icons ${validationResult.success ? "text-green-600" : "text-red-600"}`}>
              {validationResult.success ? "check_circle" : "error"}
            </span>
            <AlertDescription className={validationResult.success ? "text-green-800" : "text-red-800"}>
              <div className="font-medium">{validationResult.message}</div>
              {validationResult.details && (
                <div className="text-sm mt-1">{validationResult.details}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {validationResult?.success && (
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-500 text-white">
              Ready to use
            </Badge>
            <span className="text-sm text-green-700">
              Your Firebase is properly configured!
            </span>
          </div>
        )}

        {validationResult?.success === false && (
          <div className="text-sm text-red-700">
            <strong>Next steps:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Go to Firebase Console</li>
              <li>Navigate to Firestore → Rules</li>
              <li>Update security rules to allow access</li>
              <li>Click "Publish" to apply changes</li>
              <li>Test connection again</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
