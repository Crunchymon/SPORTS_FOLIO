"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { 
  Sparkles, 
  TrendingUp, 
  Wallet, 
  ShieldCheck, 
  ArrowRight,
  Activity,
  ArrowUpRight,
  ChevronRight,
  LineChart
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 font-sans text-slate-900 overflow-x-hidden">
      {/* Global Background Elements */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-br from-indigo-50/50 via-white to-white -z-10" />
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] -z-10 mix-blend-multiply" />
      <div className="absolute top-40 left-0 -translate-x-1/3 w-[600px] h-[600px] bg-blue-50/60 rounded-full blur-[120px] -z-10 mix-blend-multiply" />

      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <nav className="flex items-center justify-between h-20 px-6 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">SportsFolio</span>
            </Link>
          </div>
          <div className="flex gap-x-6 lg:justify-end items-center">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className={buttonVariants({ className: "rounded-full shadow-lg shadow-indigo-500/20 h-11 px-6 font-bold hover:shadow-indigo-500/30 transition-all flex items-center" })}>
              Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-32 pb-16">
        {/* --- HERO SECTION --- */}
        <section className="relative px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4" />
            <span>Welcome to the future of sports investing.</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Trade athletes like{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              stocks
            </span>.
          </h1>
          
          <p className="mt-6 text-xl md:text-2xl leading-relaxed text-slate-500 max-w-2xl font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Build your portfolio, track live performance, and capture real upside using algorithmic bonding curves.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/signup" className={buttonVariants({ size: "lg", className: "rounded-full h-14 px-8 text-lg w-full sm:w-auto shadow-xl shadow-indigo-600/20 group hover:shadow-indigo-600/40 hover:-translate-y-1 transition-all duration-300 flex items-center font-bold" })}>
              Start Trading
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <Link href="/market" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full h-14 px-8 text-lg w-full sm:w-auto font-bold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center" })}>
              View Market
            </Link>
          </div>

          {/* --- PRODUCT PREVIEW MOCKUP --- */}
          <div className="mt-20 w-full max-w-5xl mx-auto relative perspective-1000 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            {/* Soft backdrop blur for the mockup */}
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 blur-2xl rounded-[3rem] -z-10" />
            
            <div className="rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col transform-gpu transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(79,70,229,0.15)] ring-1 ring-white/50">
              
              {/* Fake App Header */}
              <div className="h-14 border-b border-slate-100 flex items-center px-6 justify-between bg-white/40">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="h-6 w-48 bg-slate-100 rounded-full flex items-center px-3 gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <div className="h-2 w-32 bg-slate-200 rounded-full" />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" />
              </div>

              {/* Fake App Body */}
              <div className="flex flex-1 p-6 md:p-8 gap-8 bg-slate-50/50">
                {/* Fake Sidebar */}
                <div className="w-48 hidden md:flex flex-col gap-4">
                  <div className="h-10 w-full bg-indigo-50 rounded-xl flex items-center px-4 border border-indigo-100/50">
                     <div className="h-3 w-24 bg-indigo-600/20 rounded-full" />
                  </div>
                  <div className="h-10 w-full bg-white rounded-xl border border-slate-100 flex items-center px-4">
                     <div className="h-3 w-16 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-10 w-full bg-white rounded-xl border border-slate-100 flex items-center px-4">
                     <div className="h-3 w-20 bg-slate-200 rounded-full" />
                  </div>
                </div>

                {/* Fake Main Content */}
                <div className="flex-1 flex flex-col gap-6">
                  {/* Portfolio Value & Graph */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Value</div>
                      <div className="text-4xl font-black text-slate-800 tracking-tight">₹1,24,500<span className="text-xl text-slate-400">.00</span></div>
                      <div className="flex items-center gap-1.5 mt-3 text-green-600 bg-green-50 w-fit px-2.5 py-1 rounded-md font-bold text-sm">
                        <ArrowUpRight className="w-4 h-4" />
                        +12.4% (₹15,400)
                      </div>
                    </div>
                    
                    {/* Simulated SVG Graph */}
                    <div className="h-24 w-full md:w-64 relative">
                      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="chartG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <path d="M0,100 L0,70 Q10,80 20,60 T40,40 T60,50 T80,20 T100,10 L100,100 Z" fill="url(#chartG)" />
                        <path d="M0,70 Q10,80 20,60 T40,40 T60,50 T80,20 T100,10" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Athlete Holdings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {/* Card 1 */}
                     <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">VK</div>
                         <div>
                           <div className="font-bold text-slate-800">Virat K.</div>
                           <div className="text-sm text-slate-400 font-medium">Cricket</div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="font-bold text-slate-800">50 TOK</div>
                         <div className="text-sm font-bold text-green-500">₹45.00</div>
                       </div>
                     </div>
                     
                     {/* Card 2 */}
                     <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg">LM</div>
                         <div>
                           <div className="font-bold text-slate-800">Lionel M.</div>
                           <div className="text-sm text-slate-400 font-medium">Football</div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="font-bold text-slate-800">120 TOK</div>
                         <div className="text-sm font-bold text-green-500">₹1,204.00</div>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- TRUST STATS SECTION --- */}
        <section className="py-20 mt-10 w-full relative z-10 bg-white border-y border-slate-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h3 className="text-center text-sm font-bold tracking-widest text-slate-400 uppercase mb-12">
              Built for modern sports investing
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
              <div className="flex flex-col items-center">
                <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">10K+</div>
                <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wider">Active Users</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">₹1Cr+</div>
                <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wider">Traded Volume</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">50+</div>
                <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wider">Athletes</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">0ms</div>
                <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wider">Downtime</div>
              </div>
            </div>
          </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section className="py-32 relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-indigo-600 font-extrabold tracking-wide uppercase text-sm mb-3">Enterprise Grade</h2>
            <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Everything you need to trade.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Invest in Athletes</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Purchase tokens dynamically priced by automated market makers. Liquidate instantly.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Track Performance</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Analyze your portfolio metrics, historical buy prices, and net asset valuation.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <LineChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Real-time Trading</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Charts updated instantly via robust event queues handling high-frequency volume.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-200 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Secure Wallet</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Deposit and withdraw INR directly with enterprise-level idempotency security.
              </p>
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section className="py-20 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 overflow-hidden relative shadow-2xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-600/30 blur-[80px] rounded-full" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
              
              <div className="md:w-1/3">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">
                  Simple.<br/>Powerful.
                </h2>
                <p className="text-indigo-200 text-lg font-medium">
                  We abstracted the complexity of algorithmic bonding curves, so you can execute.
                </p>
              </div>

              <div className="md:w-2/3 flex flex-col sm:flex-row gap-6 relative">
                 {/* Step connectors for desktop */}
                 <div className="hidden sm:block absolute top-6 left-10 right-10 h-0.5 bg-slate-800 -z-10" />
                 
                 <div className="flex-1">
                   <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-lg shadow-indigo-600/30 mb-6">1</div>
                   <h4 className="text-white font-bold text-lg mb-2">Deposit Funds</h4>
                   <p className="text-slate-400 font-medium">Top up your INR wallet quickly via UTR transfers.</p>
                 </div>
                 
                 <div className="flex-1">
                   <div className="w-12 h-12 rounded-full bg-slate-800 text-white font-black flex items-center justify-center text-xl shadow-lg border border-slate-700 border-b-0 mb-6">2</div>
                   <h4 className="text-white font-bold text-lg mb-2">Buy Shares</h4>
                   <p className="text-slate-400 font-medium">Pick a promising athlete and acquire tokens instantly.</p>
                 </div>

                 <div className="flex-1">
                   <div className="w-12 h-12 rounded-full bg-slate-800 text-white font-black flex items-center justify-center text-xl shadow-lg border border-slate-700 border-b-0 mb-6">3</div>
                   <h4 className="text-white font-bold text-lg mb-2">Track & Profit</h4>
                   <p className="text-slate-400 font-medium">Monitor real-time demand and liquidate for INR.</p>
                 </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/60 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">SportsFolio</span>
          </div>
          
          <div className="flex gap-8">
            <span className="text-sm font-bold text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">Terms</span>
            <span className="text-sm font-bold text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">Privacy</span>
            <span className="text-sm font-bold text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
