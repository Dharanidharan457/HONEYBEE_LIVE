
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Wind, 
  ShieldCheck, 
  AlertTriangle, 
  MessageCircle,
  X,
  Send,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface HiveData {
  time: string;
  temp: number;
  humidity: number;
  weight: number;
  activity: number;
}

interface Message {
  role: 'user' | 'bee';
  text: string;
}

// --- Mock Data Generator ---
const generateMockData = (): HiveData[] => {
  const data: HiveData[] = [];
  const now = new Date();
  for (let i = 12; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: 34 + Math.random() * 2,
      humidity: 50 + Math.random() * 10,
      weight: 45 + Math.random() * 0.5,
      activity: Math.floor(70 + Math.random() * 30),
    });
  }
  return data;
};

// --- Main App Component ---
export default function App() {
  const [hiveHistory, setHiveHistory] = useState<HiveData[]>(generateMockData());
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bee', text: "Bzzzt! Hello Beekeeper! I'm Honey, your hive assistant. How can I help you today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Simulation of real-time data from ESP32
  useEffect(() => {
    const interval = setInterval(() => {
      setHiveHistory(prev => {
        const newData = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: 34 + Math.random() * 2,
          humidity: 50 + Math.random() * 10,
          weight: 45 + Math.random() * 0.2,
          activity: Math.floor(70 + Math.random() * 30),
        };
        return [...prev.slice(1), newData];
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentStatus = hiveHistory[hiveHistory.length - 1];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are "Honey", a tiny helpful honey bee AI assistant for a smart beehive monitoring system. 
        The current hive stats are: Temp ${currentStatus.temp.toFixed(1)}°C, Humidity ${currentStatus.humidity.toFixed(1)}%, 
        Activity ${currentStatus.activity}%. 
        Answer the following user query in a friendly, "buzzy" tone (use some bzzzt sounds occasionally) but keep it professional and scientific regarding bee health.
        
        User: ${userText}`,
        config: {
          systemInstruction: "You are a smart bee assistant named Honey. Be helpful and expert in apiary management."
        }
      });

      const reply = response.text || "Bzzzt... I'm having trouble connecting to the hive mind. Try again?";
      setMessages(prev => [...prev, { role: 'bee', text: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bee', text: "Bzzzt... My wings are tired. Please check your connection!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 honey-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">BeeGuard AI</h1>
            <p className="text-xs text-stone-500 font-medium uppercase tracking-widest">Hive Dashboard v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
              <ShieldCheck size={14} /> System Online
            </span>
            <span className="text-xs text-stone-400">ESP32-Node-01 Connected</span>
          </div>
          <button 
            onClick={() => setIsBotOpen(true)}
            className="p-2 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors"
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Status Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard 
            title="Temperature" 
            value={`${currentStatus.temp.toFixed(1)}°C`} 
            icon={<Thermometer className="text-orange-500" />} 
            status={currentStatus.temp > 38 || currentStatus.temp < 32 ? 'alert' : 'stable'}
            trend="+0.2"
          />
          <StatusCard 
            title="Humidity" 
            value={`${currentStatus.humidity.toFixed(0)}%`} 
            icon={<Droplets className="text-blue-500" />} 
            status="stable"
            trend="-1.5"
          />
          <StatusCard 
            title="Hive Weight" 
            value={`${currentStatus.weight.toFixed(2)} kg`} 
            icon={<Wind className="text-indigo-500" />} 
            status="stable"
            trend="+0.05"
          />
          <StatusCard 
            title="Colony Activity" 
            value={`${currentStatus.activity}%`} 
            icon={<Activity className="text-amber-500" />} 
            status={currentStatus.activity < 50 ? 'warning' : 'stable'}
            trend="High"
          />
        </section>

        {/* Analytics Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                Live Health Metrics
              </h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-stone-100 rounded-full text-xs font-medium text-stone-600 cursor-pointer">12h</span>
                <span className="px-3 py-1 bg-amber-500 rounded-full text-xs font-medium text-white cursor-pointer">Live</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hiveHistory}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="time" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="temp" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={3} />
                  <Area type="monotone" dataKey="activity" stroke="#10b981" fillOpacity={0.05} fill="#10b981" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
              <h3 className="text-amber-800 font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={18} />
                Health Alerts
              </h3>
              <div className="space-y-3">
                <AlertItem 
                  type="info" 
                  title="Steady Harvest" 
                  desc="Weight increasing steadily. Consider checking super frames." 
                />
                <AlertItem 
                  type="warning" 
                  title="Nocturnal Activity" 
                  desc="High activity detected at night. Potential predator alert." 
                />
              </div>
            </div>

            <div className="bg-stone-900 rounded-3xl p-6 text-white overflow-hidden relative group cursor-pointer" onClick={() => setIsBotOpen(true)}>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Ask Honey AI</h3>
                <p className="text-stone-400 text-sm mb-4">"Honey, why is the temperature rising in Hive 01?"</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                  <span className="text-xs font-bold uppercase">Launch Bot</span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform">
                 <BeeIcon size={120} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Honey Bee Bot Drawer */}
      {isBotOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-6 bg-black/20 backdrop-blur-sm transition-all">
          <div className="bg-white w-full sm:w-[400px] h-full sm:h-[600px] sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
            {/* Bot Header */}
            <div className="p-4 border-b flex items-center justify-between honey-gradient sm:rounded-t-3xl text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-float">
                  <BeeIcon size={24} color="white" />
                </div>
                <div>
                  <h3 className="font-bold">Honey Assistant</h3>
                  <p className="text-[10px] uppercase opacity-80 tracking-widest font-bold">Bee AI Powered</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBotOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-amber-600 text-white rounded-br-none' 
                      : 'bg-white text-stone-700 rounded-bl-none border border-stone-100'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-stone-100 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t bg-white sm:rounded-b-3xl">
              <div className="relative">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about hive health..."
                  className="w-full pl-4 pr-12 py-3 bg-stone-100 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-center text-stone-400 mt-3 font-medium">Powered by BeeGuard AI Engine</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Honey Action */}
      {!isBotOpen && (
        <button 
          onClick={() => setIsBotOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 honey-gradient rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform animate-float z-40 group"
        >
          <div className="absolute -top-10 right-0 bg-white text-stone-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            Bzzzt! Need help?
          </div>
          <BeeIcon size={32} color="white" />
        </button>
      )}
    </div>
  );
}

// --- Helper Components ---

const StatusCard = ({ title, value, icon, status, trend }: any) => (
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-stone-50 rounded-2xl">{icon}</div>
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
        status === 'alert' ? 'bg-red-100 text-red-600' : 
        status === 'warning' ? 'bg-amber-100 text-amber-600' : 
        'bg-green-100 text-green-600'
      }`}>
        {status}
      </span>
    </div>
    <div className="space-y-1">
      <p className="text-stone-400 text-sm font-medium">{title}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl font-bold">{value}</h4>
        <span className="text-xs text-stone-500">{trend}</span>
      </div>
    </div>
  </div>
);

const AlertItem = ({ type, title, desc }: any) => (
  <div className={`p-4 rounded-2xl border ${
    type === 'warning' ? 'bg-white border-amber-200' : 'bg-white border-blue-100'
  }`}>
    <div className="flex gap-3">
      <div className={`w-2 h-2 rounded-full mt-1.5 ${
        type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
      }`}></div>
      <div>
        <h5 className="text-sm font-bold text-stone-800">{title}</h5>
        <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
      </div>
    </div>
  </div>
);

const BeeIcon = ({ size = 24, color = "currentColor" }: { size?: number, color?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2z"/>
    <path d="M7 12h10"/>
    <path d="M10 7l2 2 2-2"/>
    <path d="M10 17l2-2 2 2"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
