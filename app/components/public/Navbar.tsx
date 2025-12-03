'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed w-full z-50 bg-black/95 backdrop-blur-md border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <Link href="/" className="flex items-center cursor-pointer">
                        {/* <i className="fa-solid fa-gauge-high text-red-600 text-3xl mr-2"></i> */}
                        <div className="flex flex-col ml-2">
                            <span className="font-bold text-xl md:text-2xl text-white tracking-wider leading-none">LAKE MOTOR <span className="text-red-600">GROUP</span></span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Griffith, IN</span>
                        </div>
                    </Link>

                    <div className="hidden md:flex space-x-8 items-center">
                        <Link href="/public/inventory" className="text-gray-300 hover:text-red-600 transition-colors uppercase text-sm font-medium tracking-widest">Inventory</Link>
                        <Link href="/#faq" className="text-gray-300 hover:text-red-600 transition-colors uppercase text-sm font-medium tracking-widest">FAQ</Link>
                        <a href="tel:2192190330" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-sm font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-600/20">
                            Call Now
                        </a>
                    </div>

                    <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:text-red-600 focus:outline-none">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-black border-b border-gray-800">
                    <div className="px-4 pt-2 pb-4 space-y-2">
                        <Link href="/public/inventory" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-red-600 py-2 uppercase">Inventory</Link>
                        <Link href="/#faq" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-red-600 py-2 uppercase">FAQ</Link>
                        <a href="tel:2192190330" className="block bg-red-600 text-white text-center py-3 rounded font-bold uppercase">Call Dealership</a>
                    </div>
                </div>
            )}
        </nav>
    );
}
