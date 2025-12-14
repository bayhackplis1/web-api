import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Music, Video, Search, Terminal, Zap, Shield, Clock, ChevronDown, ExternalLink, Check, X, Loader2 } from "lucide-react";
import { SiYoutube, SiTiktok } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MatrixRain } from "@/components/matrix-rain";
import { TerminalHeader } from "@/components/terminal-header";
import { DownloadProgress } from "@/components/download-progress";
import { FeatureCard } from "@/components/feature-card";
import { ConsoleOutput } from "@/components/console-output";

type Platform = "youtube" | "tiktok";
type DownloadType = "video" | "audio" | "search";

interface DownloadState {
  status: "idle" | "processing" | "downloading" | "complete" | "error";
  progress: number;
  message: string;
  downloadUrl?: string;
  filename?: string;
}

export default function Home() {
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [downloadType, setDownloadType] = useState<DownloadType>("video");
  const [inputValue, setInputValue] = useState("");
  const [downloadState, setDownloadState] = useState<DownloadState>({
    status: "idle",
    progress: 0,
    message: "",
  });
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [typedText, setTypedText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const heroText = "DOWNLOAD.PROTOCOL://INITIATED";
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= heroText.length) {
        setTypedText(heroText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const addConsoleLine = (line: string) => {
    setConsoleLines(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString()}] ${line}`]);
  };

  const getPlaceholder = () => {
    if (downloadType === "search") {
      return platform === "youtube" ? "enter_search_query (e.g., lofi hip hop)" : "enter_username (e.g., @badbunny)";
    }
    return platform === "youtube" ? "paste_youtube_url_here" : "paste_tiktok_url_here";
  };

  const validateInput = (): boolean => {
    if (!inputValue.trim()) {
      toast({
        title: "ERROR.EMPTY_INPUT",
        description: "Please provide a URL or search query",
        variant: "destructive",
      });
      return false;
    }

    if (downloadType !== "search") {
      if (platform === "youtube" && !inputValue.includes("youtu")) {
        toast({
          title: "ERROR.INVALID_URL",
          description: "Please provide a valid YouTube URL",
          variant: "destructive",
        });
        return false;
      }
      if (platform === "tiktok" && !inputValue.includes("tiktok")) {
        toast({
          title: "ERROR.INVALID_URL",
          description: "Please provide a valid TikTok URL",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleDownload = async () => {
    if (!validateInput()) return;

    setDownloadState({ status: "processing", progress: 0, message: "INITIALIZING_CONNECTION..." });
    addConsoleLine(`> INIT ${platform.toUpperCase()} ${downloadType.toUpperCase()} PROTOCOL`);
    addConsoleLine(`> TARGET: ${inputValue.slice(0, 50)}${inputValue.length > 50 ? '...' : ''}`);

    try {
      const endpoint = `/api/${platform}/${downloadType}`;
      const body = downloadType === "search" 
        ? { query: inputValue }
        : { url: inputValue };

      addConsoleLine(`> CONNECTING TO API ENDPOINT...`);
      setDownloadState({ status: "processing", progress: 20, message: "ESTABLISHING_SECURE_CONNECTION..." });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = "Download failed";
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      addConsoleLine(`> CONNECTION_ESTABLISHED`);
      setDownloadState({ status: "downloading", progress: 50, message: "EXTRACTING_MEDIA_STREAM..." });

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${platform}_${downloadType}_${Date.now()}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
        if (match) filename = match[1];
      }

      const ext = downloadType === "audio" ? ".mp3" : ".mp4";
      if (!filename.includes(".")) filename += ext;

      addConsoleLine(`> DOWNLOADING: ${filename}`);
      setDownloadState({ status: "downloading", progress: 70, message: "STREAMING_DATA..." });

      const blob = await response.blob();
      
      if (blob.size < 1024) {
        throw new Error("Downloaded file is too small - may be invalid");
      }

      addConsoleLine(`> DOWNLOAD_COMPLETE: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
      setDownloadState({ status: "complete", progress: 100, message: "DOWNLOAD.COMPLETE", filename });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addConsoleLine(`> FILE_SAVED: ${filename}`);
      
      toast({
        title: "DOWNLOAD.SUCCESS",
        description: `${filename} downloaded successfully`,
      });
    } catch (error: any) {
      addConsoleLine(`> ERROR: ${error.message}`);
      setDownloadState({ 
        status: "error", 
        progress: 0, 
        message: `ERROR: ${error.message}` 
      });
      toast({
        title: "ERROR.DOWNLOAD_FAILED",
        description: error.message || "Failed to process download request",
        variant: "destructive",
      });
    }
  };

  const resetState = () => {
    setDownloadState({ status: "idle", progress: 0, message: "" });
    setInputValue("");
    setConsoleLines([]);
  };

  const features = [
    {
      icon: Video,
      title: "YOUTUBE VIDEO",
      description: "Extract high-quality MP4 videos from any YouTube URL with maximum resolution support",
      platform: "youtube" as const,
    },
    {
      icon: Music,
      title: "YOUTUBE AUDIO",
      description: "Rip pure MP3 audio tracks from YouTube videos for offline listening",
      platform: "youtube" as const,
    },
    {
      icon: Search,
      title: "YOUTUBE SEARCH",
      description: "Search by title or artist and download audio directly without URL",
      platform: "youtube" as const,
    },
    {
      icon: Video,
      title: "TIKTOK VIDEO",
      description: "Download watermark-free TikTok videos in HD quality instantly",
      platform: "tiktok" as const,
    },
    {
      icon: Music,
      title: "TIKTOK AUDIO",
      description: "Extract soundtracks and music from any TikTok video",
      platform: "tiktok" as const,
    },
    {
      icon: Search,
      title: "TIKTOK SEARCH",
      description: "Search TikTok by username and browse latest videos to download",
      platform: "tiktok" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />
      
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/20 backdrop-blur-md bg-background/80">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between gap-4 h-14">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                <span className="font-mono text-sm uppercase tracking-wider text-primary glitch-text" data-testid="text-logo">
                  CYBERDOWNLOAD
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary" data-testid="badge-status">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
                  SYSTEM.ONLINE
                </Badge>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block mb-6">
                <TerminalHeader title="DOWNLOAD_PROTOCOL.exe" />
                <div className="bg-card/90 border border-primary/30 p-6 md:p-8 rounded-b-md">
                  <h1 className="font-mono text-2xl md:text-4xl lg:text-5xl text-primary uppercase tracking-wide mb-4" data-testid="text-hero-title">
                    {typedText}
                    <span className="animate-cursor-blink">_</span>
                  </h1>
                  <p className="font-mono text-sm md:text-base text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-description">
                    Extract media from YouTube & TikTok via secure API endpoints.
                    <br />
                    No registration required. Direct download. Military-grade efficiency.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Download Interface */}
        <section className="pb-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-primary/30 bg-card/95 backdrop-blur-sm overflow-visible">
                <div className="p-6 md:p-8">
                  {/* Platform Tabs */}
                  <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)} className="mb-6">
                    <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-primary/20">
                      <TabsTrigger 
                        value="youtube" 
                        className="font-mono uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        data-testid="tab-youtube"
                      >
                        <SiYoutube className="w-4 h-4 mr-2" />
                        YOUTUBE
                      </TabsTrigger>
                      <TabsTrigger 
                        value="tiktok"
                        className="font-mono uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        data-testid="tab-tiktok"
                      >
                        <SiTiktok className="w-4 h-4 mr-2" />
                        TIKTOK
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Download Type Selector */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(["video", "audio", "search"] as DownloadType[]).map((type) => (
                      <Button
                        key={type}
                        variant={downloadType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDownloadType(type)}
                        className="font-mono uppercase tracking-wider"
                        data-testid={`button-type-${type}`}
                      >
                        {type === "video" && <Video className="w-4 h-4 mr-2" />}
                        {type === "audio" && <Music className="w-4 h-4 mr-2" />}
                        {type === "search" && <Search className="w-4 h-4 mr-2" />}
                        {type}
                      </Button>
                    ))}
                  </div>

                  {/* Input Field */}
                  <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono text-lg">
                      {">"}
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleDownload()}
                      placeholder={getPlaceholder()}
                      className="terminal-input w-full pl-10 h-14 text-base"
                      disabled={downloadState.status === "processing" || downloadState.status === "downloading"}
                      data-testid="input-url"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <Button
                      onClick={handleDownload}
                      disabled={downloadState.status === "processing" || downloadState.status === "downloading"}
                      className="flex-1 min-w-[200px] h-12 font-mono uppercase tracking-wider animate-glow-pulse"
                      data-testid="button-download"
                    >
                      {downloadState.status === "processing" || downloadState.status === "downloading" ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          EXECUTE DOWNLOAD
                        </>
                      )}
                    </Button>
                    {downloadState.status !== "idle" && (
                      <Button
                        variant="outline"
                        onClick={resetState}
                        className="h-12 font-mono uppercase tracking-wider"
                        data-testid="button-reset"
                      >
                        <X className="w-5 h-5 mr-2" />
                        RESET
                      </Button>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <AnimatePresence>
                    {downloadState.status !== "idle" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6"
                      >
                        <DownloadProgress 
                          status={downloadState.status}
                          progress={downloadState.progress}
                          message={downloadState.message}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Console Output */}
                  <AnimatePresence>
                    {consoleLines.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6"
                      >
                        <ConsoleOutput lines={consoleLines} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 md:px-8 border-t border-primary/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-mono text-xl md:text-2xl text-primary uppercase tracking-wider mb-4" data-testid="text-features-title">
                {"// AVAILABLE_PROTOCOLS"}
              </h2>
              <p className="font-mono text-sm text-muted-foreground max-w-xl mx-auto">
                Six extraction protocols at your disposal. Select platform. Choose format. Execute.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    platform={feature.platform}
                    onClick={() => {
                      setPlatform(feature.platform);
                      setDownloadType(feature.title.includes("VIDEO") ? "video" : feature.title.includes("AUDIO") ? "audio" : "search");
                      inputRef.current?.focus();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Specs Section */}
        <section className="py-16 px-4 md:px-8 border-t border-primary/10 bg-card/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* API Endpoints */}
              <Card className="border-primary/20 bg-card/80">
                <div className="p-6">
                  <h3 className="font-mono text-lg text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    API_ENDPOINTS
                  </h3>
                  <div className="space-y-2 font-mono text-xs text-muted-foreground">
                    <div className="p-2 bg-background/50 rounded border border-primary/10">
                      <span className="text-primary">POST</span> /api/youtube/video
                    </div>
                    <div className="p-2 bg-background/50 rounded border border-primary/10">
                      <span className="text-primary">POST</span> /api/youtube/audio
                    </div>
                    <div className="p-2 bg-background/50 rounded border border-primary/10">
                      <span className="text-primary">POST</span> /api/youtube/search
                    </div>
                    <div className="p-2 bg-background/50 rounded border border-primary/10">
                      <span className="text-primary">POST</span> /api/tiktok/video
                    </div>
                    <div className="p-2 bg-background/50 rounded border border-primary/10">
                      <span className="text-primary">POST</span> /api/tiktok/audio
                    </div>
                    <div className="p-2 bg-background/50 rounded border border-primary/10">
                      <span className="text-primary">POST</span> /api/tiktok/search
                    </div>
                  </div>
                </div>
              </Card>

              {/* Supported Formats */}
              <Card className="border-primary/20 bg-card/80">
                <div className="p-6">
                  <h3 className="font-mono text-lg text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    SUPPORTED_FORMATS
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground mb-2 uppercase">Video</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">MP4</Badge>
                        <Badge variant="secondary" className="font-mono text-xs">WEBM</Badge>
                        <Badge variant="secondary" className="font-mono text-xs">1080p</Badge>
                        <Badge variant="secondary" className="font-mono text-xs">720p</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-xs text-muted-foreground mb-2 uppercase">Audio</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">MP3</Badge>
                        <Badge variant="secondary" className="font-mono text-xs">M4A</Badge>
                        <Badge variant="secondary" className="font-mono text-xs">320kbps</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-primary/10">
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span>SECURE_CONNECTION</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>FAST_PROCESSING</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 md:px-8 border-t border-primary/10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-5 h-5 text-primary" />
                  <span className="font-mono text-sm uppercase tracking-wider text-primary">CYBERDOWNLOAD</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  Professional-grade media extraction tool. Built for efficiency.
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">QUICK_LINKS</p>
                <div className="space-y-2 font-mono text-xs">
                  <a href="#" className="block text-foreground/80 hover:text-primary transition-colors">About</a>
                  <a href="#" className="block text-foreground/80 hover:text-primary transition-colors">API Documentation</a>
                  <a href="#" className="block text-foreground/80 hover:text-primary transition-colors">System Status</a>
                </div>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">SYSTEM_STATUS</p>
                <div className="space-y-2 font-mono text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    <span>API: OPERATIONAL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    <span>UPTIME: 99.9%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-primary/10 text-center">
              <p className="font-mono text-xs text-muted-foreground">
                {new Date().getFullYear()} CYBERDOWNLOAD // ALL_RIGHTS_RESERVED
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
