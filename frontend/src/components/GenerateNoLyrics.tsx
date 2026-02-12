import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft } from "lucide-react";

type SongFormat = "Two Part A B" | "Three Part A B A" | null;

export default function GenerateNoLyrics() {
  const navigate = useNavigate();
  const location = useLocation();
  const patientId = location.state?.patientId;

  console.log("[GenerateNoLyrics] 🔍 Received patientId:", patientId);

  const [instForm, setInstForm] = useState<SongFormat>(null);
  const [instMoods, setInstMoods] = useState("");

  const handleContinue = () => {
    // Validate required fields
    if (!instForm) {
      alert("Please select a song form");
      return;
    }

    // Navigate to motif page with all the data
    navigate("/create-song/motif-instrumentation", {
      state: {
        patientId,
        songType: "instrumental",
        instForm,
        instMoods,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/create-song/choice")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              Instrumental Song
            </CardTitle>
            <p className="text-center text-brown-600 mt-2">
              Create a therapeutic instrumental piece without vocals
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Song Form <span className="text-red-500">*</span>
              </Label>
              <Select
                value={instForm || ""}
                onValueChange={(val) => setInstForm(val as SongFormat)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select song structure..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Two Part A B">Two Part (AB)</SelectItem>
                  <SelectItem value="Three Part A B A">
                    Three Part (ABA)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-brown-500">
                AB: Two distinct sections | ABA: Three sections with repetition
              </p>
            </div>

            {/* Mood/Emotions */}
            <div className="space-y-2">
              <Label htmlFor="moods" className="text-lg font-semibold">
                Mood / Emotions
              </Label>
              <Input
                id="moods"
                placeholder="e.g., peaceful, contemplative, uplifting (comma-separated)"
                value={instMoods}
                onChange={(e) => setInstMoods(e.target.value)}
              />
              <p className="text-sm text-brown-500">
                Describe the emotional atmosphere you want to create
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-brown-900 mb-2">
                What's Next?
              </h3>
              <p className="text-sm text-brown-700">
                On the next page, you'll be able to:
              </p>
              <ul className="text-sm text-brown-700 mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Hum or record a melodic motif
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Set tempo preferences
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Choose musical style
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Select instrumentation
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Button onClick={handleContinue} className="w-full" size="lg">
                Continue to Motif & Instrumentation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
