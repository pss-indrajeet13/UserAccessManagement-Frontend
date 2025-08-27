import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PermissionErrorProps {
  title?: string;
  description?: string;
  showFirebaseInstructions?: boolean;
}

export default function PermissionError({ 
  title = "Permission Denied", 
  description = "Access to Firebase database is restricted.",
  showFirebaseInstructions = true 
}: PermissionErrorProps) {
  const openFirebaseConsole = () => {
    window.open('https://console.firebase.google.com/', '_blank');
  };

  const copySecurityRules = () => {
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to users collection
    match /users/{userId} {
      allow read, write: if true;
    }
    
    // Allow read/write access to activities collection
    match /activities/{activityId} {
      allow read, write: if true;
    }
    
    // Allow read/write to any other collections
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

    navigator.clipboard.writeText(rules).then(() => {
      alert('Security rules copied to clipboard!');
    }).catch(() => {
      console.log('Security rules:', rules);
      alert('Security rules logged to console');
    });
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6">
        <Alert className="border-red-200">
          <span className="material-icons text-red-600">security</span>
          <AlertTitle className="text-red-800">{title}</AlertTitle>
          <AlertDescription className="text-red-700 mt-2">
            {description}
          </AlertDescription>
        </Alert>

        {showFirebaseInstructions && (
          <div className="mt-4 space-y-3">
            <h4 className="font-semibold text-red-800">🔧 How to Fix:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-red-700">
              <li>Go to Firebase Console → Firestore Database → Rules</li>
              <li>Copy the security rules below</li>
              <li>Replace existing rules and click "Publish"</li>
            </ol>
            
            <div className="flex space-x-2 mt-4">
              <Button 
                onClick={openFirebaseConsole}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <span className="material-icons text-sm mr-1">open_in_new</span>
                Open Firebase Console
              </Button>
              <Button 
                onClick={copySecurityRules}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <span className="material-icons text-sm mr-1">content_copy</span>
                Copy Security Rules
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
