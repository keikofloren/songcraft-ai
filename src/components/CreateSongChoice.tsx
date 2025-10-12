import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Music, Mic } from "lucide-react";

export default function CreateSongChoice() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get patientId and patientName from navigation state
  const patientId = location.state?.patientId;
  const patientName = location.state?.patientName;

  console.log("[CreateSongChoice] 🔍 Received patientId:", patientId);
  console.log("[CreateSongChoice] 🔍 Received patientName:", patientName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brown-900 mb-4">
            Create a New Song
          </h1>
          {patientName && (
            <p className="text-lg text-brown-700">For: {patientName}</p>
          )}
          <p className="text-brown-600 mt-2">
            Choose the type of song you'd like to create
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* With Lyrics */}
          <Card
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-400"
            onClick={() =>
              navigate("/create-song/lyrics", { state: { patientId } })
            }
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-300 to-blue-400 rounded-full w-16 h-16 flex items-center justify-center">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">With Lyrics</CardTitle>
              <CardDescription>
                Create a song with vocals and meaningful lyrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-brown-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Theme and keywords
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Mood and emotions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Song structure (AB or ABA)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Vocal gender selection
                </li>
              </ul>
              <Button
                className="w-full mt-6"
                onClick={() =>
                  navigate("/create-song/lyrics", { state: { patientId } })
                }
              >
                Create with Lyrics
              </Button>
            </CardContent>
          </Card>

          {/* Without Lyrics (Instrumental) */}
          <Card
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-amber-400"
            onClick={() =>
              navigate("/create-song/instrumental", { state: { patientId } })
            }
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-amber-300 to-amber-400 rounded-full w-16 h-16 flex items-center justify-center">
                <Music className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Instrumental</CardTitle>
              <CardDescription>
                Create a song without vocals, pure instrumental
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-brown-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Song form (AB or ABA)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Mood and emotions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Melodic motif options
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Instrumentation choices
                </li>
              </ul>
              <Button
                className="w-full mt-6"
                onClick={() =>
                  navigate("/create-song/instrumental", {
                    state: { patientId },
                  })
                }
              >
                Create Instrumental
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate("/therapist/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
