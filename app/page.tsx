import Navbar from '@/app/components/public/Navbar';
import Hero from '@/app/components/public/Hero';
import Footer from '@/app/components/public/Footer';

export default function Home() {
  return (
    <div className="bg-black min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />

        {/* Featured Section (Optional - can be added later) */}
        <section className="py-20 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 uppercase tracking-wider">Experience Excellence</h2>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed mb-10">
              At Lake Motor Group, we pride ourselves on offering a curated selection of high-quality vehicles.
              Our transparent pricing and commitment to customer satisfaction make us the premier choice for your next vehicle.
            </p>
            <a href="/public/inventory" className="inline-block border-2 border-white text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300">
              Browse Collection
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
