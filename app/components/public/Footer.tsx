'use client';

import Link from 'next/link';

export default function Footer() {
    return (
        <footer id="contact" className="bg-black border-t border-gray-900 pt-20 pb-24 md:pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
                    <div>
                        <h3 className="text-4xl font-bold text-white mb-6">LAKE MOTOR GROUP</h3>
                        <p className="text-gray-400 mb-6 max-w-md leading-relaxed text-lg">Your trusted local dealership for pre-owned luxury and performance vehicles.</p>
                        <div className="flex space-x-4">
                            {/* Social Links could go here */}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <h4 className="text-white font-bold uppercase tracking-wider mb-4 text-base">Visit the Dealership</h4>
                            <address className="text-gray-400 not-italic leading-relaxed text-base">
                                1036 Reder Road<br />Griffith, IN 46319<br />
                                <a href="https://maps.google.com/?q=1036+Reder+Road,+Griffith+IN+46319" target="_blank" className="text-red-600 hover:underline mt-2 inline-block">Get Directions →</a>
                            </address>
                        </div>
                        <div>
                            <h4 className="text-white font-bold uppercase tracking-wider mb-4 text-base">Contact</h4>
                            <p className="text-gray-400 text-base mb-2">Phone: <a href="tel:2192190330" className="text-white hover:text-red-600 transition-colors">219-219-0330</a></p>
                            <p className="text-gray-400 text-base">Email: <a href="mailto:sales@lakemotorgroup.com" className="text-white hover:text-red-600">sales@lakemotorgroup.com</a></p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-8 mt-8 text-xs text-gray-600 text-justify leading-relaxed">
                    <p className="mb-4">This vehicle is subject to prior sale. The pricing, equipment, specifications, and photos presented are believed to be accurate, but are provided &quot;AS IS&quot; and are subject to change without notice.</p>
                </div>
            </div>
        </footer>
    );
}
