import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Music, Heart, Users, HeadphonesIcon, CheckCircle } from "lucide-react";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100">
      {/* Header */}
      <header className="border-b-2 border-amber-950 bg-white backdrop-blur-sm sticky top-0 z-50 shadow-xl">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg shadow-md">
              <Music className="h-6 w-6 text-amber-100" />
            </div>
            <h1 className="text-2xl font-bold text-amber-950">SongCraft AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => onNavigate("/therapist/login")}
              className="bg-gradient-to-r from-amber-950 to-amber-900 hover:from-amber-900 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition-all rounded-2xl border-2 border-amber-950 px-6"
            >
              Sign In / Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-amber-950 mb-6 leading-tight">
            AI-Powered Music Therapy
            <br />
            <span className="text-amber-900">
              for Mental Health Professionals
            </span>
          </h2>
          <p className="text-xl text-amber-900 mb-12 max-w-3xl mx-auto leading-relaxed">
            Create personalized therapeutic music for your patients with the
            power of AI. Manage patient progress, track sessions, and generate
            healing soundscapes tailored to individual needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => onNavigate("/therapist/login")}
              className="bg-gradient-to-r from-amber-950 to-amber-900 hover:from-amber-900 hover:to-amber-800 text-white shadow-lg hover:shadow-xl transition-all rounded-2xl border-2 border-amber-950 px-8 py-6 text-lg"
            >
              <Music className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-amber-950 mb-4">
              Everything You Need for Music Therapy
            </h3>
            <p className="text-xl text-amber-900">
              Professional tools designed for therapists
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-amber-950 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-950 to-amber-900 border-b-2 border-amber-950">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg">
                    <Users className="h-6 w-6 text-amber-100" />
                  </div>
                  <CardTitle className="text-xl text-white">
                    Patient Management
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-amber-900">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-950" />
                    Track patient progress
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-950" />
                    Organize sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-950" />
                    Session notes & history
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-950 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-950 to-amber-900 border-b-2 border-amber-950">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg">
                    <Heart className="h-6 w-6 text-amber-100" />
                  </div>
                  <CardTitle className="text-xl text-white">
                    AI Music Generation
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-amber-900">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-950" />
                    Emotion-based songs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-950" />
                    Custom therapeutic themes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-950" />
                    Multiple style options
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-950 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-950 to-amber-900 border-b-2 border-amber-950">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg">
                    <HeadphonesIcon className="h-6 w-6 text-amber-100" />
                  </div>
                  <CardTitle className="text-xl text-white">
                    Professional Audio
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-amber-900">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-950" />
                    High-quality output
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-950" />
                    Easy export & download
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-950" />
                    Built-in audio player
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-amber-950 mb-4">
              How It Works
            </h3>
            <p className="text-xl text-amber-900">
              Three simple steps to create therapeutic music
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-2 border-amber-950 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-950 to-amber-900 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <CardTitle className="text-amber-950">
                  Add Your Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-900">
                  Create patient profiles and track their therapeutic music
                  journey with organized session notes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-amber-950 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-950 to-amber-900 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <CardTitle className="text-amber-950">Generate Music</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-900">
                  Use AI to create personalized therapeutic songs tailored to
                  each patient's emotional needs.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-amber-950 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-950 to-amber-900 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <CardTitle className="text-amber-950">Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-900">
                  Document sessions, review patient history, and monitor
                  therapeutic outcomes over time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-8">
          <Card className="border-2 border-amber-950 bg-white rounded-3xl shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-950 to-amber-900 py-12">
              <div className="text-center">
                <h3 className="text-4xl font-bold text-white mb-4">
                  Ready to Transform Your Music Therapy Practice?
                </h3>
                <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
                  Join mental health professionals using AI-powered music
                  therapy
                </p>
                <Button
                  size="lg"
                  onClick={() => onNavigate("/therapist/login")}
                  className="bg-white text-amber-950 hover:bg-amber-100 shadow-xl transition-all rounded-2xl border-2 border-white px-8 py-6 text-lg font-bold"
                >
                  <Music className="mr-2 h-5 w-5" />
                  Get Started Today
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-950 text-amber-100 py-12">
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg shadow-md">
              <Music className="h-5 w-5 text-amber-100" />
            </div>
            <span className="text-xl font-bold text-white">SongCraft AI</span>
          </div>
          <div className="text-center text-amber-200">
            <p>
              &copy; 2025 SongCraft AI. Empowering healing through music
              therapy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
