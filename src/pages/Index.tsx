import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Expertise } from '@/components/Expertise';
import { AonSection } from '@/components/AonSection';
import { Articles } from '@/components/Articles';
import BlogArticles from '@/components/BlogArticles';
import { Testimonials } from '@/components/Testimonials';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <main className="overflow-x-hidden">
      <Header />
      <Hero />
      <About />
      <Expertise />
      <AonSection />
      <Articles />
      <BlogArticles />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;
