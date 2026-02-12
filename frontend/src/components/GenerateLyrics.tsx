import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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

export default function GenerateLyrics() {
  const navigate = useNavigate();
  const location = useLocation();
  const patientId = location.state?.patientId;

  console.log("[GenerateLyrics] 🔍 Received patientId:", patientId);

  const [lyricTheme, setLyricTheme] = useState("");
  const [lyricKeywords, setLyricKeywords] = useState("");
  const [excludeWords, setExcludeWords] = useState("");
  const [lyricMoods, setLyricMoods] = useState("");
  const [lyricForm, setLyricForm] = useState<SongFormat>(null);
  const [wordsPerPhrase, setWordsPerPhrase] = useState<number | "">("");
  const [vocalGender, setVocalGender] = useState("");

  const handleContinue = () => {
    // Validate required fields
    if (!lyricTheme.trim()) {
      alert("Please enter a theme for the lyrics");
      return;
    }
    if (!vocalGender) {
      alert("Please select a vocal gender");
      return;
    }

    // Navigate to motif page with all the data
    navigate("/create-song/motif-instrumentation", {
      state: {
        patientId,
        songType: "lyrics",
        lyricTheme,
        lyricKeywords,
        excludeWords,
        lyricMoods,
        lyricForm,
        wordsPerPhrase,
        vocalGender,
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
              Song with Lyrics
            </CardTitle>
            <p className="text-center text-brown-600 mt-2">
              Let's create meaningful lyrics for your therapeutic song
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-lg font-semibold">
                Theme for Lyrics <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="theme"
                placeholder="e.g., Overcoming challenges, Finding inner peace, Celebrating progress..."
                value={lyricTheme}
                onChange={(e) => setLyricTheme(e.target.value)}
                rows={3}
                required
              />
            </div>

            {/* Keywords to Include */}
            <div className="space-y-2">
              <Label htmlFor="keywords" className="text-lg font-semibold">
                Keywords to Include
              </Label>
              <Input
                id="keywords"
                placeholder="e.g., strength, hope, courage (comma-separated)"
                value={lyricKeywords}
                onChange={(e) => setLyricKeywords(e.target.value)}
              />
              <p className="text-sm text-brown-500">
                Separate multiple keywords with commas
              </p>
            </div>

            {/* Words to Exclude */}
            <div className="space-y-2">
              <Label htmlFor="exclude" className="text-lg font-semibold">
                Words to Exclude
              </Label>
              <Input
                id="exclude"
                placeholder="e.g., pain, suffering, fear (comma-separated)"
                value={excludeWords}
                onChange={(e) => setExcludeWords(e.target.value)}
              />
              <p className="text-sm text-brown-500">
                Words you don't want in the song
              </p>
            </div>

            {/* Mood/Emotions */}
            <div className="space-y-2">
              <Label htmlFor="moods" className="text-lg font-semibold">
                Mood / Emotions
              </Label>
              <Input
                id="moods"
                placeholder="e.g., uplifting, calm, hopeful (comma-separated)"
                value={lyricMoods}
                onChange={(e) => setLyricMoods(e.target.value)}
              />
            </div>

            {/* Form */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Song Form</Label>
              <Select
                value={lyricForm || ""}
                onValueChange={(val) => setLyricForm(val as SongFormat)}
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
            </div>

            {/* Words Per Phrase */}
            <div className="space-y-2">
              <Label htmlFor="wordsPerPhrase" className="text-lg font-semibold">
                Words Per Phrase (Optional)
              </Label>
              <Input
                id="wordsPerPhrase"
                type="number"
                placeholder="e.g., 5"
                value={wordsPerPhrase}
                onChange={(e) =>
                  setWordsPerPhrase(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
              <p className="text-sm text-brown-500">
                Constrain the number of words in each phrase
              </p>
            </div>

            {/* Vocal Gender */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Vocal Gender <span className="text-red-500">*</span>
              </Label>
              <Select value={vocalGender} onValueChange={setVocalGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vocal gender..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
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
