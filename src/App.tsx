import { Authenticated, Unauthenticated, useQuery, useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { useEffect, useState, FormEvent } from "react";
import { Toaster, toast } from "sonner";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Authenticated>
        <Dashboard />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Toaster />
    </div>
  );
}

function Dashboard() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [location, setLocation] = useState<string>();
  const [showHistory, setShowHistory] = useState(false);
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const preferences = useQuery(api.neo.getPreferences, 
    loggedInUser ? { userId: loggedInUser._id } : "skip"
  );
  const conversation = useQuery(api.neo.getConversationHistory, 
    loggedInUser ? { userId: loggedInUser._id } : "skip"
  );
  const processCommand = useAction(api.neo.processCommand);
  const updatePreferences = useMutation(api.neo.updatePreferences);

  useEffect(() => {
    if (!loggedInUser || !isListening) return;
    
    let recognition: SpeechRecognition | null = null;
    
    if ('webkitSpeechRecognition' in window) {
      recognition = new webkitSpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = async (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setTranscript(transcript);
        
        const isFinal = event.results[event.results.length - 1].isFinal;
        if (isFinal) {
          try {
            await processCommand({
              command: transcript,
              userId: loggedInUser._id,
              location,
            });
          } catch (error) {
            toast.error("Fehler bei der Verarbeitung des Befehls");
          }
          setTranscript("");
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error("Fehler bei der Spracherkennung");
      };

      recognition.onend = () => {
        if (isListening) {
          recognition?.start();
        }
      };

      recognition.start();
    } else {
      toast.error("Spracherkennung wird von deinem Browser nicht unterstützt");
      setIsListening(false);
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [loggedInUser, isListening, processCommand, location]);

  const handleTextSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!loggedInUser || !textInput.trim()) return;

    try {
      await processCommand({
        command: textInput,
        userId: loggedInUser._id,
        location,
      });
      setTextInput("");
    } catch (error) {
      toast.error("Fehler bei der Verarbeitung des Befehls");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black font-mono text-[#00ff99] relative overflow-hidden">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
          
          @keyframes subtleGlow {
            0% { background-color: #000000; }
            100% { background-color: #0a0a0a; }
          }
          
          @keyframes fall {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          
          @keyframes glowText {
            from { text-shadow: 0 0 10px #00ff99; }
            to { text-shadow: 0 0 20px #00ffcc; }
          }
          
          .matrix-bg {
            background: radial-gradient(circle, rgba(0,255,153,0.1) 0%, rgba(0,0,0,1) 100%);
          }
          
          .matrix-glow {
            text-shadow: 0 0 15px #00ff99;
          }
          
          .matrix-box-glow {
            box-shadow: 0 0 20px #00ff99;
          }
        `}
      </style>

      {/* Background with Matrix effect */}
      <div className="fixed inset-0 matrix-bg">
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="absolute writing-vertical text-xs animate-fall" style={{
              left: `${i * 14}%`,
              animationDelay: `${i * 0.5}s`
            }}>
              アイウエオカキク0123
            </span>
          ))}
        </div>
      </div>

      {/* Clock and History Button */}
      <div className="absolute top-5 right-8 bg-[#111] px-4 py-1 rounded-lg border border-[#00ff99] matrix-box-glow text-xl">
        {new Date().toLocaleTimeString('de-DE', { hour12: false })}
      </div>
      
      <button 
        onClick={() => setShowHistory(!showHistory)}
        className="absolute top-5 left-8 bg-[#111] px-3 py-1 rounded-lg border border-[#00ff99] matrix-box-glow cursor-pointer"
      >
        📜 Verlauf
      </button>

      {showHistory && (
        <div className="absolute top-16 left-8 bg-[#111] p-4 border border-[#00ff99] rounded-lg w-[300px] max-h-[400px] overflow-y-auto matrix-box-glow">
          {conversation?.map((msg) => (
            <div key={msg._id} className="mb-2">
              <span className="opacity-50">{new Date(msg.timestamp).toLocaleTimeString()}: </span>
              {msg.message}
            </div>
          ))}
        </div>
      )}

      {/* Main Title Box */}
      <div className="relative z-10 w-full max-w-[600px] h-[200px] bg-black border-2 border-[#00ff99] rounded-xl matrix-box-glow flex flex-col items-center justify-center mb-8">
        <div className="text-center animate-[glowText_6s_ease-in-out_infinite_alternate]">
          <h1 className="text-5xl font-bold tracking-[15px] m-0 matrix-glow">NEO</h1>
          <p className="mt-2 text-lg tracking-[5px] matrix-glow">AI ASSISTENT</p>
        </div>
      </div>

      {/* Output Display */}
      <div className="bg-[#0d0d0d] border border-[#00ff99] rounded-lg p-5 min-h-[120px] w-full max-w-[600px] matrix-box-glow mb-5 z-10">
        {transcript || "Frag etwas."}
      </div>

      {/* Mic Button and Text Input */}
      <button
        onClick={() => setIsListening(!isListening)}
        className={`w-[60px] h-[60px] text-2xl bg-[#0a0a0a] border-2 border-[#00ff99] rounded-full cursor-pointer transition-all matrix-box-glow z-10 mb-3 ${
          isListening ? 'bg-[#00ff99] text-black' : ''
        }`}
      >
        🎙️
      </button>

      <form onSubmit={handleTextSubmit} className="z-10">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Oder tippe deinen Befehl..."
          className="bg-black border border-[#00ff99] text-[#00ff99] px-3 py-2 w-[300px] rounded-lg font-mono text-base matrix-box-glow"
        />
      </form>

      {/* Matrix Note */}
      <div className="absolute bottom-2 right-8 text-sm opacity-40 italic matrix-glow">
        Wake up… the Matrix has you.
      </div>

      {/* Settings */}
      <div className="absolute top-5 right-40 flex gap-2">
        <button
          onClick={() => updatePreferences({
            userId: loggedInUser!._id,
            outputMode: preferences?.outputMode === "voice" ? "text" : "voice",
          })}
          className="bg-[#111] px-3 py-1 rounded-lg border border-[#00ff99] matrix-box-glow"
        >
          {preferences?.outputMode === "voice" ? "🔊" : "📝"}
        </button>
        <SignOutButton />
      </div>
    </div>
  );
}
