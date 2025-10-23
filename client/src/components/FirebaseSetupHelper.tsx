import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import FirebaseRulesValidator from "./FirebaseRulesValidator";

export default function FirebaseSetupHelper() {
  const [step, setStep] = useState(1);
  const [rulesUpdated, setRulesUpdated] = useState(false);

  const securityRules = `rules_version = '2';
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
    
    // Allow read/write to any other collections for admin dashboard
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const steps = [
    {
      title: "Open Firebase Console",
      description: "Click the button below to open Firebase Console in a new tab",
      action: (
        <Button 
          onClick={() => {
            window.open('https://console.firebase.google.com/project/fertiwell-72814/firestore/rules', '_blank');
            setStep(2);
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <span className="material-icons mr-2">open_in_new</span>
          Open Firebase Console
        </Button>
      )
    },
    {
      title: "Navigate to Rules",
      description: "In Firebase Console: Firestore Database → Rules tab",
      action: (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">You should see the Rules editor. Click Next when you're there.</p>
          <Button onClick={() => setStep(3)} variant="outline">
            I'm in the Rules section
          </Button>
        </div>
      )
    },
    {
      title: "Copy & Replace Rules",
      description: "Copy the rules below and replace everything in the Firebase Rules editor",
      action: (
        <div className="space-y-3">
          <Textarea 
            value={securityRules}
            readOnly
            className="font-mono text-sm"
            rows={15}
          />
          <div className="flex space-x-2">
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(securityRules);
                alert('Rules copied to clipboard!');
              }}
              variant="outline"
            >
              <span className="material-icons mr-1 text-sm">content_copy</span>
              Copy Rules
            </Button>
            <Button onClick={() => setStep(4)} variant="outline">
              Rules Copied & Pasted
            </Button>
          </div>
        </div>
      )
    },
    {
      title: "Publish Rules",
      description: "Click the 'Publish' button in Firebase Console to apply the new rules",
      action: (
        <div className="space-y-2">
          <Alert className="border-green-200 bg-green-50">
            <span className="material-icons text-green-600">info</span>
            <AlertDescription className="text-green-800">
              Look for the blue "Publish" button in Firebase Console and click it.
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            <Button
              onClick={() => setStep(5)}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
            >
              <span className="material-icons mr-2">check_circle</span>
              I Published the Rules - Test Connection
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRulesUpdated(true);
                window.location.reload();
              }}
              className="w-full"
            >
              Skip Test - Refresh App Now
            </Button>
          </div>
        </div>
      )
    },
    {
      title: "Test Connection",
      description: "Verify that Firebase is working properly with the new rules",
      action: (
        <div className="space-y-3">
          <FirebaseRulesValidator />
          <Button
            onClick={() => {
              setRulesUpdated(true);
              window.location.reload();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            <span className="material-icons mr-2">refresh</span>
            Connection Verified - Refresh App
          </Button>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <span className="material-icons mr-2">warning</span>
          Firebase Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <span className="material-icons text-red-600">security</span>
          <AlertTitle className="text-red-800">Permission Denied Error</AlertTitle>
          <AlertDescription className="text-red-700">
            Your Firestore database is in production mode and blocking access. 
            Follow these steps to fix it:
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-2 mb-4">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center">
              <Badge 
                variant={step > index + 1 ? "default" : step === index + 1 ? "secondary" : "outline"}
                className={
                  step > index + 1 ? "bg-green-500 text-white" :
                  step === index + 1 ? "bg-orange-500 text-white" :
                  "bg-gray-200 text-gray-600"
                }
              >
                {index + 1}
              </Badge>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-300 mx-1"></div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-2">
            Step {step}: {currentStep.title}
          </h3>
          <p className="text-gray-600 mb-3">{currentStep.description}</p>
          {currentStep.action}
        </div>

        {step < 4 && (
          <div className="text-center">
            <Button 
              onClick={() => setStep(step + 1)}
              variant="ghost"
              className="text-gray-500"
            >
              Skip to Step {step + 1}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
