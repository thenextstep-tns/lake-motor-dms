'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
    return (
        <header className="relative h-screen min-h-[600px] bg-black">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2500&auto=format&fit=crop"
                    alt="Luxury Car Background"
                    className="object-cover opacity-60"
                    fill
                    priority
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-start pt-20">
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                    LAKE MOTOR <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">GROUP</span>
                </h1>
                <p className="text-lg md:text-2xl text-gray-300 max-w-2xl mb-10 font-light leading-relaxed">
                    Exclusive access to verified luxury vehicles.
                    <span className="text-white font-semibold block mt-2">Financing available for all credit types.</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/public/inventory" className="px-10 py-4 bg-white text-black font-bold uppercase tracking-widest text-lg hover:bg-gray-200 transition-colors rounded-sm text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300">
                        View Inventory
                    </Link>
                    <a href="#contact" className="px-10 py-4 border border-white/30 text-white font-bold uppercase tracking-widest text-lg hover:bg-white/10 transition-colors rounded-sm text-center backdrop-blur-sm">
                        Contact Us
                    </a>
                </div>
            </div>
        </header>
    );
}
